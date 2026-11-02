import {
  CaretLeftIcon,
  CaretRightIcon,
  GasPumpIcon,
  GaugeIcon,
  RoadHorizonIcon,
  SunIcon,
  TimerIcon,
} from "phosphor-react-native";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  canStep,
  type Period,
  type PeriodKind,
  periodBars,
  periodIndex,
  periodOf,
  periodRange,
  periodStats,
  type SummaryRow,
  stepPeriod,
} from "../car/summary";
import { useLang, useT } from "../i18n";
import type { Summary } from "../services/car";
import { haptics } from "../theme/haptics";
import { settle, useReducedMotion } from "../theme/motion";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Shimmer } from "./appear";
import { SegmentedSlider } from "./segmented-slider";
import { Text } from "./text";

const BAR_PT = 64;
const KINDS: PeriodKind[] = ["week", "month", "year"];
/**
 * HANDOFF › Driving summary: the card never changes height across periods. The board says 321 pt;
 * with the app's switch (40) and Text line heights the same rows need 362.
 */
export const SUMMARY_CARD_H = 362;
const ACCEL_ROWS_H = 50;

const inPeriod = (rows: SummaryRow[], p: Period) =>
  rows.filter((r) => r.date >= p.start && r.date < p.end);

/** Stats from Day rows (week, month) or Honda's own Year row; bars from Day or Month rows. */
function periodData(s: Summary, p: Period) {
  if (p.kind !== "year") {
    const rows = inPeriod(s.day, p);
    return { stats: periodStats(rows), bars: rows };
  }
  const year = inPeriod(s.year, p);
  const months = inPeriod(s.month, p);
  return { stats: periodStats(year.length ? year : months), bars: months };
}

export function usePeriodTitle(p: Period, today: Date) {
  const t = useT();
  const locale = useLang() === "vi" ? "vi-VN" : "en-US";
  const month = (ms: number) => new Date(ms).toLocaleDateString(locale, { month: "short" });
  if (p.kind === "year") return String(new Date(p.start).getFullYear());
  const now = periodOf(p.kind, today);
  if (p.kind === "month") {
    if (p.start === now.start) return t.thisMonth;
    return new Date(p.start).toLocaleDateString(locale, { month: "long", year: "numeric" });
  }
  if (p.start === now.start) return t.thisWeek;
  if (p.start === stepPeriod(now, -1).start) return t.lastWeek;
  const { first, last } = periodRange(p);
  const a = new Date(first);
  const b = new Date(last);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${month(last)}`
    : `${a.getDate()} ${month(first)}–${b.getDate()} ${month(last)}`;
}

/** Number 16 semibold + unit 12 fg2 (HANDOFF › Stats). */
function Stat({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  unit?: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value === null ? "–" : `${value} ${unit ?? ""}`}`}
      style={{ flex: 1, gap: 4 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        {icon}
        <Text variant="caption" color="fg2" numberOfLines={1} style={{ fontSize: 13 }}>
          {label}
        </Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        <Text weight={600} style={{ fontSize: 16 }}>
          {value ?? "–"}
        </Text>
        {value !== null && unit ? (
          <Text color="fg2" style={{ fontSize: 12 }}>{` ${unit}`}</Text>
        ) : null}
      </Text>
    </View>
  );
}

function PctBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const { c } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${pct}%`}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <Text variant="caption" color="fg2" style={{ width: 100, fontSize: 13 }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.s2 }}>
        <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: color }} />
      </View>
      <Text variant="caption" color="fg2" style={{ width: 36, textAlign: "right", fontSize: 13 }}>
        {`${pct}%`}
      </Text>
    </View>
  );
}

/** One period: title, bars, stats. The pager shows three side by side. */
function Page({
  summary,
  period,
  picked,
  today,
  accel,
  onPick,
}: {
  summary: Summary | undefined;
  period: Period;
  picked: number | null;
  today: Date;
  accel: boolean;
  onPick?: (start: number | null) => void;
}) {
  const { c } = useTheme();
  const t = useT();
  const lang = useLang();
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const n = (v: number, digits = 0) =>
    v.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const kind = period.kind;
  const data = summary ? periodData(summary, period) : null;
  const stats = data?.stats;
  const bars = periodBars(period, data?.bars ?? [], today);
  const max = Math.max(0, ...bars.map((b) => b.km));
  const title = usePeriodTitle(period, today);
  const headline = !stats
    ? title
    : stats.trips
      ? `${title} · ${t.tripCount(stats.trips)}`
      : t.noTripsIn[kind];
  const label = (start: number, i: number) => {
    const d = new Date(start);
    if (kind === "week") return t.weekdays[d.getDay()] ?? "";
    if (kind === "month")
      return [1, 8, 15, 22, 29].includes(d.getDate()) ? String(d.getDate()) : "";
    return lang === "vi" ? String(i + 1) : d.toLocaleDateString(locale, { month: "narrow" });
  };
  const dayPct = stats?.dayPct == null ? null : Math.round(stats.dayPct * 100);
  const bar = { backgroundColor: c.s2, borderRadius: 6 } as const;
  // Placeholder bar heights while a range has no data yet.
  const ghost = [0.5, 0.25, 0.8, 0.3, 0.6, 0.15, 0.4];

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View style={{ height: 32, justifyContent: "center", paddingHorizontal: 40 }}>
        <Text
          weight={600}
          accessibilityRole="header"
          numberOfLines={1}
          style={{ textAlign: "center", fontSize: 16 }}
        >
          {headline}
        </Text>
      </View>
      <View style={{ height: BAR_PT + 22, flexDirection: "row", alignItems: "flex-end" }}>
        {bars.map((b, i) => {
          const on = picked === b.start;
          const lit = picked === null ? b.today : on;
          const h = stats
            ? b.km && max
              ? Math.max(4, (b.km / max) * BAR_PT)
              : 3
            : (ghost[i % ghost.length] ?? 0.3) * BAR_PT;
          return (
            <Pressable
              key={b.start}
              // A month's trips would take a call per day, so Year bars only show distance.
              disabled={!onPick || !stats || b.future || kind === "year"}
              accessibilityRole="button"
              accessibilityLabel={`${new Date(b.start).toLocaleDateString(locale)}: ${n(b.km)} km`}
              accessibilityState={{ selected: on, disabled: b.future || kind === "year" }}
              onPress={() => onPick?.(on ? null : b.start)}
              style={{ flex: 1, alignItems: "center", gap: 6 }}
            >
              {stats ? (
                <View
                  style={{
                    width: kind === "week" ? 22 : "70%",
                    maxWidth: 22,
                    height: h,
                    borderRadius: kind === "month" ? 2 : 6,
                    backgroundColor: lit ? c.acc : b.km ? c.line : c.s2,
                    opacity: b.future ? 0.35 : picked !== null && !on ? 0.4 : 1,
                  }}
                />
              ) : (
                <Shimmer
                  style={{
                    ...bar,
                    width: kind === "week" ? 22 : "70%",
                    maxWidth: 22,
                    height: h,
                    borderRadius: kind === "month" ? 2 : 6,
                  }}
                />
              )}
              {/* Wider than a month column; centred and allowed past it. */}
              <View style={{ width: 28, alignItems: "center" }}>
                <Text
                  variant="caption"
                  color={b.today ? "fg" : "fg2"}
                  weight={b.today ? 700 : 600}
                  numberOfLines={1}
                  style={{ fontSize: 11, lineHeight: 14, height: 14 }}
                >
                  {label(b.start, i)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: 1, backgroundColor: c.s2 }} />
      {stats ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Stat
              icon={<RoadHorizonIcon size={14} color={c.fg2} />}
              label={t.statDistance}
              value={stats.trips ? n(stats.km) : null}
              unit="km"
            />
            <Stat
              icon={<TimerIcon size={14} color={c.fg2} />}
              label={t.statTime}
              value={stats.trips ? t.dur(stats.seconds) : null}
            />
            <Stat
              icon={<GaugeIcon size={14} color={c.fg2} />}
              label={t.statAvgSpeed}
              value={stats.avgKmh !== null ? n(stats.avgKmh) : null}
              unit="km/h"
            />
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Stat
              icon={<GaugeIcon size={14} color={c.fg2} />}
              label={t.statMaxSpeed}
              value={stats.maxKmh !== null ? n(stats.maxKmh) : null}
              unit="km/h"
            />
            <Stat
              icon={<GasPumpIcon size={14} color={c.fg2} />}
              label={t.statFuel}
              value={stats.kmPerL !== null ? n(stats.kmPerL, 1) : null}
              unit="km/l"
            />
            <View
              accessible
              accessibilityLabel={
                dayPct === null
                  ? `${t.statDayNight}: –`
                  : `${t.statDayNight}: ${t.dayNightPct(dayPct, 100 - dayPct)}`
              }
              style={{ flex: 1, gap: 6 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <SunIcon size={14} color={c.fg2} />
                <Text variant="caption" color="fg2" numberOfLines={1} style={{ fontSize: 13 }}>
                  {t.statDayNight}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden" }}
              >
                <View style={{ flex: dayPct ?? 0, backgroundColor: c.warn }} />
                <View
                  style={{ flex: dayPct === null ? 0 : 100 - dayPct, backgroundColor: c.night }}
                />
                <View style={{ flex: dayPct === null ? 1 : 0, backgroundColor: c.s2 }} />
              </View>
              {/* Two percents with colour dots (HANDOFF › Stats). */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {dayPct === null ? (
                  <Text variant="caption" color="fg2" style={{ fontSize: 11 }}>
                    –
                  </Text>
                ) : (
                  (
                    [
                      [dayPct, c.warn],
                      [100 - dayPct, c.night],
                    ] as const
                  ).map(([pct, color]) => (
                    <View
                      key={color}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                    >
                      <View
                        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
                      />
                      <Text variant="caption" color="fg2" style={{ fontSize: 11 }}>
                        {`${pct}%`}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
          {accel ? (
            <View style={{ gap: 8 }}>
              <PctBar label={t.hardAccel} pct={Math.round(stats.accelPct ?? 0)} color={c.acc} />
              <PctBar label={t.hardBraking} pct={Math.round(stats.brakePct ?? 0)} color={c.warn} />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {[0, 1].map((r) => (
            <View key={r} style={{ flexDirection: "row", gap: 12 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flex: 1, gap: 8, paddingVertical: 2 }}>
                  <Shimmer style={{ ...bar, height: 12, width: "70%" }} />
                  <Shimmer style={{ ...bar, height: 16, width: "55%" }} />
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Driving summary (HANDOFF › Driving summary, Browse, No drift): a pager of periods. Drag the body
 * sideways (neighbour visible), snap past 25% or a flick (Settle 300 ms), else spring back; ends
 * rubber-band; ‹ › slide the same way. Fixed height; `summary` undefined shows skeleton bars and
 * stats with the real switch and title.
 */
export function SummaryCard({
  summary,
  kind,
  period,
  picked,
  today,
  onKind,
  onPeriod,
  onPick,
}: {
  summary: Summary | undefined;
  kind: PeriodKind;
  period: Period;
  picked: number | null;
  today: Date;
  onKind: (k: PeriodKind) => void;
  onPeriod: (p: Period) => void;
  onPick: (start: number | null) => void;
}) {
  const { c } = useTheme();
  const t = useT();
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  // Pages sit at fixed places on a track (period index × width), so landing on a period never
  // moves the track: no frame where new pages show at the old offset. `pos` is the track offset.
  const index = periodIndex(period, today);
  const pos = useSharedValue(0);
  const oldest = summary?.day.length ? Math.min(...summary.day.map((r) => r.date)) : null;
  const back = !!summary && canStep(period, -1, today, oldest);
  const ahead = !!summary && canStep(period, 1, today, oldest);
  // Decided per car (any value Honda ever sent above 0), so rows never pop in or out per period.
  const accel = !!summary?.day.some((r) => (r.accelPct ?? 0) > 0 || (r.brakePct ?? 0) > 0);

  // The pan runs on the UI thread with callbacks made once: read live values from shared values.
  const live = useSharedValue({ w: 0, index: 0, back: false, ahead: false });
  // Only a width or kind change (not a swipe) moves the track here; a swipe already ended there.
  useLayoutEffect(() => {
    live.value = { w, index, back, ahead };
    pos.value = -index * w;
  }, [w, index, back, ahead, live, pos]);

  const land = (dir: -1 | 1) => {
    haptics.selection();
    onPeriod(stepPeriod(period, dir));
  };
  const landRef = useRef(land);
  landRef.current = land;
  const [landLatest] = useState(() => (dir: -1 | 1) => landRef.current(dir));

  const slide = (dir: -1 | 1) => {
    if (!w || reduced) return land(dir);
    pos.value = withTiming(-(index + dir) * w, { duration: 300, easing: settle }, (done) => {
      if (done) runOnJS(landLatest)(dir);
    });
  };

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-10, 10],
    onUpdate: (e) => {
      "worklet";
      const { w: width, index: at, back: b, ahead: f } = live.value;
      const dx = e.translationX;
      // Ends rubber-band.
      pos.value = -at * width + ((dx > 0 && !b) || (dx < 0 && !f) ? dx * 0.3 : dx);
    },
    onDeactivate: (e) => {
      "worklet";
      const { w: width, index: at, back: b, ahead: f } = live.value;
      const dx = e.translationX;
      const dir = dx > 0 ? -1 : 1;
      const allowed = dir === -1 ? b : f;
      if (allowed && width && (Math.abs(dx) > width * 0.25 || Math.abs(e.velocityX) > 600)) {
        pos.value = withTiming(-(at + dir) * width, { duration: 300, easing: settle }, (done) => {
          if (done) runOnJS(landLatest)(dir);
        });
      } else {
        pos.value = withSpring(-at * width, { duration: 300, dampingRatio: 0.9 });
      }
    },
  });
  const track = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value }] }));
  const pages = [
    back ? stepPeriod(period, -1) : null,
    period,
    ahead ? stepPeriod(period, 1) : null,
  ];

  return (
    <View
      style={{
        height: SUMMARY_CARD_H + (accel ? ACCEL_ROWS_H : 0),
        padding: 16,
        gap: 12,
        borderRadius: radius.card,
        backgroundColor: c.s1,
      }}
    >
      <SegmentedSlider
        options={t.summaryKinds}
        value={KINDS.indexOf(kind)}
        onChange={(i) => onKind(KINDS[i] ?? "week")}
        label={t.trips}
        height={40}
      />
      <View
        style={{ flex: 1, overflow: "hidden" }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        <GestureDetector gesture={pan}>
          <Animated.View style={[{ flex: 1 }, track]}>
            {pages.map((p, i) =>
              p ? (
                <View
                  key={`${p.kind}-${p.start}`}
                  pointerEvents={i === 1 ? "auto" : "none"}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: w,
                    left: (index + i - 1) * w,
                  }}
                >
                  {w ? (
                    <Page
                      summary={summary}
                      period={p}
                      picked={i === 1 ? picked : null}
                      today={today}
                      accel={accel}
                      onPick={i === 1 ? onPick : undefined}
                    />
                  ) : null}
                </View>
              ) : null,
            )}
          </Animated.View>
        </GestureDetector>
        {/* Arrows stay put while the title slides between them. */}
        {(
          [
            [-1, back, CaretLeftIcon, t.earlierPeriod],
            [1, ahead, CaretRightIcon, t.laterPeriod],
          ] as const
        ).map(([dir, on, Icon, a11y]) => (
          <Pressable
            key={dir}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            accessibilityState={{ disabled: !on }}
            disabled={!on}
            onPress={() => slide(dir)}
            hitSlop={6}
            style={{
              position: "absolute",
              top: -2,
              [dir === -1 ? "left" : "right"]: 0,
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              opacity: on ? 1 : 0.3,
            }}
          >
            <Icon size={18} color={c.fg2} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
