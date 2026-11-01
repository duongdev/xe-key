import {
  ArrowsClockwiseIcon,
  ArrowUpIcon,
  CloudSlashIcon,
  HardDrivesIcon,
  TimerIcon,
} from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useT } from "../i18n";
import { iconSize } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Text } from "../ui/text";

const RETRY_S = 30;

/** Honda's server failed or blocked this app version. Retries by itself every 30 s. */
export function HondaDown({ blocked, onRetry }: { blocked: boolean; onRetry: () => void }) {
  const { c } = useTheme();
  const t = useT();
  const [left, setLeft] = useState(RETRY_S);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left <= 0) onRetry();
  }, [left, onRetry]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t.hondaDown}
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
          <HardDrivesIcon size={60} color={c.fg2} />
          <View
            style={{
              position: "absolute",
              right: 4,
              top: 8,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: c.bg,
              borderWidth: 2,
              borderColor: c.warn,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloudSlashIcon size={20} color={c.warn} />
          </View>
        </View>
        <Text weight={600} style={{ fontSize: 20, lineHeight: 26 }}>
          {t.hondaDown}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TimerIcon size={16} color={c.fg2} />
          <Text variant="caption" color="fg2" style={{ fontSize: 14 }}>
            {t.retryIn(Math.max(0, left))}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => ({
            height: 48,
            paddingHorizontal: 22,
            borderRadius: 24,
            backgroundColor: c.s2,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ArrowsClockwiseIcon size={iconSize.sm} color={c.fg} />
          <Text variant="label" weight={600}>
            {t.tryNow}
          </Text>
        </Pressable>
      </View>
      {blocked ? (
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: c.s1,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ArrowUpIcon size={iconSize.sm} color={c.fg2} />
          <Text variant="caption" color="fg2">
            {t.appBlocked}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
