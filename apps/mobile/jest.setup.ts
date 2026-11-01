require("react-native-gesture-handler/jestSetup");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);

// ponytail: hand mock of the Reanimated API we use. Reanimated 4's own Jest setup needs a DOM
// (web build). Animations jump to their target; extend this when a test needs frame timing.
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const id = <T>(x: T) => x;
  const lerp = (x: number, input: number[], output: number[]) => {
    for (let i = 1; i < input.length; i++) {
      const a = input[i - 1] as number;
      const b = input[i] as number;
      if (x <= b || i === input.length - 1) {
        const t = (x - a) / (b - a);
        return (output[i - 1] as number) + t * ((output[i] as number) - (output[i - 1] as number));
      }
    }
    return output[0] as number;
  };
  const curve = () => id;
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: id },
    createAnimatedComponent: id,
    useSharedValue: (value: unknown) => ({ value }),
    isSharedValue: (v: unknown) => typeof v === "object" && v !== null && "value" in v,
    useAnimatedStyle: (fn: () => object) => fn(),
    useAnimatedProps: (fn: () => object) => fn(),
    useReducedMotion: () => false,
    withTiming: id,
    withSpring: id,
    withDelay: (_ms: number, v: unknown) => v,
    withRepeat: id,
    withSequence: (...v: unknown[]) => v[v.length - 1],
    interpolate: lerp,
    Easing: { linear: id, bezier: curve, in: id, out: id, inOut: id },
    ReduceMotion: { System: "system", Always: "always", Never: "never" },
  };
});
