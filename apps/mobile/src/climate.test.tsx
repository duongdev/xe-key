import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { CarService, CarStatus } from "./services/car";
import { ToastProvider } from "./ui/toast";

jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));
jest.mock("expo-notifications", () => ({}));
jest.mock("expo-localization", () => ({ getLocales: () => [{ languageCode: "en" }] }));
jest.mock("./prefs", () => ({ usePrefs: () => ({ prefs: { language: "en" } }) }));
jest.mock("./theme/haptics", () => ({
  haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

const mockCar: CarStatus = {
  model: "HR-V",
  plate: "51K",
  doors: "locked",
  engine: { on: false },
  startsLeft: 2,
  body: {
    doorsOpen: { fl: false, fr: false, rl: false, rr: false },
    windowsCm: { fl: 0, fr: 0, rl: 0, rr: 0 },
    trunkOpen: false,
    hoodOpen: false,
  },
  cabinC: 34,
  fuelPct: 62,
  rangeKm: 418,
  location: null,
  batteryV: 12.4,
  odometerKm: 1,
  serviceInKm: 1,
  alerts: 0,
  updatedAt: Date.now(),
  account: "ok",
  can: { lock: true, engine: true },
};

let mockFinish: (() => void) | null = null;
const mockService: CarService = {
  status: async () => mockCar,
  trips: async () => [],
  summary: async () => ({ day: [], month: [], year: [] }),
  dayTrips: async () => [],
  verifyPin: async () => ({ ok: false, error: "other" }),
  tripDetail: async () => ({ route: [], from: null, to: null }),
  forgetPin: () => {},
  hondaCar: async () => ({
    model: "HR-V",
    year: null,
    vin: null,
    plate: null,
    color: null,
    photo: null,
  }),
  alerts: async () => [],
  deleteAlert: async () => {},
  command: (_kind, onEvent, opts) =>
    new Promise((resolve) => {
      onEvent({ type: "accepted" });
      mockFinish = () => {
        if (opts?.cancel?.cancelled) return resolve(null);
        onEvent({ type: "confirmed" });
        resolve({ ...mockCar, startsLeft: 1, engine: { on: true, endsAt: Date.now() + 600_000 } });
      };
    }),
};

jest.mock("./services/query", () => ({
  CAR_KEY: ["car"],
  get carService() {
    return mockService;
  },
  useCar: () =>
    require("@tanstack/react-query").useQuery({
      queryKey: ["car"],
      queryFn: () => mockService.status(),
    }),
}));

const Engine = require("./app/engine").default as () => React.JSX.Element;

async function renderEngine() {
  // gcTime Infinity: no cache-cleanup timer left running after the test.
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Number.POSITIVE_INFINITY } },
  });
  client.setQueryData(["car"], mockCar);
  await render(
    <GestureHandlerRootView>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <Engine />
        </ToastProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>,
  );
  return client;
}

describe("Climate", () => {
  it("cancelling a pending start uses no start and stays off", async () => {
    const client = await renderEngine();
    await fireEvent(screen.getByRole("button", { name: "Hold to start" }), "accessibilityAction", {
      nativeEvent: { actionName: "activate" },
    });
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    await act(async () => mockFinish?.());

    expect(screen.getByText("No start used")).toBeOnTheScreen();
    expect(screen.getByText("Off")).toBeOnTheScreen();
    expect(client.getQueryData<CarStatus>(["car"])?.startsLeft).toBe(2);
  });

  it("a confirmed start shows the countdown and uses one start", async () => {
    await renderEngine();
    await fireEvent(screen.getByRole("button", { name: "Hold to start" }), "accessibilityAction", {
      nativeEvent: { actionName: "activate" },
    });
    await act(async () => mockFinish?.());
    // The confirmed snapshot lands after in-flight re-reads are cancelled.
    expect(await screen.findByText("1 left")).toBeOnTheScreen();
    expect(screen.getByLabelText(/^\d{1,2}:\d\d$/)).toBeOnTheScreen();
  });
});
