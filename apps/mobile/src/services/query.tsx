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
import type { CarService, CarStatus } from "./car";
import { SignedOut } from "./honda";
import { liveCar } from "./live-car";
import { mockCar } from "./mock-car";

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
  // No polling while parked: each Honda read may wake the car's TCU (task 014, Q22).
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

/** After a new sign-in: drop any signed-out snapshot so Home loads the car fresh. */
export function forgetCar() {
  queryClient.removeQueries({ queryKey: CAR_KEY });
}

/** Sign-out and lost sessions: forget the car in memory and on disk. */
export function wipeCache() {
  queryClient.clear();
  persister.removeClient();
}

let impl: CarService = __DEV__ ? mockCar : liveCar;

/** Mock or live per Settings › Developer; release builds are always live. Swaps before children fetch. */
function CarServiceGate({ children }: { children: ReactNode }) {
  const { prefs } = usePrefs();
  const next = __DEV__ && prefs.api === "mock" ? mockCar : liveCar;
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
    return await carService.status();
  } catch (e) {
    if (!(e instanceof SignedOut)) throw e;
    void persister.removeClient();
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
    // While the engine runs the car reports about once a minute anyway: re-read so a stop or
    // extend made elsewhere shows, and the countdown tracks the car. Parked: no polling.
    refetchInterval: (q) => (q.state.data?.engine.on ? 60_000 : false),
  });
}
