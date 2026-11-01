import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  focusManager,
  onlineManager,
  QueryClient,
  type QueryKey,
  useQuery,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFocusEffect } from "expo-router";
import { type ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import { AppState } from "react-native";
import { usePrefs } from "../prefs";
import type { CarService } from "./car";
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
  // No polling while parked: each Honda read may wake the car's TCU (task 014, Q22).
  defaultOptions: { queries: { gcTime: 7 * 24 * 3_600_000, staleTime: 30_000, retry: 1 } },
});

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "query.v1" });

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
const CACHE_VERSION = "4";

export const CAR_KEY = ["car"] as const;

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, buster: CACHE_VERSION }}
    >
      <CarServiceGate>{children}</CarServiceGate>
    </PersistQueryClientProvider>
  );
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
    queryFn: () => carService.status(),
    // While the engine runs the car reports about once a minute anyway: re-read so a stop or
    // extend made elsewhere shows, and the countdown tracks the car. Parked: no polling.
    refetchInterval: (q) => (q.state.data?.engine.on ? 60_000 : false),
  });
}
