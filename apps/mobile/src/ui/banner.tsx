import { CaretRightIcon } from "phosphor-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../theme/use-theme";
import { Appear } from "./appear";
import { Text } from "./text";

type Props = {
  tone: "neutral" | "warn";
  icon: ReactNode;
  text: string;
  /** Text action on the right (e.g. Wake). */
  action?: { label: string; onPress: () => void };
  /** Whole banner opens a screen (chevron). */
  onPress?: () => void;
  /** Busy indicator on the right while the condition is being retried. */
  trailing?: ReactNode;
};

/** Ongoing condition (offline, window open, car asleep). Stays until the condition clears. */
export function Banner({ tone, icon, text, action, onPress, trailing }: Props) {
  const { c } = useTheme();
  const warn = tone === "warn";
  const body = (
    <View
      style={{
        minHeight: 44,
        paddingLeft: 14,
        paddingRight: action ? 6 : 14,
        borderRadius: 16,
        backgroundColor: warn ? `${c.warn}1F` : c.s1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      {icon}
      <Text
        variant="label"
        weight={warn ? 600 : 500}
        color={warn ? "warn" : "fg"}
        style={{ flex: 1 }}
      >
        {text}
      </Text>
      {trailing}
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          hitSlop={6}
          style={{ height: 44, paddingHorizontal: 10, justifyContent: "center" }}
        >
          <Text variant="label" weight={700} color={warn ? "warn" : "acc"}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
      {onPress ? <CaretRightIcon size={16} color={warn ? c.warn : c.fg2} /> : null}
    </View>
  );
  return (
    <Appear kind="rise">
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text}
          onPress={onPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          {body}
        </Pressable>
      ) : (
        <View accessibilityRole="alert">{body}</View>
      )}
    </Appear>
  );
}
