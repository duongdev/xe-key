import {
  CaretLeftIcon,
  FanIcon,
  KeyIcon,
  PlusIcon,
  PowerIcon,
  SnowflakeIcon,
  TimerIcon,
} from "@phosphor-icons/react";
import s from "./engine.module.css";
import { appStrings, GlassCircle, Phone, type ScreenProps } from "./phone";

const RUN_S = 600;
const LEFT_S = 588;
const MAX_STARTS = 2;
const STARTS = 1;
const AC = 1;
const TARGET_C = 26;
const OFF_AT = "09:51";
const SIZE = 260;
const R = 112;
const LEN = 2 * Math.PI * R;

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export function EngineScreen({ lang }: ScreenProps) {
  const t = appStrings(lang);
  return (
    <Phone>
      <div className={s.screen}>
        <div className={s.header}>
          <GlassCircle className={s.back}>
            <CaretLeftIcon size={22} />
          </GlassCircle>
          <span className={s.title}>{t.climate}</span>
          <span className={s.spacer} />
        </div>

        <div className={s.ring}>
          <svg width={SIZE} height={SIZE} className={s.ringSvg} aria-hidden="true">
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="var(--s2)"
              strokeWidth={8}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="var(--acc)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={LEN}
              strokeDashoffset={LEN * (1 - LEFT_S / RUN_S)}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </svg>
          <div className={s.center}>
            <SnowflakeIcon size={20} color="var(--acc)" />
            <span className={s.big}>
              {[...clock(LEFT_S)].map((ch, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: position is the identity of a digit cell
                <span key={i} className={/\d/.test(ch) ? s.digit : s.sep}>
                  {ch}
                </span>
              ))}
            </span>
            <span className={s.sub}>
              <TimerIcon size={16} />
              {t.offAt(OFF_AT)}
            </span>
          </div>
        </div>

        <div className={s.msg}>
          <SnowflakeIcon size={18} />
          {t.cooling(TARGET_C)}
        </div>

        <div className={s.ac}>
          <div className={s.row}>
            <span className={s.caption}>
              <FanIcon size={16} />
              {t.ac}
            </span>
            <span className={s.bars}>
              {[6, 10, 14].map((h, k) => (
                <span key={h} className={k <= AC ? s.barOn : s.bar} style={{ height: h }} />
              ))}
            </span>
          </div>
          <div className={s.slider}>
            {t.acLevels.map((o, i) =>
              i === AC ? (
                <span key={o} className={s.knob}>
                  <SnowflakeIcon size={16} />
                  {o}
                </span>
              ) : (
                <span key={o} className={s.opt}>
                  {o}
                </span>
              ),
            )}
          </div>
        </div>

        <div className={`${s.row} ${s.starts}`}>
          <span className={s.caption}>
            <KeyIcon size={16} />
            {t.startsLeft(STARTS)}
          </span>
          <span className={s.pills}>
            {Array.from({ length: MAX_STARTS }, (_, i) => i + 1).map((n) => (
              <span key={n} className={STARTS >= n ? s.pillOn : s.pill} />
            ))}
          </span>
        </div>

        <div className={s.actions}>
          <span className={s.stop}>
            <PowerIcon size={20} />
            {t.stop}
          </span>
          <span className={s.extend}>
            <PlusIcon size={20} />
            {t.extend}
          </span>
        </div>
      </div>
    </Phone>
  );
}
