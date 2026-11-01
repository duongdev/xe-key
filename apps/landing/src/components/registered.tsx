import { CheckCircleIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { Copy } from "../copy";
import { type Platform, submitSurvey } from "../lib/signup";
import s from "./registered.module.css";

const CARS = ["HR-V", "Civic", "City", "CR-V", "BR-V", "Accord", "other"] as const;
/** Stable ids for `t.likes`, same order. */
const FEATURES = ["lock", "climate", "find", "status", "trips", "siri-widgets", "sharing"] as const;
const COPIED_MS = 1800;

type Props = { t: Copy; email: string; platform: Platform };

export function Registered({ t, email, platform }: Props) {
  const [car, setCar] = useState<number | null>(null);
  const [likes, setLikes] = useState<number[]>([]);
  const [survey, setSurvey] = useState<"open" | "sent" | "skipped">("open");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const send = async () => {
    const res = await submitSurvey({
      email,
      car: car === null ? null : (CARS[car] ?? null),
      features: likes.map((i) => FEATURES[i] ?? String(i)),
    });
    if (res.ok) setSurvey("sent");
    else console.error("survey submit failed", res.error);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.origin);
    } catch (e) {
      console.error("copy link failed", e);
      return;
    }
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div className={s.reg} role="status">
      <div className={s.head}>
        <svg className={s.tick} viewBox="0 0 56 56" aria-hidden="true">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="var(--acc)"
            strokeWidth="3"
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
          />
          <path
            d="M18 29l7 7 13-15"
            fill="none"
            stroke="var(--acc)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <b>{t.doneT}</b>
          <span>
            {t.regTo} <em>{email}</em>
            <i className={s.ptag}>{platform === "android" ? "Android" : "iPhone"}</i>
          </span>
        </div>
      </div>

      {survey === "open" ? (
        <>
          <div className={s.q}>
            <p>{t.q1}</p>
            <div className={s.chips}>
              {CARS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={car === i}
                  onClick={() => setCar(car === i ? null : i)}
                >
                  {c === "other" ? t.other : c}
                </button>
              ))}
            </div>
          </div>
          <div className={s.q}>
            <p>
              {t.q2}
              <i>{t.q2h}</i>
            </p>
            <div className={s.chips}>
              {t.likes.map((label, i) => {
                const on = likes.includes(i);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setLikes(on ? likes.filter((k) => k !== i) : [...likes, i])}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={s.foot}>
            <button
              type="button"
              className="go"
              disabled={car === null && likes.length === 0}
              onClick={send}
            >
              {t.send}
            </button>
            <button type="button" className={s.skip} onClick={() => setSurvey("skipped")}>
              {t.skip}
            </button>
          </div>
        </>
      ) : null}

      {survey === "sent" ? (
        <div className={s.thx}>
          <CheckCircleIcon size={24} color="var(--acc)" aria-hidden />
          <div>
            <b>{t.thx}</b>
            {t.thxS}
          </div>
        </div>
      ) : null}

      <div className={s.share}>
        <span>{t.shareT}</span>
        <button type="button" onClick={copyLink}>
          <ShareNetworkIcon size={18} color="var(--bg)" aria-hidden />
          {copied ? t.copied : t.copy}
        </button>
      </div>
    </div>
  );
}
