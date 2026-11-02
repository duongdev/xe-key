import {
  BellIcon,
  CarIcon,
  DevicesIcon,
  GaugeIcon,
  type Icon,
  LockIcon,
  MapPinIcon,
  PathIcon,
  ScanSmileyIcon,
  ShareNetworkIcon,
  SnowflakeIcon,
  SparkleIcon,
  TimerIcon,
} from "@phosphor-icons/react";
import type { Copy } from "../copy";
import s from "./features.module.css";

/** Same order as `t.f`. */
const ICONS: [Icon, string][] = [
  [LockIcon, "var(--fg)"],
  [SnowflakeIcon, "var(--acc)"],
  [TimerIcon, "var(--acc)"],
  [MapPinIcon, "var(--fg)"],
  [GaugeIcon, "var(--fg)"],
  [PathIcon, "var(--fg)"],
  [BellIcon, "var(--warn)"],
  [ScanSmileyIcon, "var(--fg)"],
  [SparkleIcon, "var(--fg)"],
  [DevicesIcon, "var(--fg)"],
  [ShareNetworkIcon, "var(--fg)"],
  [CarIcon, "var(--fg)"],
];

export function Features({ t }: { t: Copy }) {
  return (
    <section className="sec">
      <div className="wrap">
        <p className="kick">{t.k2}</p>
        <h2>{t.h2b}</h2>
        <div className={s.grid}>
          {ICONS.map(([FeatIcon, color], i) => {
            const item = t.f[i];
            if (!item) return null;
            return (
              <div key={item[0]} className={s.card}>
                <span className={s.ib}>
                  <FeatIcon size={22} color={color} aria-hidden />
                </span>
                <b>{item[0]}</b>
                <span>{item[1]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
