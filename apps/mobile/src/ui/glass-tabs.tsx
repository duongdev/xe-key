import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  controlSize,
  fixedSize,
  glassEffect,
  padding,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useEffect, useRef, useState } from "react";
import { type LayoutRectangle, Pressable, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "../i18n";
import { haptics } from "../theme/haptics";
import { pop, useReducedMotion, useTiming } from "../theme/motion";
import { useTheme } from "../theme/use-theme";
import { Glass } from "./glass";
import { Text } from "./text";

export type GlassTab<K extends string> = { key: K; label: string; badge?: number };

const H = 48;
const SEG = 40;

/** Height the floating bar takes, so lists can pad their content above it. */
export const GLASS_TABS_H = H;

/** Badge text: nothing for 0, the number up to 9, then "9+". */
export const badgeText = (n?: number) => (!n ? null : n > 9 ? "9+" : String(n));

type Props<K extends string> = {
  tabs: GlassTab<K>[];
  value: K;
  onChange: (k: K) => void;
};

/** Pins the filter 30 pt above the home indicator, which sits ~10 pt under the safe-area edge. */
function useDock() {
  const insets = useSafeAreaInsets();
  return {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: insets.bottom ? insets.bottom - 10 : 16,
    alignItems: "center",
  } as const;
}

/** iOS 26+: the system segmented control on a glass capsule (native lens, drag and press). */
function NativeTabs<K extends string>({ tabs, value, onChange }: Props<K>) {
  const { scheme } = useTheme();
  const t = useT();
  return (
    <View pointerEvents="box-none" style={useDock()}>
      <Host matchContents colorScheme={scheme}>
        <Picker
          selection={value}
          onSelectionChange={(k) => onChange(k as K)}
          modifiers={[
            pickerStyle("segmented"),
            controlSize("large"),
            fixedSize(),
            padding({ all: 4 }),
            glassEffect({ glass: { variant: "regular" }, shape: "capsule" }),
          ]}
        >
          {tabs.map((tab) => {
            const badge = badgeText(tab.badge);
            return (
              <SwiftText
                key={tab.key}
                modifiers={[
                  tag(tab.key),
                  accessibilityLabel(
                    tab.badge ? `${tab.label}, ${t.unreadCount(tab.badge)}` : tab.label,
                  ),
                ]}
              >
                {badge ? `${tab.label} (${badge})` : tab.label}
              </SwiftText>
            );
          })}
        </Picker>
      </Host>
    </View>
  );
}

/**
 * Before iOS 26: a solid capsule. A lens slides to the selected segment; dragging across moves it
 * and lifting picks.
 */
function SolidTabs<K extends string>({ tabs, value, onChange }: Props<K>) {
  const { c, scheme } = useTheme();
  const t = useT();
  const dock = useDock();
  const timing = useTiming();
  const reduced = useReducedMotion();
  const dark = scheme === "dark";
  const [boxes, setBoxes] = useState<LayoutRectangle[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const selected = tabs.findIndex((tab) => tab.key === value);
  const shown = hover ?? selected;

  const left = useSharedValue(0);
  const width = useSharedValue(0);
  const scale = useSharedValue(1);
  const rise = useSharedValue(reduced ? 0 : 12);
  const fade = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    fade.value = withDelay(120, withTiming(1, timing(280)));
    rise.value = withDelay(120, withTiming(0, timing(280)));
  }, [fade, rise, timing]);

  useEffect(() => {
    const box = boxes[shown];
    if (!box) return;
    if (!placed.current || reduced) {
      placed.current = true;
      left.value = box.x;
      width.value = box.width;
      return;
    }
    left.value = withTiming(box.x, { duration: 320, easing: pop });
    width.value = withTiming(box.width, { duration: 320, easing: pop });
  }, [boxes, shown, left, width, reduced]);

  const at = (x: number) => {
    const i = boxes.findIndex((b) => x >= b.x && x < b.x + b.width);
    return i < 0 ? (x < (boxes[0]?.x ?? 0) ? 0 : boxes.length - 1) : i;
  };
  const hoverRef = useRef<number | null>(null);
  const scrub = usePanGesture({
    runOnJS: true,
    activeOffsetX: [-8, 8],
    onActivate: () => {
      if (!reduced) scale.value = withSpring(1.04, { duration: 220, dampingRatio: 0.7 });
    },
    onUpdate: (e) => {
      const i = at(e.x - 4);
      if (i === (hoverRef.current ?? selected)) return;
      hoverRef.current = i;
      haptics.selection();
      setHover(i);
    },
    onFinalize: () => {
      scale.value = withSpring(1, { duration: 220, dampingRatio: 0.7 });
      const i = hoverRef.current;
      hoverRef.current = null;
      setHover(null);
      const tab = i === null ? undefined : tabs[i];
      if (tab && tab.key !== value) onChange(tab.key);
    },
  });

  const lens = useAnimatedStyle(() => ({ left: left.value, width: width.value }));
  const bar = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: rise.value }, { scale: scale.value }],
  }));
  const lensColor = dark ? "#34343A" : c.s2;

  return (
    <View pointerEvents="box-none" style={dock}>
      <GestureDetector gesture={scrub}>
        <Animated.View style={bar}>
          <Glass
            accessibilityRole="tablist"
            interactive
            style={{ height: H, borderRadius: H / 2, padding: 4, flexDirection: "row" }}
          >
            <Animated.View
              style={[
                { position: "absolute", top: 4, height: SEG, borderRadius: SEG / 2 },
                { backgroundColor: lensColor },
                lens,
              ]}
            />
            {tabs.map((tab, i) => {
              const on = i === shown;
              const badge = badgeText(tab.badge);
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab.key === value }}
                  accessibilityLabel={
                    tab.badge ? `${tab.label}, ${t.unreadCount(tab.badge)}` : tab.label
                  }
                  onLayout={(e) => {
                    const box = e.nativeEvent.layout;
                    setBoxes((list) => {
                      const next = [...list];
                      next[i] = box;
                      return next;
                    });
                  }}
                  onPress={() => {
                    if (tab.key === value) return;
                    haptics.selection();
                    onChange(tab.key);
                  }}
                  style={{
                    height: SEG,
                    paddingHorizontal: 18,
                    borderRadius: SEG / 2,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text
                    variant="label"
                    weight={on ? 600 : 500}
                    style={{ fontSize: 15, color: on ? c.fg : c.fg2 }}
                  >
                    {tab.label}
                  </Text>
                  {badge ? (
                    <View
                      style={{
                        minWidth: 18,
                        height: 18,
                        paddingHorizontal: 5,
                        borderRadius: 9,
                        backgroundColor: c.warn,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text weight={700} color="onwarn" style={{ fontSize: 11, lineHeight: 14 }}>
                        {badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </Glass>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/** Floating filter tabs at the bottom: native on iOS 26+, solid before that. */
export const GlassTabs = isLiquidGlassAvailable() ? NativeTabs : SolidTabs;
