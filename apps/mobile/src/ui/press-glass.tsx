import { type ReactNode, useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  type PressableProps,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { haptics } from "../theme/haptics";
import { pop, settle, useReducedMotion } from "../theme/motion";

/**
 * Glass press for solid buttons (HANDOFF › Liquid Glass › Glass press): while the finger is down
 * the button lifts 1.03 with a shadow, and a rim plus a soft light under the finger fade in over
 * the fill. Drawn by us, so it looks the same before iOS 26. Spread `handlers` on the Pressable,
 * `lift` on the visible button, and render `layer` inside it above the fill and below the label
 * (its children need `pointerEvents="none"` so the light can follow the finger).
 */
export function usePressGlass() {
  const reduced = useReducedMotion();
  const glass = useSharedValue(0);
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const place = (e: GestureResponderEvent) => {
    x.value = reduced ? size.w / 2 : e.nativeEvent.locationX;
    y.value = reduced ? size.h / 2 : e.nativeEvent.locationY;
  };

  const handlers = {
    onLayout: (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setSize({ w: width, h: height });
    },
    onPressIn: (e: GestureResponderEvent) => {
      place(e);
      glass.value = withTiming(1, { duration: reduced ? 150 : 120 });
      if (!reduced) scale.value = withTiming(1.03, { duration: 160, easing: settle });
    },
    onPressOut: () => {
      glass.value = withTiming(0, { duration: reduced ? 150 : 180 });
      scale.value = withTiming(1, { duration: 220, easing: pop });
    },
    onTouchMove: (e: GestureResponderEvent) => {
      if (!reduced) place(e);
    },
  };

  const lift = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 13,
    shadowOpacity: 0.45 * glass.value,
  }));

  return { handlers, lift, layer: <GlassLayer size={size} glass={glass} x={x} y={y} /> };
}

function GlassLayer({
  size,
  glass,
  x,
  y,
}: {
  size: { w: number; h: number };
  glass: SharedValue<number>;
  x: SharedValue<number>;
  y: SharedValue<number>;
}) {
  const r = size.h * 1.1;
  const fade = useAnimatedStyle(() => ({ opacity: glass.value }));
  const follow = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - r }, { translateY: y.value - r }],
  }));
  if (!size.w) return null;
  const radius = size.h / 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden" }, fade]}
    >
      <Animated.View
        style={[{ position: "absolute", left: 0, top: 0, width: r * 2, height: r * 2 }, follow]}
      >
        <Svg width={r * 2} height={r * 2}>
          <Defs>
            <RadialGradient id="light" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.34} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={r * 2} height={r * 2} fill="url(#light)" />
        </Svg>
      </Animated.View>
      <View style={{ position: "absolute", inset: 0 }}>
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.22} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.22} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0.5}
            y={0.5}
            width={size.w - 1}
            height={size.h - 1}
            rx={radius - 0.5}
            fill="none"
            stroke="url(#rim)"
            strokeWidth={1}
          />
        </Svg>
      </View>
    </Animated.View>
  );
}

/**
 * A solid `Pressable` button with the glass press and a light haptic on touch down. Takes a plain
 * style (no `pressed` callback): the press look comes from the glass layer.
 */
export function SolidPressable({
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, "style" | "children"> & { style: ViewStyle; children: ReactNode }) {
  const press = usePressGlass();
  const { flex, ...look } = style;
  return (
    <Pressable
      {...rest}
      style={{ flex }}
      onTouchMove={press.handlers.onTouchMove}
      onPressIn={(e) => {
        haptics.light();
        press.handlers.onPressIn(e);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.handlers.onPressOut();
        onPressOut?.(e);
      }}
    >
      <Animated.View
        pointerEvents="box-only"
        style={[look, press.lift]}
        onLayout={press.handlers.onLayout}
      >
        {press.layer}
        {children}
      </Animated.View>
    </Pressable>
  );
}
