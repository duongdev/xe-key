import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  focusManager,
  onlineManager,
  QueryCache,
  QueryClient,
  type QueryKey,
  useQuery,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFocusEffect } from "expo-router";
import { type ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import { AppState } from "react-native";
import { usePrefs } from "../prefs";
import { withSeen } from "./alert-seen";
import type { CarAlert, CarService, CarStatus } from "./car";
import { SignedOut } from "./honda";
import { liveCar } from "./live-car";
import { mockCar } from "./mock-car";
import { hondaPin } from "./secret";
import { pickSnapshot } from "./snapshot";
import { tripCache } from "./trip-cache";

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)),
);
// Refetch stale data when the app comes back to the foreground.
focusManager.setEventListener((setFocused) => {
  const sub = AppState.addEventListener("change", (s) => setFocused(s === "active"));
  return () => sub.remove();
});

export const queryClient = new QueryClient({
  // A session that cannot be restored takes the saved car data with it.
  queryCache: new QueryCache({ onError: (e) => e instanceof SignedOut && wipeCache() }),
  defaultOptions: { queries: { gcTime: 7 * 24 * 3_600_000, staleTime: 30_000, retry: 1 } },
});

// AsyncStorage is not encrypted and is in device backups: only the car snapshot is saved, and
// without its GPS position (alerts and trips are re-fetched on open).
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "query.v1",
  serialize: (client) =>
    JSON.stringify({
      ...client,
      clientState: {
        ...client.clientState,
        queries: client.clientState.queries.map((q) => {
          const car = q.state.data as CarStatus | undefined;
          return car ? { ...q, state: { ...q.state, data: { ...car, location: undefined } } } : q;
        }),
      },
    }),
});

/** Alerts with the user's own "marked read" applied (Honda can't store it). */
export async function loadAlerts(): Promise<CarAlert[]> {
  return withSeen(await carService.alerts());
}

/** Pull-to-refresh: a fresh read through the same checks as every other read. */
export function refreshCar() {
  return queryClient.fetchQuery({ queryKey: CAR_KEY, queryFn: carStatus, staleTime: 0 });
}

/** After a new sign-in (maybe another account): drop everything so Home loads fresh. */
export function forgetCar() {
  queryClient.clear();
  // Places, routes and the Honda PIN belong to the old account.
  tripCache.clear();
  hondaPin.del().catch(() => {});
}

/** Sign-out and lost sessions: forget the car in memory and on disk. */
export function wipeCache() {
  queryClient.clear();
  persister.removeClient();
}

let impl: CarService = liveCar;

/** Mock or live per Settings › Developer; release builds are always live. Swaps before children fetch. */
function CarServiceGate({ children }: { children: ReactNode }) {
  const { prefs } = usePrefs();
  const next = __DEV__ && prefs.honda === "mock" ? mockCar : liveCar;
  useLayoutEffect(() => {
    if (impl === next) return;
    impl = next;
    queryClient.clear();
  }, [next]);
  return children;
}
export const carService: CarService = {
  status: () => impl.status(),
  command: (...a) => impl.command(...a),
  trips: () => impl.trips(),
  summary: () => impl.summary(),
  dayTrips: (day) => impl.dayTrips(day),
  verifyPin: (pin) => impl.verifyPin(pin),
  tripDetail: (id) => impl.tripDetail(id),
  forgetPin: () => impl.forgetPin(),
  hondaCar: () => impl.hondaCar(),
  alerts: () => impl.alerts(),
  deleteAlert: (id) => impl.deleteAlert(id),
};
/** Bump when CarStatus changes shape so old cached data is dropped. */
const CACHE_VERSION = "5";

export const CAR_KEY = ["car"] as const;
export const ALERTS_KEY = ["alerts"] as const;

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: CACHE_VERSION,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.queryKey[0] === CAR_KEY[0] &&
            q.state.status === "success" &&
            (q.state.data as CarStatus | undefined)?.account !== "signed-out",
        },
      }}
    >
      <CarServiceGate>{children}</CarServiceGate>
    </PersistQueryClientProvider>
  );
}

/** A blank snapshot for the signed-out screen when nothing was cached. */
const NO_CAR: CarStatus = {
  model: "",
  plate: null,
  doors: "locked",
  engine: { on: false },
  startsLeft: null,
  body: { doorsOpen: null, windowsCm: null, trunkOpen: false, hoodOpen: false },
  cabinC: null,
  fuelPct: 0,
  rangeKm: 0,
  batteryV: null,
  odometerKm: null,
  serviceInKm: null,
  alerts: 0,
  updatedAt: 0,
  account: "ok",
  can: { lock: false, engine: false },
};

/**
 * Car status; a session that cannot be restored (password changed, or the account signed in on
 * another phone) becomes Home's signed-out state instead of an error, and the disk copy is dropped.
 */
async function carStatus(): Promise<CarStatus> {
  try {
    return pickSnapshot(queryClient.getQueryData<CarStatus>(CAR_KEY), await carService.status());
  } catch (e) {
    if (!(e instanceof SignedOut)) throw e;
    void persister.removeClient();
    // Nothing from this account (alerts, trips) outlives its session.
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== CAR_KEY[0] });
    const last = queryClient.getQueryData<CarStatus>(CAR_KEY) ?? NO_CAR;
    return { ...last, location: undefined, account: "signed-out", signedOutAt: Date.now() };
  }
}

/** Refetches the query when a screen comes back into focus and its data is stale. */
export function useRefreshOnFocus(queryKey: QueryKey) {
  const first = useRef(true);
  useFocusEffect(
    // biome-ignore lint/correctness/useExhaustiveDependencies: keys are constants
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      queryClient.refetchQueries({ queryKey, stale: true, type: "active" });
    }, []),
  );
}

export function useCar() {
  useRefreshOnFocus(CAR_KEY);
  return useQuery({
    queryKey: CAR_KEY,
    queryFn: carStatus,
    // Re-read every 60 s while the app is open (never in the background), so changes made elsewhere
    // (key fob, official app) show within a minute. Reads return Honda's stored copy and don't
    // wake the car (lastTimeCall only moves when the car reports, 2026-11-02).
    refetchInterval: 60_000,
  });
}
