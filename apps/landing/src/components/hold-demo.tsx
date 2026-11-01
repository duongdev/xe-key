import {
  CheckCircleIcon,
  HandPointingIcon,
  LockIcon,
  LockOpenIcon,
  ScanSmileyIcon,
} from "@phosphor-icons/react";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import type { Copy } from "../copy";
import { Car } from "./car";
import s from "./hold-demo.module.css";

/** Same rule as the app: 600 ms hold arms it, then a fake send before the car confirms. */
const HOLD_MS = 600;
const SEND_MS = 1400;

type Hold = "idle" | "holding" | "sending" | "done";

export function HoldDemo({ t }: { t: Copy }) {
  const [hold, setHold] = useState<Hold>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const down = (e?: PointerEvent<HTMLDivElement>) => {
    if (hold === "done") {
      setHold("idle");
      return;
    }
    if (hold !== "idle") return;
    if (e) e.currentTarget.setPointerCapture(e.pointerId);
    setHold("holding");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setHold("sending");
      timer.current = setTimeout(() => setHold("done"), SEND_MS);
    }, HOLD_MS);
  };

  const up = () => {
    if (hold !== "holding") return;
    clearTimeout(timer.current);
    setHold("idle");
  };

  const key = (e: KeyboardEvent) => {
    if (e.repeat || (e.key !== " " && e.key !== "Enter")) return;
    e.preventDefault();
    down();
  };

  const open = hold === "done";
  const label = { idle: t.hIdle, holding: t.hHold, sending: t.hSend, done: t.hDone }[hold];
  const StateIcon = open ? LockOpenIcon : LockIcon;
  const HoldIcon = open ? LockIcon : LockOpenIcon;
  const stateColor = open ? "var(--warn)" : "var(--fg)";
  const filled = hold === "holding" || hold === "sending";

  return (
    <section className="sec">
      <div className={`wrap ${s.speed}`}>
        <div>
          <p className="kick">{t.k1}</p>
          <h2>{t.h2a}</h2>
          <p className="sub">{t.s2a}</p>
          <div className={s.steps}>
            <div className={s.step}>
              <span className={s.n}>
                <ScanSmileyIcon size={24} color="var(--fg)" aria-hidden />
              </span>
              <b>{t.st1}</b>
              <em>{t.st1t}</em>
            </div>
            <div className={s.step}>
              <span className={s.n}>
                <HandPointingIcon size={24} color="var(--warn)" aria-hidden />
              </span>
              <b>{t.st2}</b>
              <em>{t.st2t}</em>
            </div>
            <div className={s.step}>
              <span className={s.n}>
                <CheckCircleIcon size={24} color="var(--acc)" aria-hidden />
              </span>
              <b>{t.st3}</b>
              <em>{t.st3t}</em>
            </div>
          </div>
        </div>
        <div className={s.demo}>
          <div
            className="glow"
            style={{
              left: -80,
              right: -80,
              top: 40,
              height: 320,
              background: `radial-gradient(closest-side,${open ? "rgba(255,181,71,.14)" : "rgba(124,199,255,.10)"},rgba(0,0,0,0))`,
            }}
          />
          <div className={s.hint}>
            <HandPointingIcon size={16} color="var(--fg2)" aria-hidden />
            {t.tryIt}
          </div>
          <div className={s.state} style={{ color: stateColor }} aria-live="polite">
            <StateIcon size={28} color={stateColor} aria-hidden />
            {open ? t.sOpen : hold === "sending" ? t.sSend : t.sLocked}
          </div>
          <div className={s.carbox}>
            <Car body="city" paint="#E9E9E6" doors={open ? "unlocked" : "locked"} />
          </div>
          {/* biome-ignore lint/a11y/useSemanticElements: a press-and-hold control, not a click button */}
          <div
            className={open ? `${s.hold} ${s.open}` : s.hold}
            role="button"
            tabIndex={0}
            aria-label={t.holdLabel}
            onPointerDown={down}
            onPointerUp={up}
            onPointerLeave={up}
            onPointerCancel={up}
            onKeyDown={key}
            onKeyUp={up}
          >
            <span
              className={s.fill}
              style={{
                width: filled ? "100%" : "0%",
                transition:
                  hold === "holding" ? `width ${HOLD_MS}ms linear` : "width 150ms ease-out",
                opacity: hold === "sending" ? 0.35 : 0.9,
              }}
            />
            <span className={s.label}>
              {hold === "sending" ? <span className={s.spin} /> : null}
              <HoldIcon size={20} aria-hidden />
              {label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
