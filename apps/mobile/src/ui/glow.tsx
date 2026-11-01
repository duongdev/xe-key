import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/** Soft radial light behind hero content. */
export function Glow({
  color,
  opacity,
  style,
}: {
  color: string;
  opacity: number;
  style?: ViewStyle;
}) {
  return (
    <View pointerEvents="none" style={[{ position: "absolute" }, style]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </View>
  );
}
