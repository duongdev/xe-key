import { useColorScheme } from "react-native";
import { colors } from "./tokens";

export function useTheme() {
  const scheme = useColorScheme() === "light" ? "light" : "dark";
  return { scheme, c: colors(scheme) } as const;
}
