import { View } from "react-native";
import { Text } from "./text";

/** "xe." wordmark tile. The dot is the only colour. */
export function LogoTile({ size = 30 }: { size?: number }) {
  const font = size * 0.47;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        backgroundColor: "#F2F2F3",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        weight={800}
        style={{
          fontSize: font,
          lineHeight: font * 1.2,
          letterSpacing: -0.06 * font,
          color: "#0B0B0C",
        }}
      >
        xe
        <Text weight={800} style={{ fontSize: font, color: "#0A6FC2" }}>
          .
        </Text>
      </Text>
    </View>
  );
}
