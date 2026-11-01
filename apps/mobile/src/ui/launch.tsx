import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Car } from "../car/car";
import { viewBoxX } from "../car/frame";
import { bodyGeometry } from "../car/geometry";
import { useReducedMotion } from "../theme/motion";
import { Glow } from "./glow";
import { type LaunchTarget, onLaunchTarget } from "./launch-target";
import { dotAt, END_MS, frame } from "./launch-timeline";

// Same image as the native launch screen minus the dot, so the hand-off frame is identical.
const TILE_IMG = require("../../assets/launch-tile.png");
const TILE = 104;
/** Dot top-left inside the tile, from the generated launch image (pt). */
const DOT = { x: 76.0, y: 58.5, size: 11 };
const GROUND = "#0B0B0C";
// Plain curve functions (not factories) so the pure timeline can call them in a worklet.
const settle = Easing.bezierFn(0.22, 1, 0.36, 1);
const inOut = Easing.bezierFn(0.45, 0, 0.2, 1);
/** Wait this long for Home to report its car; without it, only the tile and the fade play. */
const TARGET_WAIT_MS = 300;

/**
 * Cold-start Splash → Home (HANDOFF.md › Splash → Home): the tile lets go, its dot arcs to the
 * headlight while the car drives in to Home's exact spot, the lights wink, Home fades in at
 * 1.25 s and the overlay car fades onto Home's own car. Never waits on the network.
 * Reduce Motion: a 200 ms cross-fade.
 */
export function Launch({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const { width: W, height: H } = useWindowDimensions();
  const t = useSharedValue(0);
  const fade = useSharedValue(1);
  const [car, setCar] = useState<LaunchTarget | null>(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    const off = onLaunchTarget((target) => {
      // Follow Home's latest layout (data can arrive and move the car before the reveal).
      setCar(target);
      setGo(true);
    });
    const id = setTimeout(() => setGo(true), TARGET_WAIT_MS);
    return () => {
      off();
      clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!go) return;
    const done = (finished?: boolean) => {
      "worklet";
      if (finished) runOnJS(onDone)();
    };
    if (reduced) {
      fade.value = withTiming(0, { duration: 200, easing: Easing.linear }, done);
      return;
    }
    t.value = withTiming(END_MS, { duration: END_MS, easing: Easing.linear }, done);
  }, [go, reduced, t, fade, onDone]);

  const tile = { x: (W - TILE) / 2, y: (H - TILE) / 2 };
  const from = { x: tile.x + DOT.x + DOT.size / 2, y: tile.y + DOT.y + DOT.size / 2 };
  const k = car ? car.width / 720 : 1;
  const head = car ? bodyGeometry(car.body).head : { x: 0, y: 0 };
  const to = car ? { x: car.x + (head.x - viewBoxX(car.body)) * k, y: car.y + head.y * k } : from;
  // The board's sizes are for a 382 pt wide car.
  const b = car ? car.width / 382 : 1;

  const root = useAnimatedStyle(() => ({ opacity: fade.value }));
  const ground = useAnimatedStyle(() => ({ opacity: frame(t.value, settle, inOut).veil }));
  const tileStyle = useAnimatedStyle(() => {
    const f = frame(t.value, settle, inOut);
    return { opacity: f.tileOpacity, transform: [{ scale: f.tileScale }] };
  });
  const dotStyle = useAnimatedStyle(() => {
    const f = frame(t.value, settle, inOut);
    const p = car ? dotAt(f.dot, from, to) : { x: from.x, y: from.y, scale: 1 };
    const color = interpolateColor(
      t.value,
      [230, 230 + 0.35 * 820, 1050],
      ["#0A6FC2", "#7CC7FF", "#EAF6FF"],
    );
    return {
      opacity: car ? f.dotOpacity : 1,
      backgroundColor: color,
      shadowColor: color,
      shadowRadius: Math.min(1, t.value / 1050) * 11,
      transform: [
        { translateX: p.x - DOT.size / 2 },
        { translateY: p.y - DOT.size / 2 },
        { scale: p.scale },
      ],
    };
  });
  const carStyle = useAnimatedStyle(() => {
    const f = frame(t.value, settle, inOut);
    const off = car ? car.x + car.width + 84 * b : 0;
    return { opacity: f.carOpacity, transform: [{ translateX: -f.carShift * off }] };
  });
  const floorStyle = useAnimatedStyle(() => ({ opacity: frame(t.value, settle, inOut).floor }));
  const winkStyle = useAnimatedStyle(() => ({ opacity: frame(t.value, settle, inOut).wink }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, root]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: GROUND }, reduced ? null : ground]}
      />
      {car && !reduced ? (
        <>
          <Animated.View style={[{ position: "absolute", left: 0, top: 0 }, floorStyle]}>
            <Glow
              color="#7CC7FF"
              opacity={0.16}
              style={{ left: car.x - 64 * b, top: car.y - 30 * b, width: 510 * b, height: 260 * b }}
            />
          </Animated.View>
          <Animated.View
            style={[{ position: "absolute", left: car.x, top: car.y, width: car.width }, carStyle]}
          >
            <Car body={car.body} paint={car.paint} look={car.look} ground="dark" />
          </Animated.View>
          <Animated.View style={[{ position: "absolute", left: 0, top: 0 }, winkStyle]}>
            <Glow
              color="#EAF6FF"
              opacity={0.95}
              style={{ left: to.x - 46 * b, top: to.y - 22 * b, width: 92 * b, height: 44 * b }}
            />
          </Animated.View>
        </>
      ) : null}
      <Animated.Image
        source={TILE_IMG}
        style={[
          { position: "absolute", left: tile.x, top: tile.y, width: TILE, height: TILE },
          tileStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            width: DOT.size,
            height: DOT.size,
            borderRadius: DOT.size / 2,
            shadowOpacity: 0.55,
            shadowOffset: { width: 0, height: 0 },
          },
          dotStyle,
        ]}
      />
    </Animated.View>
  );
}
