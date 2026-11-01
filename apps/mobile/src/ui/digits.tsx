import { Text as RNText, type TextStyle, View } from "react-native";

/**
 * Countdown text that never changes width: each digit gets the same fixed cell. Be Vietnam Pro
 * ignores `tabular-nums` on iOS, so proportional digits made "9:33" → "9:32" jiggle.
 */
export function Digits({ value, style }: { value: string; style: TextStyle }) {
  const size = style.fontSize ?? 17;
  const digit = size * 0.62;
  const sep = size * 0.3;
  return (
    <View accessible accessibilityLabel={value} style={{ flexDirection: "row" }}>
      {[...value].map((ch, i) => (
        <RNText
          // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity of a digit cell
          key={i}
          style={[
            style,
            { width: /\d/.test(ch) ? digit : sep, textAlign: "center", letterSpacing: 0 },
          ]}
        >
          {ch}
        </RNText>
      ))}
    </View>
  );
}
