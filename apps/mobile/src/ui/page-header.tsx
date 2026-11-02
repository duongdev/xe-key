import { router } from "expo-router";
import { CaretLeftIcon } from "phosphor-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useT } from "../i18n";
import { iconSize, textStyle } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { GlassButton } from "./glass";
import { Text } from "./text";

/** Glass back circle + large title, with an optional slot on the right. */
export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  const { c } = useTheme();
  const t = useT();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, zIndex: 1 }}>
      <GlassButton
        label={t.backToCar}
        symbol="chevron.left"
        onPress={() => router.back()}
        style={{ marginLeft: -4 }}
      >
        <CaretLeftIcon size={iconSize.md} color={c.fg} />
      </GlassButton>
      <Text accessibilityRole="header" style={{ ...textStyle("large"), flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/** Small rounded info pill used in headers. */
export function Pill({ icon, text, label }: { icon: ReactNode; text: string; label?: string }) {
  const { c } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={label ?? text}
      style={{
        height: 30,
        paddingHorizontal: 10,
        borderRadius: 15,
        backgroundColor: c.s1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon}
      <Text variant="caption" weight={600}>
        {text}
      </Text>
    </View>
  );
}
