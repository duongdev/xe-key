import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { CarService } from "./services/car";
import { ToastProvider } from "./ui/toast";

// Swipeable pulls in real Reanimated internals; the swipe is not under test here.
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-glass-effect", () => ({ GlassView: "View", isLiquidGlassAvailable: () => false }));
jest.mock("./services/alert-seen", () => ({ markSeen: jest.fn() }));
jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));
jest.mock("expo-localization", () => ({ getLocales: () => [{ languageCode: "en" }] }));
jest.mock("./prefs", () => ({ usePrefs: () => ({ prefs: { language: "en", format: "24h" } }) }));

let mockResolve: (list: Awaited<ReturnType<CarService["alerts"]>>) => void = () => {};
const mockService: Pick<CarService, "alerts" | "deleteAlert"> = {
  alerts: () => new Promise((r) => (mockResolve = r)),
  deleteAlert: async () => {},
};
jest.mock("./services/query", () => ({
  CAR_KEY: ["car"],
  ALERTS_KEY: ["alerts"],
  loadAlerts: () => mockService.alerts(),
  useRefreshOnFocus: () => {},
  get carService() {
    return mockService;
  },
}));

const Alerts = require("./app/alerts").default as () => React.JSX.Element;

it("shows skeleton rows on first load, then the alerts", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Number.POSITIVE_INFINITY } },
  });
  await render(
    <GestureHandlerRootView>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <Alerts />
        </ToastProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>,
  );
  expect(screen.getByLabelText("Loading")).toBeOnTheScreen();

  mockResolve([
    {
      id: "command:1",
      kind: "command",
      at: Date.now(),
      unread: true,
      title: "Locked",
      text: "Locked",
      ok: true,
    },
  ]);
  expect(await screen.findByText("Locked")).toBeOnTheScreen();
  expect(screen.queryByLabelText("Loading")).toBeNull();
});
