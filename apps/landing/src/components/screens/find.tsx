import {
  ArrowsClockwiseIcon,
  BellRingingIcon,
  CaretLeftIcon,
  CarProfileIcon,
  ClockIcon,
  CrosshairIcon,
  HeadlightsIcon,
  MapPinIcon,
  NavigationArrowIcon,
} from "@phosphor-icons/react";
import s from "./find.module.css";
import { appStrings, GlassCircle, Phone, type ScreenProps } from "./phone";

const SPOT = { name: "Landmark 81", area: "Bình Thạnh", km: 1.2, ageMin: 14, accuracyM: 20 };

const ROOFS = ["#55585a", "#3f3a34", "#4a4640", "#46494a", "#2c3a34", "#3a3d3f", "#2f3335"];
const TREES = ["#24442b", "#1a3322", "#1f3a26"];
const ROADS =
  "M0 140 L390 210 M0 300 L390 360 M90 0 L130 650 M270 0 L250 650 M0 450 L390 470 M0 600 L390 590";

const rand = (() => {
  let seed = 81;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
})();
const roofs = Array.from({ length: 8 * 16 }, (_, i) => ({
  x: (i % 8) * 47 + 2 + rand() * 6,
  y: Math.floor(i / 8) * 42 + 2 + rand() * 6,
  w: 22 + rand() * 16,
  h: 18 + rand() * 14,
  fill: ROOFS[Math.floor(rand() * ROOFS.length)],
}));
const trees = Array.from({ length: 110 }, () => ({
  x: rand() * 390,
  y: rand() * 650,
  r: 4 + rand() * 7,
  fill: TREES[Math.floor(rand() * TREES.length)],
}));
const STALLS = [150, 164, 178, 192, 206, 220, 234, 248];
const CARS: [number, number, string][] = [
  [153, 272, "#c9ccd0"],
  [167, 313, "#2a2d33"],
  [181, 272, "#7a1d1d"],
  [209, 272, "#1c2a44"],
  [223, 313, "#9aa0a6"],
  [237, 272, "#e3e3e3"],
  [251, 313, "#3d3d40"],
];

function SatelliteMap() {
  return (
    <svg className={s.map} width="390" height="650" viewBox="0 0 390 650" aria-hidden="true">
      <rect width="390" height="650" fill="#2b2f2c" />
      {roofs.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={r.h} rx="2" fill={r.fill} />
      ))}
      {trees.map((t) => (
        <circle key={`${t.x}-${t.y}`} cx={t.x} cy={t.y} r={t.r} fill={t.fill} />
      ))}
      <path
        d="M-20 520 C80 470 140 380 230 330 S360 250 420 240"
        fill="none"
        stroke="#2a4a5c"
        strokeWidth="46"
      />
      <path d={ROADS} stroke="#5c5f61" strokeWidth="12" />
      <path d={ROADS} stroke="#e8e2c8" strokeWidth=".8" strokeDasharray="6 6" opacity=".5" />
      <rect x="140" y="262" width="122" height="76" rx="4" fill="#4a4d50" />
      {STALLS.map((x) => (
        <path
          key={x}
          d={`M${x} 270 v18 M${x} 312 v18`}
          stroke="#8b8f92"
          strokeWidth="1.2"
          opacity=".7"
        />
      ))}
      {CARS.map(([x, y, fill]) => (
        <rect key={x} x={x} y={y} width="9" height="15" rx="3" fill={fill} />
      ))}
      <text x="300" y="196" className={s.street}>
        Điện Biên Phủ
      </text>
      <text x="12" y="132" className={s.street}>
        Nguyễn Hữu Cảnh
      </text>
      <circle cx="120" cy="420" r="8" fill="#0A84FF" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

export function FindScreen({ lang }: ScreenProps) {
  const t = appStrings(lang);
  const stats = [
    { Icon: NavigationArrowIcon, value: `${SPOT.km} km` },
    { Icon: ClockIcon, value: t.minShort(SPOT.ageMin) },
    { Icon: CrosshairIcon, value: `±${SPOT.accuracyM} m` },
  ];
  return (
    <Phone>
      <SatelliteMap />
      <span className={s.marker}>
        <span className={s.dot}>
          <CarProfileIcon size={20} />
        </span>
      </span>
      <GlassCircle className={`${s.mapGlass} ${s.back}`}>
        <CaretLeftIcon size={22} />
      </GlassCircle>
      <div className={s.sheet}>
        <GlassCircle className={`${s.mapGlass} ${s.recenter}`}>
          <NavigationArrowIcon size={22} />
        </GlassCircle>
        <div className={s.head}>
          <span className={s.pin}>
            <MapPinIcon size={22} />
          </span>
          <div className={s.place}>
            <div className={s.name}>{SPOT.name}</div>
            <div className={s.area}>{SPOT.area}</div>
          </div>
        </div>
        <div className={s.row8}>
          {stats.map(({ Icon, value }) => (
            <span key={value} className={s.tile}>
              <Icon size={16} />
              <span>{value}</span>
            </span>
          ))}
        </div>
        <div className={s.row12}>
          <span className={s.action}>
            <HeadlightsIcon size={18} />
            <span className={s.lights}>{t.flashLights}</span>
          </span>
          <span className={s.action}>
            <BellRingingIcon size={18} />
            <span className={s.horn}>{t.holdToHonk}</span>
          </span>
        </div>
        <div className={s.row12}>
          <span className={`${s.big} ${s.primary}`}>
            <ArrowsClockwiseIcon size={20} />
            {t.update}
          </span>
          <span className={s.big}>
            <NavigationArrowIcon size={20} />
            {t.go}
          </span>
        </div>
      </div>
    </Phone>
  );
}
