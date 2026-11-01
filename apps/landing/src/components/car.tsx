import { type Body, bodyGeometry, needsAssist, viewBoxX } from "@xekey/car";
import { useId } from "react";
import { useReducedMotion } from "../lib/use-reduced-motion";
import s from "./car.module.css";

type Props = {
  body: Body;
  paint: string;
  doors?: "locked" | "unlocked";
  engine?: boolean;
  label?: string;
};

const AMBER = "#FFB547";

/** Exhaust vapor from the design board: 6 puffs, one every 0.45 s, each 2.8–3.5 s. */
const PUFFS = [0, 1, 2, 3, 4, 5].map((k) => {
  const j = (k * 7) % 5;
  return {
    k,
    begin: `${(k * 0.45).toFixed(2)}s`,
    dur: `${(2.8 + (k % 3) * 0.35).toFixed(2)}s`,
    dx: [0, -10 - j, -32 - 3 * j, -58 - 4 * j],
    dy: [0, -6, -30 - 3 * j, -64 - 4 * j],
  };
});
const PUFF_TIMES = "0;.2;.6;1";

/** DOM port of apps/mobile/src/car/car.tsx (shaded look, dark ground). Blinks run in CSS, vapor in SMIL as on the board. */
export function Car({ body, paint, doors = "locked", engine = false, label }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const u = (name: string) => `url(#${id}${name})`;
  const g = bodyGeometry(body);
  const p = g.profile;
  const assisted = needsAssist(paint, "dark");
  const reduced = useReducedMotion();
  const ex = g.exhaust;

  return (
    <svg
      className={s.car}
      viewBox={`${viewBoxX(body)} 0 720 280`}
      role="img"
      aria-label={label ?? `Honda ${p.name}`}
    >
      <defs>
        <linearGradient id={`${id}shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.42} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.08} />
          <stop offset="0.55" stopColor="#000000" stopOpacity={0.02} />
          <stop offset="0.72" stopColor="#000000" stopOpacity={0.22} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.14} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#46525F" />
          <stop offset="0.45" stopColor="#151A20" />
          <stop offset="1" stopColor="#07090B" />
        </linearGradient>
        <radialGradient id={`${id}rim`} cx="0.42" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#C9CED4" />
          <stop offset="0.55" stopColor="#7C828A" />
          <stop offset="1" stopColor="#3C4046" />
        </radialGradient>
        <radialGradient id={`${id}rimDark`} cx="0.42" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#4A4F57" />
          <stop offset="0.6" stopColor="#25282D" />
          <stop offset="1" stopColor="#121417" />
        </radialGradient>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}head`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#EAF6FF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#EAF6FF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}tail`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FF4A3D" stopOpacity={0.8} />
          <stop offset="1" stopColor="#FF4A3D" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}amber`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={AMBER} stopOpacity={1} />
          <stop offset="1" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}floor`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000000" stopOpacity={0.7} />
          <stop offset="1" stopColor="#000000" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}smoke`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#E4E8EC" stopOpacity={0.7} />
          <stop offset="0.5" stopColor="#C9CED4" stopOpacity={0.3} />
          <stop offset="1" stopColor="#C9CED4" stopOpacity={0} />
        </radialGradient>
        <filter
          id={`${id}smokeF`}
          filterUnits="userSpaceOnUse"
          x={ex.x - 160}
          y={60}
          width={460}
          height={220}
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022"
            numOctaves={2}
            seed={7}
            result="n"
          >
            <animate
              attributeName="baseFrequency"
              values="0.018;0.028;0.018"
              dur="7s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={9}
            xChannelSelector="R"
            yChannelSelector="G"
            result="d"
          />
          <feGaussianBlur in="d" stdDeviation={3.6} />
        </filter>
      </defs>
      {assisted ? <ellipse cx={372} cy={150} rx={350} ry={120} fill={u("glow")} /> : null}
      <ellipse cx={372} cy={254} rx={336} ry={14} fill={u("floor")} />
      <path d={g.archShadow} fill="#050506" />
      <path d={g.body} fill={paint} />
      <path d={g.body} fill={u("shade")} />
      <path d={g.body} fill={u("sheen")} />
      {assisted ? (
        <path
          d={g.body}
          fill="none"
          stroke="rgba(255,255,255,.34)"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      ) : null}
      <path d={p.glass} fill={u("glass")} />
      <path d={p.pillars} fill="#0B0D10" />
      <path d={p.belt} stroke={g.beltColor} strokeWidth={g.beltWidth} fill="none" />
      <path d={p.crease} stroke="#FFFFFF" strokeOpacity={0.32} strokeWidth={1.6} fill="none" />
      <path d={p.lower} stroke="#000000" strokeOpacity={0.28} strokeWidth={2} fill="none" />
      <path d={p.doors} stroke="#000000" strokeOpacity={0.4} strokeWidth={1.4} fill="none" />
      <path
        d={p.handles}
        stroke="#000000"
        strokeOpacity={0.5}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path d={p.mirror} fill="#121417" />
      <path d={g.rocker} fill="#000000" opacity={0.5} />
      <path d={p.intake} stroke="#0B0C0E" strokeWidth={7} strokeLinecap="round" fill="none" />
      {p.aero ? <path d={p.aero} fill="#0B0C0E" /> : null}
      <path d={p.head} stroke="#F1F8FF" strokeWidth={4} strokeLinecap="round" fill="none" />
      <path d={p.tail} stroke="#E0332E" strokeWidth={5} strokeLinecap="round" fill="none" />
      {g.wheels.map((w) => (
        <g key={w.cx}>
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="#0C0D0F" />
          <circle cx={w.cx} cy={w.cy} r={w.rim} fill={u(w.darkRim ? "rimDark" : "rim")} />
          <circle cx={w.cx} cy={w.cy} r={w.inner} fill="#1B1D21" />
          {w.caliper ? (
            <path
              d={w.caliper}
              stroke="#D7262B"
              strokeWidth={8}
              strokeLinecap="round"
              fill="none"
            />
          ) : null}
          <path
            d={w.spokes}
            stroke={w.spokeColor}
            strokeWidth={w.spokeWidth}
            strokeLinecap="round"
          />
          <circle cx={w.cx} cy={w.cy} r={6} fill="#9AA0A7" />
        </g>
      ))}
      {doors === "unlocked" ? (
        <g>
          <path d={p.handles} stroke={AMBER} strokeWidth={3.5} strokeLinecap="round" />
          <ellipse
            className={s.mirror}
            cx={g.mirror.x}
            cy={g.mirror.y}
            rx={16}
            ry={10}
            fill={u("amber")}
          />
          <ellipse
            className={s.corner}
            cx={g.head.x}
            cy={g.head.y}
            rx={20}
            ry={12}
            fill={u("amber")}
          />
          <ellipse
            className={s.corner}
            cx={g.tail.x}
            cy={g.tail.y}
            rx={18}
            ry={11}
            fill={u("amber")}
          />
        </g>
      ) : null}
      {engine ? (
        <g>
          <ellipse cx={g.head.x} cy={g.head.y} rx={44} ry={20} fill={u("head")} />
          <ellipse cx={g.tail.x} cy={g.tail.y} rx={30} ry={15} fill={u("tail")} />
          <ellipse cx={ex.x} cy={ex.y} rx={5} ry={3.5} fill="#050506" />
          {reduced ? null : (
            <g filter={u("smokeF")}>
              {PUFFS.map((pf) => (
                <circle key={pf.k} cx={ex.x} cy={ex.y} r={3} fill={u("smoke")} opacity={0}>
                  <animate
                    attributeName="cx"
                    values={pf.dx.map((d) => ex.x + d).join(";")}
                    keyTimes={PUFF_TIMES}
                    dur={pf.dur}
                    begin={pf.begin}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values={pf.dy.map((d) => ex.y + d).join(";")}
                    keyTimes={PUFF_TIMES}
                    dur={pf.dur}
                    begin={pf.begin}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="r"
                    values="4;12;22;34"
                    keyTimes={PUFF_TIMES}
                    dur={pf.dur}
                    begin={pf.begin}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;.85;.5;0"
                    keyTimes="0;.12;.5;1"
                    dur={pf.dur}
                    begin={pf.begin}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}
        </g>
      ) : null}
    </svg>
  );
}
