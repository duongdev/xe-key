import {
  ArrowRightIcon,
  BellIcon,
  CheckCircleIcon,
  GaugeIcon,
  type Icon,
  LockIcon,
  MapPinIcon,
  PathIcon,
  SnowflakeIcon,
} from "@phosphor-icons/react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import type { Copy } from "../copy";
import { slideAt, swipeStep } from "../lib/carousel";
import { useReducedMotion } from "../lib/use-reduced-motion";
import s from "./tour.module.css";

const AUTOPLAY_MS = 6000;

/** Same order as `t.tour`. */
const SLIDES: { icon: Icon; color: string; src: string }[] = [
  { icon: LockIcon, color: "var(--fg)", src: "/tour/main.webp" },
  { icon: SnowflakeIcon, color: "var(--acc)", src: "/tour/engine.webp" },
  { icon: MapPinIcon, color: "var(--fg)", src: "/tour/find.webp" },
  { icon: GaugeIcon, color: "var(--fg)", src: "/tour/status.webp" },
  { icon: PathIcon, color: "var(--fg)", src: "/tour/trips.webp" },
  { icon: BellIcon, color: "var(--warn)", src: "/tour/notifications.webp" },
];
const N = SLIDES.length;

function Detail({
  title,
  bullets,
  playing,
}: {
  title: string;
  bullets: string[];
  playing: boolean;
}) {
  return (
    <>
      <h3>{title}</h3>
      <ul className={s.bullets}>
        {bullets.map((b) => (
          <li key={b}>
            <CheckCircleIcon size={20} color="var(--acc)" aria-hidden />
            {b}
          </li>
        ))}
      </ul>
      <div className={playing ? s.bar : `${s.bar} ${s.off}`}>
        <i />
      </div>
    </>
  );
}

export function Tour({ t }: { t: Copy }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduced = useReducedMotion();
  const startX = useRef<number | null>(null);
  const playing = auto && !reduced;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIndex((i) => slideAt(i, 1, N)), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [playing]);

  const go = (k: number) => {
    setAuto(false);
    setIndex(slideAt(k, 0, N));
  };

  const down = (e: PointerEvent) => {
    startX.current = e.clientX;
  };
  const up = (e: PointerEvent) => {
    if (startX.current === null) return;
    const step = swipeStep(e.clientX - startX.current);
    startX.current = null;
    if (step !== 0) go(index + step);
  };

  const current = t.tour[index];

  return (
    <section className="sec">
      <div className="glow" style={{ right: -200, top: 100, width: 900, height: 900 }} />
      <div className="wrap">
        <p className="kick">{t.k5}</p>
        <h2>{t.h2f}</h2>
        <p className="sub">{t.s2f}</p>
        <div className={s.tour}>
          <div className={s.tabs}>
            {SLIDES.map(({ icon: TabIcon, color }, i) => {
              const item = t.tour[i];
              if (!item) return null;
              const [label, title, bullets] = item;
              const on = i === index;
              return (
                <div key={label} className={on ? `${s.tab} ${s.on}` : s.tab}>
                  <button type="button" aria-pressed={on} onClick={() => go(i)}>
                    <span className={s.ti}>
                      <TabIcon size={22} color={color} aria-hidden />
                    </span>
                    {label}
                  </button>
                  <div className={s.det} hidden={!on} key={on ? index : -1}>
                    <Detail title={title} bullets={bullets} playing={on && playing} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={s.stage}>
            <section
              className={s.frame}
              onPointerDown={down}
              onPointerUp={up}
              onPointerCancel={() => {
                startX.current = null;
              }}
              aria-roledescription="carousel"
              aria-label={t.k5}
            >
              <div className={s.screen}>
                {SLIDES.map((slide, i) => {
                  const d = i - index;
                  return (
                    <div
                      key={slide.src}
                      className={s.slide}
                      aria-hidden={d !== 0}
                      style={{
                        opacity: d === 0 ? 1 : 0,
                        transform:
                          d === 0
                            ? "translateX(0)"
                            : `translateX(${d > 0 ? 48 : -48}px) scale(.98)`,
                      }}
                    >
                      <img
                        src={slide.src}
                        alt={t.tour[i]?.[0] ?? ""}
                        width={390}
                        height={844}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
            <div className={s.ctl}>
              <button type="button" aria-label={t.prev} onClick={() => go(index - 1)}>
                <ArrowRightIcon size={20} color="var(--fg)" style={{ transform: "scaleX(-1)" }} />
              </button>
              <span>
                {index + 1} / {N}
              </span>
              <button type="button" aria-label={t.next} onClick={() => go(index + 1)}>
                <ArrowRightIcon size={20} color="var(--fg)" />
              </button>
            </div>
          </div>
          {current ? (
            <div className={s.mdet} key={index}>
              <Detail title={current[1]} bullets={current[2]} playing={playing} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
