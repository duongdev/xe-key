import {
  BellIcon,
  CaretRightIcon,
  ClockIcon,
  GasPumpIcon,
  GaugeIcon,
  LockOpenIcon,
  NavigationArrowIcon,
  PathIcon,
  PowerIcon,
  RoadHorizonIcon,
  SlidersHorizontalIcon,
  SnowflakeIcon,
  ThermometerSimpleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Car } from "../car";
import s from "./main.module.css";
import { appStrings, GlassCircle, Phone, type ScreenProps } from "./phone";

const CAR = {
  model: "HR-V e:HEV",
  plate: "51K-123.45",
  cabinC: 34,
  fuelPct: 62,
  rangeKm: 418,
  place: "Landmark 81",
  km: 1.2,
  updatedMin: 2,
  alerts: 2,
};

function Chip({
  icon,
  text,
  after,
  dim,
}: {
  icon: ReactNode;
  text: string;
  after?: ReactNode;
  dim?: boolean;
}) {
  return (
    <span className={dim ? `${s.chip} ${s.dim}` : s.chip}>
      {icon}
      {text}
      {after}
    </span>
  );
}

export function MainScreen({ lang }: ScreenProps) {
  const t = appStrings(lang);
  const tabs = [
    { key: "status", Icon: GaugeIcon, label: t.status, badge: 0 },
    { key: "trips", Icon: PathIcon, label: t.trips, badge: 0 },
    { key: "alerts", Icon: BellIcon, label: t.alerts, badge: CAR.alerts },
  ];
  return (
    <Phone>
      <div className={s.page}>
        <div className={s.header}>
          <div className={s.name}>
            <span className={s.label}>{CAR.model}</span>
            <span className={s.caption}>{CAR.plate}</span>
          </div>
          <GlassCircle>
            <SlidersHorizontalIcon size={20} />
          </GlassCircle>
        </div>

        <div className={s.headline}>
          <h3 className={s.title}>{t.locked}</h3>
          <div className={s.chips}>
            <Chip icon={<PowerIcon size={16} />} text={t.off} />
            <Chip
              icon={<ThermometerSimpleIcon size={16} className={s.fg2} />}
              text={`${CAR.cabinC}°`}
              after={<i className={s.dot} />}
            />
            <Chip dim icon={<ClockIcon size={16} />} text={t.age(CAR.updatedMin, "m")} />
          </div>
        </div>

        <div className={s.car}>
          <Car body="crossover" paint="#6B7078" />
        </div>

        <div className={s.fuel}>
          <div className={s.fuelRow}>
            <span className={s.stat}>
              <GasPumpIcon size={18} className={s.fg2} />
              {CAR.fuelPct}%
            </span>
            <span className={s.stat}>
              <span>
                {CAR.rangeKm}
                <small> km</small>
              </span>
              <RoadHorizonIcon size={18} className={s.fg2} />
            </span>
          </div>
          <div className={s.bar}>
            <span style={{ width: `${CAR.fuelPct}%` }} />
          </div>
        </div>

        <div className={s.place}>
          <svg width={52} height={52} viewBox="0 0 56 56" className={s.map} aria-hidden="true">
            <rect width={56} height={56} fill="var(--s2)" />
            <path
              d="M0 18 L56 26 M14 0 L22 56 M0 44 L56 38 M40 0 L36 56"
              stroke="var(--line)"
              strokeWidth={3}
            />
            <circle cx={29} cy={29} r={9} fill="var(--acc)" opacity={0.2} />
            <circle cx={29} cy={29} r={4.5} fill="var(--acc)" />
          </svg>
          <div className={s.placeText}>
            <span className={`${s.label} ${s.medium}`}>{CAR.place}</span>
            <span className={s.sub}>
              <NavigationArrowIcon size={14} />
              {`${CAR.km} km`}
            </span>
          </div>
          <CaretRightIcon size={18} className={s.fg2} />
        </div>

        <div className={s.banner}>
          <WarningIcon size={18} />
          <span>{`${t.window} · ${t.windowOpen(t.sideNames.rl, 3)}`}</span>
          <CaretRightIcon size={16} />
        </div>

        <div className={s.spacer} />

        <div className={s.controls}>
          <span className={s.button}>
            <LockOpenIcon size={22} />
            {t.holdToUnlock}
          </span>
          <span className={s.button}>
            <SnowflakeIcon size={22} className={s.acc} />
            {t.start}
          </span>
        </div>

        <div className={s.tabs}>
          {tabs.map(({ key, Icon, label, badge }) => (
            <span key={key} className={s.tab}>
              <span className={s.tabIcon}>
                <Icon size={22} />
                {badge ? <b className={s.badge}>{badge}</b> : null}
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </Phone>
  );
}
