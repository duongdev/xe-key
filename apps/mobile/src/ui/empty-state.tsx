import { ArrowsClockwiseIcon } from "phosphor-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../theme/use-theme";
import { Text } from "./text";

type Props = {
  icon: ReactNode;
  badge: ReactNode;
  badgeTone: "acc" | "warn";
  title: string;
  action?: { label: string; onPress: () => void };
};

/** Centered disc with a small badge, one line of text, and an optional action. */
export function EmptyState({ icon, badge, badgeTone, title, action }: Props) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
      <View
        accessibilityElementsHidden
        style={{
          width: 132,
          height: 132,
          borderRadius: 66,
          backgroundColor: c.s1,
          borderWidth: 1,
          borderColor: c.s2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
        <View
          style={{
            position: "absolute",
            right: 2,
            top: 6,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c.bg,
            borderWidth: 2,
            borderColor: c[badgeTone],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badge}
        </View>
      </View>
      <Text weight={600} accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => ({
            height: 48,
            paddingHorizontal: 20,
            borderRadius: 24,
            backgroundColor: c.s2,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ArrowsClockwiseIcon size={18} color={c.fg} />
          <Text variant="label" weight={600}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
