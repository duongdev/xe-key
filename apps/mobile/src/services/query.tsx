import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { onlineManager, QueryClient, useQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import type { CarService } from "./car";
import { mockCar } from "./mock-car";

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)),
);

export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 7 * 24 * 3_600_000, retry: 1 } },
});

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "query.v1" });

// ponytail: one service until the live adapter lands (task 010 + Settings dev switch in 008).
export const carService: CarService = mockCar;
export const CAR_KEY = ["car"] as const;

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  );
}

export function useCar() {
  return useQuery({ queryKey: CAR_KEY, queryFn: () => carService.status() });
}
