import { Alert } from "react-native";

/** Fallback picker (Android, tests): one alert button per option. */
export function pick<K extends string>(
  title: string,
  options: Record<K, string>,
  cancel: string,
  onPick: (k: K) => void,
) {
  const keys = Object.keys(options) as K[];
  Alert.alert(title, undefined, [
    ...keys.map((k) => ({ text: options[k], onPress: () => onPick(k) })),
    { text: cancel, style: "cancel" as const },
  ]);
}
