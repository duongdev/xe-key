import {
  CarBatteryIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  ClockIcon,
  EngineIcon,
  GasPumpIcon,
  GaugeIcon,
  type Icon,
  LockIcon,
  WarningIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { appStrings, GlassCircle, Phone, type ScreenProps } from "./phone";
import s from "./status.module.css";

const DUE = new Date(2026, 10, 14).getTime();
const REPORTED = new Date(2026, 10, 2, 9, 40).getTime();
const CHECKED = new Date(2026, 10, 2, 9, 41).getTime();

const STRIPS = {
  fl: "M20 106 L20 148",
  rl: "M20 152 L20 194",
  fr: "M120 106 L120 148",
  rr: "M120 152 L120 194",
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function TopDown() {
  return (
    <div className={s.topDown}>
      <svg width={132} height={264} viewBox="0 0 140 280" aria-hidden="true">
        <rect x={12} y={44} width={10} height={34} rx={4} fill="var(--s2)" />
        <rect x={118} y={44} width={10} height={34} rx={4} fill="var(--s2)" />
        <rect x={12} y={198} width={10} height={34} rx={4} fill="var(--s2)" />
        <rect x={118} y={198} width={10} height={34} rx={4} fill="var(--s2)" />
        <rect
          x={20}
          y={10}
          width={100}
          height={260}
          rx={42}
          fill="var(--s1)"
          stroke="var(--line)"
          strokeWidth={2}
        />
        <path d="M30 70 C44 50 96 50 110 70" fill="none" stroke="var(--line)" strokeWidth={2} />
        <path d="M34 80 L106 80 L98 110 L42 110 Z" fill="var(--s2)" />
        <path d="M42 190 L98 190 L104 214 L36 214 Z" fill="var(--s2)" />
        <path d="M30 222 C44 246 96 246 110 222" fill="none" stroke="var(--line)" strokeWidth={2} />
        <rect x={6} y={90} width={12} height={7} rx={3} fill="var(--line)" />
        <rect x={122} y={90} width={12} height={7} rx={3} fill="var(--line)" />
        {Object.entries(STRIPS).map(([side, d]) => (
          <path
            key={side}
            d={d}
            stroke={side === "rl" ? "var(--warn)" : "var(--acc)"}
            strokeWidth={side === "rl" ? 5 : 4}
            strokeLinecap="round"
          />
        ))}
        <circle cx={70} cy={150} r={17} fill="var(--bg)" />
      </svg>
      <LockIcon className={s.topLock} size={18} />
    </div>
  );
}

type Tile = {
  icon: Icon;
  label: string;
  value: string;
  sub?: string;
  bar?: number;
  wide?: boolean;
};

export function StatusScreen({ lang }: ScreenProps) {
  const t = appStrings(lang);
  const num = (n: number) => n.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
  const due = new Date(DUE).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "short",
  });

  const rows = [
    { title: t.doors, value: t.locked, warn: false, icon: LockIcon },
    { title: t.window, value: t.windowOpen(t.sideNames.rl, 3), warn: true, icon: WarningIcon },
    { title: t.trunk, value: t.closed, warn: false, icon: CheckIcon },
    { title: t.hood, value: t.closed, warn: false, icon: CheckIcon },
  ];

  const tiles: Tile[] = [
    { icon: EngineIcon, label: t.engine, value: t.off },
    { icon: GasPumpIcon, label: t.fuelLabel, value: `62% · ${num(418)} km`, bar: 62 },
    { icon: CarBatteryIcon, label: t.battery12v, value: `${(12.4).toFixed(1)} V` },
    { icon: GaugeIcon, label: t.odometer, value: `≈ ${num(29_592)} km`, sub: t.estimated },
    {
      icon: WrenchIcon,
      label: t.service,
      value: t.inKm(num(800)),
      sub: `${t.orDays(12, due)} · ${t.whicheverFirst}`,
      wide: true,
    },
  ];

  return (
    <Phone>
      <div className={s.screen}>
        <div className={s.header}>
          <GlassCircle className={s.back}>
            <CaretLeftIcon size={22} />
          </GlassCircle>
          <span className={s.title}>{t.status}</span>
          <span className={s.pill}>
            <ClockIcon size={14} color="var(--fg2)" />
            {t.minShort(1)}
          </span>
        </div>

        <div className={s.content}>
          <div className={s.banner}>
            <WrenchIcon size={18} />
            <div className={s.grow}>
              <div className={s.bannerTitle}>{t.serviceIn(num(800))}</div>
              <div className={s.caption}>{t.orDays(12, due)}</div>
            </div>
            <CaretRightIcon size={16} />
          </div>

          <div className={s.car}>
            <TopDown />
            <div className={s.rows}>
              {rows.map((r) => (
                <div key={r.title} className={r.warn ? `${s.row} ${s.warn}` : s.row}>
                  <span className={s.rowIcon}>
                    <r.icon size={16} />
                  </span>
                  <div className={s.grow}>
                    <div className={s.rowTitle}>{r.title}</div>
                    <div className={s.caption}>{r.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={s.tiles}>
            {tiles.map((tile) => (
              <div key={tile.label} className={tile.wide ? `${s.tile} ${s.wide}` : s.tile}>
                <div className={s.tileHead}>
                  <tile.icon size={16} />
                  <span className={s.grow}>{tile.label}</span>
                  {tile.wide ? <CaretRightIcon size={14} /> : null}
                </div>
                <div className={s.value}>{tile.value}</div>
                {tile.sub ? <div className={s.sub}>{tile.sub}</div> : null}
                {tile.bar !== undefined ? (
                  <div className={s.bar}>
                    <div style={{ width: `${tile.bar}%` }} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className={s.footer}>
            {t.reportedChecked(formatTime(REPORTED), formatTime(CHECKED))}
          </div>
        </div>
      </div>
    </Phone>
  );
}
