import {
  CaretLeftIcon,
  CaretRightIcon,
  GasPumpIcon,
  GaugeIcon,
  RoadHorizonIcon,
  SunIcon,
  TimerIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { appStrings, GlassCircle, Phone, type ScreenProps } from "./phone";
import s from "./trips.module.css";

type Trip = {
  start: string;
  end: string;
  km: number;
  min: number;
  max: number;
  avg: number;
  fuel: number;
  from: string;
  to: string;
};

/** Last week, Mon 26 Oct – Sun 1 Nov 2026, newest day first (sample data). */
const DAYS: { date: Date; trips: Trip[] }[] = [
  {
    date: new Date(2026, 9, 31),
    trips: [
      {
        start: "09:12",
        end: "09:58",
        km: 22,
        min: 46,
        max: 88,
        avg: 29,
        fuel: 11.2,
        from: "Thủ Đức",
        to: "Phú Mỹ Hưng",
      },
    ],
  },
  {
    date: new Date(2026, 9, 30),
    trips: [
      {
        start: "18:05",
        end: "18:42",
        km: 9,
        min: 37,
        max: 62,
        avg: 15,
        fuel: 8.9,
        from: "Nguyễn Huệ, Q.1",
        to: "Thảo Điền",
      },
      {
        start: "08:10",
        end: "08:54",
        km: 19,
        min: 44,
        max: 79,
        avg: 26,
        fuel: 10.4,
        from: "Thủ Đức",
        to: "Nguyễn Huệ, Q.1",
      },
    ],
  },
  {
    date: new Date(2026, 9, 28),
    trips: [
      {
        start: "14:00",
        end: "14:41",
        km: 17,
        min: 41,
        max: 69,
        avg: 25,
        fuel: 9.6,
        from: "Phú Mỹ Hưng",
        to: "Thảo Điền",
      },
    ],
  },
  {
    date: new Date(2026, 9, 27),
    trips: [
      {
        start: "08:18",
        end: "09:10",
        km: 19,
        min: 52,
        max: 91,
        avg: 22,
        fuel: 10.8,
        from: "Thủ Đức",
        to: "Phú Mỹ Hưng",
      },
    ],
  },
  {
    date: new Date(2026, 9, 26),
    trips: [
      {
        start: "17:40",
        end: "17:56",
        km: 7,
        min: 16,
        max: 52,
        avg: 26,
        fuel: 9.4,
        from: "Landmark 81",
        to: "Thảo Điền",
      },
      {
        start: "08:06",
        end: "08:48",
        km: 17,
        min: 42,
        max: 74,
        avg: 24,
        fuel: 10.3,
        from: "Thảo Điền",
        to: "Landmark 81",
      },
    ],
  },
];

const WEEK = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 26 + i));
const BAR_PT = 64;
const DAY_PCT = 74;
const AVG_KML = 10.1;

const kmOf = (trips: Trip[]) => trips.reduce((n, t) => n + t.km, 0);
const minOf = (trips: Trip[]) => trips.reduce((n, t) => n + t.min, 0);

function band(kmh: number) {
  return kmh <= 49 ? 1 : kmh <= 89 ? 2 : 3;
}

function Bands({ kmh }: { kmh: number }) {
  const b = band(kmh);
  return (
    <span className={s.bands}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i > b ? undefined : b === 1 ? s.on1 : s.on2} />
      ))}
    </span>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className={s.stat}>
      <span className={s.statLabel}>
        {icon}
        <span>{label}</span>
      </span>
      <span>
        <b className={s.statValue}>{value}</b>
        {unit ? <span className={s.statUnit}> {unit}</span> : null}
      </span>
    </div>
  );
}

export function TripsScreen({ lang }: ScreenProps) {
  const t = appStrings(lang);
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const n = (v: number, d = 0) =>
    v.toLocaleString(locale, { maximumFractionDigits: d, minimumFractionDigits: d });
  const all = DAYS.flatMap((d) => d.trips);
  const km = kmOf(all);
  const seconds = minOf(all) * 60;
  const kmPerL = all.reduce((a, tr) => a + tr.km * tr.fuel, 0) / km;
  const byDay = (d: Date) => DAYS.find((x) => x.date.getTime() === d.getTime())?.trips ?? [];
  const maxBar = Math.max(...WEEK.map((d) => kmOf(byDay(d))));
  const title = (d: Date) =>
    lang === "vi"
      ? `${t.weekdaysShort[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`
      : `${t.weekdaysShort[d.getDay()]} ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  const tone = (fuel: number) =>
    fuel / AVG_KML <= 0.9 ? s.fuelWarn : fuel / AVG_KML >= 1.1 ? s.fuelAcc : s.fuelFg2;
  const ic = { size: 13, color: "var(--fg2)" };

  return (
    <Phone>
      <div className={s.screen}>
        <div className={s.header}>
          <GlassCircle className={s.back}>
            <CaretLeftIcon size={22} />
          </GlassCircle>
          <h1 className={s.title}>{t.trips}</h1>
        </div>

        <div className={s.card}>
          <div className={s.switch}>
            {t.summaryKinds.map((k, i) => (
              <span key={k} className={i === 0 ? s.knob : undefined}>
                {k}
              </span>
            ))}
          </div>
          <div className={s.page}>
            <div className={s.headline}>
              <CaretLeftIcon size={18} color="var(--fg2)" />
              <span>{`${t.lastWeek} · ${t.tripCount(all.length)}`}</span>
              <CaretRightIcon size={18} color="var(--fg2)" />
            </div>
            <div className={s.bars}>
              {WEEK.map((d) => {
                const v = kmOf(byDay(d));
                return (
                  <div key={d.getTime()} className={s.barCol}>
                    <span
                      className={v ? s.bar : `${s.bar} ${s.barEmpty}`}
                      style={{ height: v ? Math.max(4, (v / maxBar) * BAR_PT) : 3 }}
                    />
                    <span className={s.barLabel}>{t.weekdays[d.getDay()]}</span>
                  </div>
                );
              })}
            </div>
            <div className={s.rule} />
            <div className={s.grid}>
              <Stat
                icon={<RoadHorizonIcon {...ic} />}
                label={t.statDistance}
                value={n(km)}
                unit="km"
              />
              <Stat icon={<TimerIcon {...ic} />} label={t.statTime} value={t.dur(seconds)} />
              <Stat
                icon={<GaugeIcon {...ic} />}
                label={t.statAvgSpeed}
                value={n(km / (seconds / 3600))}
                unit="km/h"
              />
              <Stat
                icon={<GaugeIcon {...ic} />}
                label={t.statMaxSpeed}
                value={n(Math.max(...all.map((tr) => tr.max)))}
                unit="km/h"
              />
              <Stat
                icon={<GasPumpIcon {...ic} />}
                label={t.statFuel}
                value={n(kmPerL, 1)}
                unit="km/l"
              />
              <div className={s.stat}>
                <span className={s.statLabel}>
                  <SunIcon {...ic} />
                  <span>{t.statDayNight}</span>
                </span>
                <span className={s.dayNight}>
                  <i style={{ flex: DAY_PCT }} />
                  <i style={{ flex: 100 - DAY_PCT }} />
                </span>
                <span className={s.pcts}>
                  <span>
                    <i className={s.dotDay} />
                    {DAY_PCT}%
                  </span>
                  <span>
                    <i className={s.dotNight} />
                    {100 - DAY_PCT}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className={s.listHeader}>{`${t.lastWeek} · ${t.daysCount(DAYS.length)}`}</p>
        <div>
          {DAYS.map((day, di) => (
            <div key={day.date.getTime()}>
              <div className={di ? `${s.dayRow} ${s.sep}` : s.dayRow}>
                <span className={s.ring}>{day.trips.length}</span>
                <span className={s.dayMain}>
                  <b>{title(day.date)}</b>
                  <span>{t.tripCount(day.trips.length)}</span>
                </span>
                <span className={s.dayTotals}>
                  <b>{`${kmOf(day.trips)} km`}</b>
                  <span>{t.dur(minOf(day.trips) * 60)}</span>
                </span>
                <CaretRightIcon size={14} color="var(--fg2)" className={s.open} />
              </div>
              {day.trips.map((tr, i) => (
                <div key={tr.start} className={i ? `${s.trip} ${s.sep}` : s.trip}>
                  <span className={s.range}>{`${tr.start}–${tr.end}`}</span>
                  <div className={s.places}>
                    <span className={s.dots}>
                      <i className={s.dotFrom} />
                      <i className={s.dotTo} />
                    </span>
                    <span className={s.names}>
                      <span className={s.from}>{tr.from}</span>
                      <span className={s.to}>{tr.to}</span>
                    </span>
                    <span className={s.tripTotals}>
                      <b>{`${tr.km} km`}</b>
                      <span>{t.minShort(tr.min)}</span>
                    </span>
                  </div>
                  <div className={s.metrics}>
                    {t.metricLabels.map((l) => (
                      <span key={l} className={s.metricLabel}>
                        {l}
                      </span>
                    ))}
                    <span className={s.metric}>
                      <Bands kmh={tr.max} />
                      <b>{n(tr.max)}</b>
                      <small>km/h</small>
                    </span>
                    <span className={s.metric}>
                      <Bands kmh={tr.avg} />
                      <b>{n(tr.avg)}</b>
                      <small>km/h</small>
                    </span>
                    <span className={s.metric}>
                      <span className={s.meter}>
                        <i
                          className={tone(tr.fuel)}
                          style={{
                            width: `${Math.min(1, Math.max(0, (tr.fuel - 6) / 10)) * 100}%`,
                          }}
                        />
                      </span>
                      <b>{n(tr.fuel, 1)}</b>
                      <small>km/l</small>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}
