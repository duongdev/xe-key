import { ActionSheetIOS } from "react-native";

/** Native iOS picker for a few named options. */
export function pick<K extends string>(
  title: string,
  options: Record<K, string>,
  cancel: string,
  onPick: (k: K) => void,
) {
  const keys = Object.keys(options) as K[];
  ActionSheetIOS.showActionSheetWithOptions(
    { title, options: [...keys.map((k) => options[k]), cancel], cancelButtonIndex: keys.length },
    (i) => {
      const k = keys[i];
      if (k) onPick(k);
    },
  );
}
