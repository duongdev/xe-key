import { memo, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { viewBoxX } from "./frame";
import { type Body, bodyGeometry, type Ground, needsAssist } from "./geometry";

export type CarProps = {
  body: Body;
  look?: "shaded" | "line";
  paint?: string;
  ground?: Ground;
  assist?: boolean;
  doors?: "locked" | "unlocked";
  engine?: boolean;
  label?: string;
};

const AEllipse = Animated.createAnimatedComponent(Ellipse);

const BLINK_MS = 1600;
/** Vapor from the design board: 6 puffs, one every 0.45 s, each 2.8–3.5 s. */
const PUFFS = [0, 1, 2, 3, 4, 5];
const PUFF_GAP_MS = 450;
const puffMs = (k: number) => 2800 + (k % 3) * 350;
/** Puff sprite radius; the animation scales it from 4 to 34. */
const PUFF_R = 34;
const AMBER = "#FFB547";

function Gradients() {
  return (
    <Defs>
      <LinearGradient id="hcShade" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.42} />
        <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.08} />
        <Stop offset="0.55" stopColor="#000000" stopOpacity={0.02} />
        <Stop offset="0.72" stopColor="#000000" stopOpacity={0.22} />
        <Stop offset="1" stopColor="#000000" stopOpacity={0.6} />
      </LinearGradient>
      <LinearGradient id="hcSheen" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
        <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.14} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </LinearGradient>
      <LinearGradient id="hcGlass" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#46525F" />
        <Stop offset="0.45" stopColor="#151A20" />
        <Stop offset="1" stopColor="#07090B" />
      </LinearGradient>
      <RadialGradient id="hcRim" cx="0.42" cy="0.35" r="0.8">
        <Stop offset="0" stopColor="#C9CED4" />
        <Stop offset="0.55" stopColor="#7C828A" />
        <Stop offset="1" stopColor="#3C4046" />
      </RadialGradient>
      <RadialGradient id="hcRimDark" cx="0.42" cy="0.35" r="0.8">
        <Stop offset="0" stopColor="#4A4F57" />
        <Stop offset="0.6" stopColor="#25282D" />
        <Stop offset="1" stopColor="#121417" />
      </RadialGradient>
      <RadialGradient id="hcGlow" cx="0.5" cy="0.55" r="0.5">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
        <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="hcHeadGlow" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor="#EAF6FF" stopOpacity={0.9} />
        <Stop offset="1" stopColor="#EAF6FF" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="hcTailGlow" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor="#FF4A3D" stopOpacity={0.8} />
        <Stop offset="1" stopColor="#FF4A3D" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="hcAmber" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor={AMBER} stopOpacity={1} />
        <Stop offset="1" stopColor={AMBER} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="hcFloor" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor="#000000" stopOpacity={0.7} />
        <Stop offset="1" stopColor="#000000" stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );
}

/** Two blinks over 1.6 s; the mirror lamp then stays lit. */
function blink(final: number) {
  const step = (to: number) => withTiming(to, { duration: BLINK_MS * 0.15, easing: Easing.linear });
  return withSequence(
    step(1),
    step(0),
    step(1),
    step(0),
    withTiming(final, { duration: BLINK_MS * 0.4, easing: Easing.linear }),
  );
}

type Point = { x: number; y: number };

function Unlocked({ g, handles }: { g: ReturnType<typeof bodyGeometry>; handles: string }) {
  const reduced = useReducedMotion();
  const mirror = useSharedValue(reduced ? 0.7 : 0);
  const corners = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    mirror.value = blink(0.7);
    corners.value = blink(0);
  }, [reduced, mirror, corners]);

  const mirrorProps = useAnimatedProps(() => ({ opacity: mirror.value }));
  const cornerProps = useAnimatedProps(() => ({ opacity: corners.value }));

  return (
    <G testID="car-unlocked">
      <Path d={handles} stroke={AMBER} strokeWidth={3.5} strokeLinecap="round" />
      <AEllipse
        cx={g.mirror.x}
        cy={g.mirror.y}
        rx={16}
        ry={10}
        fill="url(#hcAmber)"
        animatedProps={mirrorProps}
      />
      <AEllipse
        cx={g.head.x}
        cy={g.head.y}
        rx={20}
        ry={12}
        fill="url(#hcAmber)"
        animatedProps={cornerProps}
      />
      <AEllipse
        cx={g.tail.x}
        cy={g.tail.y}
        rx={18}
        ry={11}
        fill="url(#hcAmber)"
        animatedProps={cornerProps}
      />
    </G>
  );
}

function EngineOn({ g }: { g: ReturnType<typeof bodyGeometry> }) {
  return (
    <G testID="car-engine">
      <Ellipse cx={g.head.x} cy={g.head.y} rx={44} ry={20} fill="url(#hcHeadGlow)" />
      <Ellipse cx={g.tail.x} cy={g.tail.y} rx={30} ry={15} fill="url(#hcTailGlow)" />
      <Ellipse cx={g.exhaust.x} cy={g.exhaust.y} rx={5} ry={3.5} fill="#050506" />
    </G>
  );
}

/**
 * Exhaust vapor as animated Views over the SVG (SVG animated props did not render on device). Each puff
 * is a static radial-gradient sprite moved and scaled by Reanimated; the gradient's soft edge stands in
 * for the board's blur + noise filter (no Skia). Off under Reduce Motion.
 */
function Puffs({ from, scale }: { from: Point; scale: number }) {
  const reduced = useReducedMotion();
  if (reduced || scale === 0) return null;
  return (
    <>
      {PUFFS.map((k) => (
        <Puff key={k} from={from} k={k} scale={scale} />
      ))}
    </>
  );
}

function Puff({ from, k, scale }: { from: Point; k: number; scale: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      k * PUFF_GAP_MS,
      withRepeat(withTiming(1, { duration: puffMs(k), easing: Easing.linear }), -1),
    );
  }, [k, p]);
  const j = (k * 7) % 5;
  const xs = [from.x, from.x - 10 - j, from.x - 32 - 3 * j, from.x - 58 - 4 * j];
  const ys = [from.y, from.y - 6, from.y - 30 - 3 * j, from.y - 64 - 4 * j];
  const style = useAnimatedStyle(() => {
    const t = [0, 0.2, 0.6, 1];
    const x = interpolate(p.value, t, xs);
    const y = interpolate(p.value, t, ys);
    const r = interpolate(p.value, t, [4, 12, 22, 34]);
    return {
      opacity: interpolate(p.value, [0, 0.12, 0.5, 1], [0, 0.85, 0.5, 0]),
      transform: [
        { translateX: (x - PUFF_R) * scale },
        { translateY: (y - PUFF_R) * scale },
        { scale: r / PUFF_R },
      ],
    };
  });
  const size = 2 * PUFF_R * scale;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: 0, top: 0, width: size, height: size }, style]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${2 * PUFF_R} ${2 * PUFF_R}`}>
        <Defs>
          <RadialGradient id="puff" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#E4E8EC" stopOpacity={0.7} />
            <Stop offset="0.5" stopColor="#C9CED4" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#C9CED4" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={PUFF_R} cy={PUFF_R} r={PUFF_R} fill="url(#puff)" />
      </Svg>
    </Animated.View>
  );
}

function CarImpl({
  body,
  look = "shaded",
  paint = "#6B7078",
  ground = "dark",
  assist = true,
  doors = "locked",
  engine = false,
  label,
}: CarProps) {
  const g = bodyGeometry(body);
  const vbx = viewBoxX(body);
  const [scale, setScale] = useState(0);
  const s = g.profile;
  const light = ground === "light";
  const assisted = assist && needsAssist(paint, ground);
  const edge = assisted ? (light ? "rgba(0,0,0,.28)" : "rgba(255,255,255,.34)") : "none";
  const ink = light ? "#0B0B0C" : "#F2F2F3";

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label ?? `Honda ${s.name}, side view`}
      style={{ width: "100%", aspectRatio: 720 / 280 }}
      onLayout={(e) => setScale(e.nativeEvent.layout.width / 720)}
    >
      <Svg width="100%" height="100%" viewBox={`${vbx} 0 720 280`} style={{ overflow: "visible" }}>
        <Gradients />
        {look === "shaded" ? (
          <G>
            <Ellipse
              cx={372}
              cy={150}
              rx={350}
              ry={120}
              fill="url(#hcGlow)"
              opacity={assisted && !light ? 1 : 0}
            />
            <Ellipse
              cx={372}
              cy={254}
              rx={336}
              ry={14}
              fill="url(#hcFloor)"
              opacity={light ? (assisted ? 0.75 : 0.45) : 1}
            />
            <Path d={g.archShadow} fill="#050506" />
            <Path d={g.body} fill={paint} />
            <Path d={g.body} fill="url(#hcShade)" />
            <Path d={g.body} fill="url(#hcSheen)" />
            <Path d={g.body} fill="none" stroke={edge} strokeWidth={1.8} strokeLinejoin="round" />
            <Path d={s.glass} fill="url(#hcGlass)" />
            <Path d={s.pillars} fill="#0B0D10" />
            <Path d={s.belt} stroke={g.beltColor} strokeWidth={g.beltWidth} fill="none" />
            <Path
              d={s.crease}
              stroke="#FFFFFF"
              strokeOpacity={0.32}
              strokeWidth={1.6}
              fill="none"
            />
            <Path d={s.lower} stroke="#000000" strokeOpacity={0.28} strokeWidth={2} fill="none" />
            <Path d={s.doors} stroke="#000000" strokeOpacity={0.4} strokeWidth={1.4} fill="none" />
            <Path
              d={s.handles}
              stroke="#000000"
              strokeOpacity={0.5}
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <Path d={s.mirror} fill="#121417" />
            <Path d={g.rocker} fill="#000000" opacity={0.5} />
            <Path d={s.intake} stroke="#0B0C0E" strokeWidth={7} strokeLinecap="round" fill="none" />
            {s.aero ? <Path d={s.aero} fill="#0B0C0E" /> : null}
            <Path d={s.head} stroke="#F1F8FF" strokeWidth={4} strokeLinecap="round" fill="none" />
            <Path d={s.tail} stroke="#E0332E" strokeWidth={5} strokeLinecap="round" fill="none" />
            {g.wheels.map((w) => (
              <G key={w.cx}>
                <Circle cx={w.cx} cy={w.cy} r={w.r} fill="#0C0D0F" />
                <Circle
                  cx={w.cx}
                  cy={w.cy}
                  r={w.rim}
                  fill={w.darkRim ? "url(#hcRimDark)" : "url(#hcRim)"}
                />
                <Circle cx={w.cx} cy={w.cy} r={w.inner} fill="#1B1D21" />
                {w.caliper ? (
                  <Path
                    d={w.caliper}
                    stroke="#D7262B"
                    strokeWidth={8}
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : null}
                <Path
                  d={w.spokes}
                  stroke={w.spokeColor}
                  strokeWidth={w.spokeWidth}
                  strokeLinecap="round"
                />
                <Circle cx={w.cx} cy={w.cy} r={6} fill="#9AA0A7" />
              </G>
            ))}
            {doors === "unlocked" ? <Unlocked g={g} handles={s.handles} /> : null}
            {engine ? <EngineOn g={g} /> : null}
          </G>
        ) : (
          <G fill="none" stroke={ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
            <Path d="M40 256 L700 256" strokeOpacity={0.25} />
            <Path d={g.body} />
            <Path d={s.glass} strokeOpacity={0.6} />
            <Path d={s.crease} strokeOpacity={0.35} strokeWidth={2} />
            <Path d={s.head} stroke={paint} strokeWidth={5} />
            {g.wheels.map((w) => (
              <G key={w.cx}>
                <Circle cx={w.cx} cy={w.cy} r={w.lineR} />
                <Circle cx={w.cx} cy={w.cy} r={w.inner} stroke={paint} />
              </G>
            ))}
          </G>
        )}
      </Svg>
      {engine && look === "shaded" ? (
        <Puffs from={{ x: g.exhaust.x - vbx, y: g.exhaust.y }} scale={scale} />
      ) : null}
    </View>
  );
}

export const Car = memo(CarImpl);
