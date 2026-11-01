import { memo, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
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
const PUFF_MS = 2700;
const PUFF_GAP_MS = 900;
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
 * Exhaust puffs as plain animated Views over the SVG (SVG animated props did not render on device):
 * every 0.9 s a puff leaves the tailpipe, rises, grows 4 → 22 and fades. Off under Reduce Motion.
 */
function Puffs({ from, scale }: { from: Point; scale: number }) {
  const reduced = useReducedMotion();
  const p0 = useSharedValue(0);
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    [p0, p1, p2].forEach((p, k) => {
      p.value = withDelay(
        k * PUFF_GAP_MS,
        withRepeat(withTiming(1, { duration: PUFF_MS, easing: Easing.linear }), -1),
      );
    });
  }, [reduced, p0, p1, p2]);
  if (reduced || scale === 0) return null;
  return (
    <>
      {[p0, p1, p2].map((p, k) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: three fixed puffs
        <Puff key={k} from={from} k={k} progress={p} scale={scale} />
      ))}
    </>
  );
}

function Puff({
  from,
  k,
  progress,
  scale,
}: {
  from: Point;
  k: number;
  progress: SharedValue<number>;
  scale: number;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const x = interpolate(p, [0, 0.5, 1], [from.x, from.x - 30 - k * 4, from.x - 70 - k * 6]);
    const y = interpolate(p, [0, 0.5, 1], [from.y, from.y - 14, from.y - 40 - k * 4]);
    const r = interpolate(p, [0, 0.5, 1], [4, 12, 22]);
    return {
      opacity: interpolate(p, [0, 0.5, 1], [0, 0.42, 0]),
      left: (x - r) * scale,
      top: (y - r) * scale,
      width: 2 * r * scale,
      height: 2 * r * scale,
      borderRadius: r * scale,
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", backgroundColor: "#C9CED4" }, style]}
    />
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
      <Svg width="100%" height="100%" viewBox="0 0 720 280">
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
      {engine && look === "shaded" ? <Puffs from={g.exhaust} scale={scale} /> : null}
    </View>
  );
}

export const Car = memo(CarImpl);
