import {
  CalendarIcon,
  CaretLeftIcon,
  CheckIcon,
  type Icon,
  LockIcon,
  LockOpenIcon,
  MapPinIcon,
  PowerIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import s from "./alerts.module.css";
import { appStrings, GlassCapsule, GlassCircle, Phone, type ScreenProps } from "./phone";

type Kind = "unlocked" | "auto-off" | "locked" | "zone" | "service" | "renew";
type Tone = "acc" | "warn" | "fg2";

const KINDS: Record<Kind, { icon: Icon; tone: Tone }> = {
  unlocked: { icon: LockOpenIcon, tone: "warn" },
  "auto-off": { icon: PowerIcon, tone: "acc" },
  locked: { icon: LockIcon, tone: "fg2" },
  zone: { icon: MapPinIcon, tone: "acc" },
  service: { icon: WrenchIcon, tone: "warn" },
  renew: { icon: CalendarIcon, tone: "fg2" },
};

type Sample = { kind: Kind; n?: number; time: string; day?: number; unread?: boolean };

const TODAY: Sample[] = [
  { kind: "unlocked", n: 15, time: "07:50", unread: true },
  { kind: "auto-off", time: "07:31", unread: true },
  { kind: "locked", time: "07:12" },
];
const EARLIER: Sample[] = [
  { kind: "zone", time: "18:00", day: 3 },
  { kind: "service", n: 1200, time: "09:00", day: 2 },
  { kind: "renew", n: 30, time: "09:00", day: 1 },
];

export function AlertsScreen({ lang }: ScreenProps) {
  const t = appStrings(lang);
  const unread = TODAY.filter((a) => a.unread).length;

  const row = (a: Sample) => {
    const { icon: Glyph, tone } = KINDS[a.kind];
    const when = a.day === undefined ? a.time : `${t.weekdaysShort[a.day]} ${a.time}`;
    return (
      <div key={a.kind} className={s.row}>
        <span className={`${s.badge} ${s[tone]}`}>
          <Glyph size={20} />
        </span>
        <span className={a.unread ? `${s.title} ${s.bold}` : s.title}>
          {t.alertText[a.kind](a.n)}
        </span>
        {a.unread ? <span className={s.dot} /> : null}
        <span className={s.when}>{when}</span>
      </div>
    );
  };

  return (
    <Phone>
      <div className={s.screen}>
        <header className={s.header}>
          <GlassCircle className={s.back}>
            <CaretLeftIcon size={22} />
          </GlassCircle>
          <h3 className={s.h1}>{t.alerts}</h3>
          <GlassCircle className={s.check}>
            <CheckIcon size={22} />
          </GlassCircle>
        </header>
        <p className={s.section}>{t.today}</p>
        {TODAY.map(row)}
        <p className={s.section}>{t.earlier}</p>
        {EARLIER.map(row)}
      </div>
      <div className={s.dock}>
        <GlassCapsule className={s.tabs}>
          <span className={`${s.tab} ${s.on}`}>{t.alertFilters.all}</span>
          <span className={s.tab}>
            {t.alertFilters.warnings}
            <span className={s.count}>{unread}</span>
          </span>
          <span className={s.tab}>{t.alertFilters.commands}</span>
        </GlassCapsule>
      </div>
    </Phone>
  );
}
