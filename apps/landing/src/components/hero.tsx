import {
  GasPumpIcon,
  LockIcon,
  LockOpenIcon,
  MapPinIcon,
  PowerIcon,
  SnowflakeIcon,
  ThermometerSimpleIcon,
} from "@phosphor-icons/react";
import { type ReactNode, useEffect, useState } from "react";
import type { Copy } from "../copy";
import { useReducedMotion } from "../lib/use-reduced-motion";
import { Car } from "./car";
import s from "./hero.module.css";

const LOOP_MS = 3400;
const STATE_ICONS = [LockIcon, LockOpenIcon, SnowflakeIcon];
const PILL_ICONS = [LockIcon, LockOpenIcon, PowerIcon];
const STATE_COLORS = ["var(--fg)", "var(--warn)", "var(--acc)"];
const FLOOR_GLOWS = ["rgba(124,199,255,.10)", "rgba(255,181,71,.16)", "rgba(124,199,255,.22)"];

export function Hero({ t, signup }: { t: Copy; signup: ReactNode }) {
  const [state, setState] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!auto || reduced) return;
    const id = setInterval(() => setState((k) => (k + 1) % 3), LOOP_MS);
    return () => clearInterval(id);
  }, [auto, reduced]);

  const pick = (k: number) => {
    setAuto(false);
    setState(k);
  };

  const StateIcon = STATE_ICONS[state] ?? LockIcon;
  const color = STATE_COLORS[state];

  return (
    <section className={s.hero} id="join">
      <div className={s.text}>
        <span className={s.pill}>
          <span className={s.dot} />
          {t.badge}
        </span>
        <h1>{t.h1}</h1>
        <p className={s.lead}>{t.lead}</p>
        {signup}
      </div>
      <div className={s.stage} aria-live="polite">
        <div
          className={s.floor}
          style={{
            background: `radial-gradient(closest-side,${FLOOR_GLOWS[state]},rgba(0,0,0,0))`,
          }}
        />
        <div className={s.car}>
          <Car
            body="sedan"
            paint="#9E1B22"
            doors={state === 1 ? "unlocked" : "locked"}
            engine={state === 2}
            label="Honda Civic RS"
          />
        </div>
        <div
          className={`${s.hud} ${s.a}`}
          style={{
            color,
            boxShadow: `inset 0 0 0 1px ${state === 0 ? "var(--line)" : color},0 20px 50px rgba(0,0,0,.45)`,
          }}
        >
          <StateIcon size={22} color={color} aria-hidden />
          {t.hs[state]}
        </div>
        <div className={`${s.hud} ${s.b}`}>
          <ThermometerSimpleIcon size={22} color="var(--acc)" aria-hidden />
          {t.hTemp}
          {state === 2 ? "26°" : "34°"}
        </div>
        <div className={`${s.hud} ${s.c}`}>
          <GasPumpIcon size={22} color="var(--fg2)" aria-hidden />
          62% · 418 km
        </div>
        <div className={`${s.hud} ${s.d}`}>
          <MapPinIcon size={22} color="var(--fg2)" aria-hidden />
          {t.hLoc}
        </div>
      </div>
      <div className={s.pills} role="tablist" aria-label={t.hsLabel}>
        {t.hSeg.map((label, i) => {
          const Icon = PILL_ICONS[i] ?? LockIcon;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={i === state}
              onClick={() => pick(i)}
            >
              <Icon size={18} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
