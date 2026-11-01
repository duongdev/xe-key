import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptics } from "../theme/haptics";
import { useTheme } from "../theme/use-theme";
import { Glass } from "./glass";
import { Text } from "./text";

export type GlassTab<K extends string> = { key: K; label: string; badge?: number };

/** Height the floating bar takes, so lists can pad their content above it. */
export const GLASS_TABS_H = 52;

/**
 * Floating segmented tabs at the bottom, in native Liquid Glass on iOS 26+ (a solid pill
 * before that). Selection changes give one selection haptic.
 */
export function GlassTabs<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: GlassTab<K>[];
  value: K;
  onChange: (k: K) => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, 12) + 4,
        alignItems: "center",
      }}
    >
      <Glass
        accessibilityRole="tablist"
        interactive
        style={{
          height: GLASS_TABS_H,
          borderRadius: GLASS_TABS_H / 2,
          padding: 4,
          flexDirection: "row",
          gap: 2,
        }}
      >
        {tabs.map((tab) => {
          const on = tab.key === value;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={tab.badge ? `${tab.label}, ${tab.badge}` : tab.label}
              onPress={() => {
                if (on) return;
                haptics.selection();
                onChange(tab.key);
              }}
              style={{
                height: GLASS_TABS_H - 8,
                paddingHorizontal: 16,
                borderRadius: (GLASS_TABS_H - 8) / 2,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: on ? c.fg : "transparent",
              }}
            >
              <Text variant="label" weight={600} style={{ color: on ? c.bg : c.fg }}>
                {tab.label}
              </Text>
              {tab.badge ? (
                <View
                  style={{
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: 6,
                    borderRadius: 10,
                    backgroundColor: c.warn,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="caption" weight={700} style={{ fontSize: 12, color: c.onwarn }}>
                    {tab.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}
