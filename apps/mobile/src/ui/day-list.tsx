import { useQuery } from "@tanstack/react-query";
import { CaretRightIcon } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { type FuelAverage, fuelFill, fuelTone, speedBand } from "../car/behaviour";
import type { SummaryRow } from "../car/summary";
import { useLang, useT } from "../i18n";
import { useFormatTime } from "../i18n/format";
import type { Trip } from "../services/car";
import { carService } from "../services/query";
import type { SavedTrips } from "../services/trip-places";
import { withPlaces } from "../services/trip-places";
import { settle, useReducedMotion } from "../theme/motion";
import { useTheme } from "../theme/use-theme";
import { Shimmer } from "./appear";
import { Text } from "./text";

const ROW_H = 60;
const RING = 30;
const INDENT = 48;
const LINE = 20;

/** Honda's speed bars: 3 segments, acc for band 1, warn for 2–3, empty `line`. */
function Bands({ band }: { band: 0 | 1 | 2 | 3 }) {
  const { c } = useTheme();
  const on = band === 1 ? c.acc : c.warn;
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 10,
            borderRadius: 2,
            backgroundColor: i <= band ? on : c.line,
          }}
        />
      ))}
    </View>
  );
}

function Metric({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 5 }}>{children}</View>
  );
}

/** A stat with its unit: number 12 fg, unit 11 fg2. */
function Value({ value, unit }: { value: string | null; unit: string }) {
  return (
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ flexShrink: 1 }}>
      <Text weight={600} style={{ fontSize: 12 }}>
        {value ?? "–"}
      </Text>
      {value === null ? null : <Text color="fg2" style={{ fontSize: 11 }}>{` ${unit}`}</Text>}
    </Text>
  );
}

/** One trip inside an open day: places or times, km + minutes, then max / avg / fuel. */
function DayTrip({
  trip,
  avg,
  first,
  onPress,
}: {
  trip: Trip;
  avg: FuelAverage;
  first: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const t = useT();
  const time = useFormatTime();
  const lang = useLang();
  const n = (v: number, d = 0) =>
    v.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
      maximumFractionDigits: d,
      minimumFractionDigits: d,
    });
  const timed = trip.from === null || trip.to === null;
  const range = trip.endedAt ? `${time(trip.startedAt)}–${time(trip.endedAt)}` : null;
  const from = timed ? time(trip.startedAt) : trip.from;
  const to = timed ? (trip.endedAt ? time(trip.endedAt) : "") : trip.to;
  const max = trip.maxKmh ?? null;
  const avgKmh = trip.avgKmh ?? null;
  const fuel = trip.kmPerL ?? null;
  const tone = c[fuelTone(fuel, avg)];
  const dash = "–";
  const line = { height: LINE, lineHeight: LINE } as const;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.tripSentence(
        range ?? time(trip.startedAt),
        from ?? "",
        to ?? "",
        n(trip.km, 1),
        trip.minutes,
        max === null ? dash : `${n(max)} km/h`,
        avgKmh === null ? dash : `${n(avgKmh)} km/h`,
        fuel === null ? dash : `${n(fuel, 1)} km/l`,
      )}
      onPress={onPress}
      style={{
        marginLeft: INDENT,
        paddingVertical: 12,
        gap: 8,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.sep,
      }}
    >
      {!timed && range ? (
        <Text color="fg3" style={{ fontSize: 10, lineHeight: 12, marginBottom: -4 }}>
          {range}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ width: 10, alignItems: "center" }}>
          <View
            style={{
              position: "absolute",
              top: LINE / 2,
              height: LINE,
              borderLeftWidth: 1,
              borderStyle: "dotted",
              borderColor: c.fg2,
            }}
          />
          <View style={{ height: LINE, justifyContent: "center" }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: c.fg2,
                backgroundColor: c.bg,
              }}
            />
          </View>
          <View style={{ height: LINE, justifyContent: "center" }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.acc }} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="label" weight={400} color="fg2" numberOfLines={1} style={line}>
            {from}
          </Text>
          <Text variant="label" weight={600} numberOfLines={1} style={line}>
            {to}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View
            style={{
              height: LINE,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: c.s1,
              justifyContent: "center",
            }}
          >
            <Text variant="caption" weight={600}>{`${n(trip.km)} km`}</Text>
          </View>
          <Text variant="caption" color="fg2" style={line}>
            {t.minShort(trip.minutes)}
          </Text>
        </View>
      </View>
      {/* Labels right above three equal columns, so the visuals line up from trip to trip. */}
      <View importantForAccessibility="no-hide-descendants" style={{ gap: 2 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {t.metricLabels.map((label) => (
            <Text
              key={label}
              color="fg3"
              numberOfLines={1}
              style={{ flex: 1, fontSize: 10, lineHeight: 12 }}
            >
              {label}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Metric>
            <Bands band={speedBand(max)} />
            <Value value={max === null ? null : n(max)} unit="km/h" />
          </Metric>
          <Metric>
            <Bands band={speedBand(avgKmh)} />
            <Value value={avgKmh === null ? null : n(avgKmh)} unit="km/h" />
          </Metric>
          <Metric>
            <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: c.line }}>
              <View
                style={{
                  width: `${fuelFill(fuel) * 100}%`,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: tone,
                }}
              />
            </View>
            <Value value={fuel === null ? null : n(fuel, 1)} unit="km/l" />
          </Metric>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Open / close by animating the measured height (Settle 280 ms) and fading the content (200 ms),
 * so rows below move with it. Reduce Motion: a 150 ms fade, no height animation.
 */
function Accordion({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [h, setH] = useState<number | null>(null);
  const height = useSharedValue(open ? -1 : 0);
  const fade = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    if (h === null) return;
    const to = open ? h : 0;
    height.value = reduced ? to : withTiming(to, { duration: 280, easing: settle });
    fade.value = withTiming(open ? 1 : 0, { duration: reduced ? 150 : 200 });
  }, [open, h, reduced, height, fade]);
  const style = useAnimatedStyle(() => ({
    // -1: not measured yet, let it size itself.
    height: height.value < 0 ? undefined : height.value,
    opacity: fade.value,
  }));
  return (
    <Animated.View style={[{ overflow: "hidden" }, style]}>
      {/* Measured off-flow so the height is known even while closed. */}
      <View
        style={{ position: h === null ? "relative" : "absolute", left: 0, right: 0 }}
        onLayout={(e) => {
          const next = e.nativeEvent.layout.height;
          if (next !== h) {
            setH(next);
            if (open) height.value = next;
          }
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

function Chevron({ open }: { open: boolean }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const turn = useSharedValue(open ? 90 : 0);
  useEffect(() => {
    turn.value = reduced
      ? open
        ? 90
        : 0
      : withTiming(open ? 90 : 0, { duration: 240, easing: settle });
  }, [open, reduced, turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <CaretRightIcon size={14} color={c.fg2} />
    </Animated.View>
  );
}

/** A day (or a month in Year) with its ring, totals and, when open, its trips. */
export function DayRow({
  row,
  month,
  open,
  first,
  saved,
  avg,
  onToggle,
  onTrip,
  onLayout,
}: {
  row: SummaryRow;
  /** Year list: a month row (tap switches the card instead of opening). */
  month?: boolean;
  open: boolean;
  first: boolean;
  saved: SavedTrips;
  avg: FuelAverage;
  onToggle: () => void;
  onTrip: (trip: Trip) => void;
  onLayout?: (y: number) => void;
}) {
  const { c } = useTheme();
  const t = useT();
  const lang = useLang();
  const locale = lang === "vi" ? "vi-VN" : "en-GB";
  const d = new Date(row.date);
  const title = month
    ? lang === "vi"
      ? `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
      : d.toLocaleDateString(locale, { month: "long", year: "numeric" })
    : lang === "vi"
      ? `${t.weekdaysShort[d.getDay()] ?? ""}, ${d.getDate()}/${d.getMonth() + 1}`
      : `${t.weekdaysShort[d.getDay()] ?? ""} ${d.toLocaleDateString(locale, { day: "numeric", month: "short" })}`;
  const trips = useQuery({
    queryKey: ["dayTrips", row.date],
    queryFn: () => carService.dayTrips(row.date),
    enabled: !month,
    // Past days never change.
    staleTime: row.date < new Date().setHours(0, 0, 0, 0) ? Number.POSITIVE_INFINITY : 30_000,
  });
  const list = withPlaces(trips.data ?? [], saved);

  return (
    <View onLayout={(e) => onLayout?.(e.nativeEvent.layout.y)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={month ? undefined : { expanded: open }}
        accessibilityLabel={`${title}, ${t.tripCount(row.trips)}, ${Math.round(row.km)} km, ${t.dur(row.seconds)}`}
        onPress={onToggle}
        style={{
          height: ROW_H,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: c.sep,
        }}
      >
        <View
          style={{
            width: RING,
            height: RING,
            borderRadius: RING / 2,
            borderWidth: 2.5,
            borderColor: c.acc,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text weight={700} style={{ fontSize: 13 }}>
            {row.trips}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight={600} numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" color="fg2" style={{ fontSize: 13 }}>
            {t.tripCount(row.trips)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text weight={600} style={{ fontSize: 15 }}>{`${Math.round(row.km)} km`}</Text>
          <Text variant="caption" color="fg2" style={{ fontSize: 13 }}>
            {t.dur(row.seconds)}
          </Text>
        </View>
        {month ? <CaretRightIcon size={14} color={c.fg2} /> : <Chevron open={open} />}
      </Pressable>
      {!month ? (
        <Accordion open={open}>
          {trips.data ? (
            list.map((trip, i) => (
              <DayTrip
                key={trip.id}
                trip={trip}
                avg={avg}
                first={i === 0}
                onPress={() => onTrip(trip)}
              />
            ))
          ) : (
            <View style={{ marginLeft: INDENT, gap: 10, paddingVertical: 12 }}>
              {Array.from({ length: Math.min(row.trips, 3) }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows
                <View key={i} style={{ gap: 6, height: 66 }}>
                  <Shimmer
                    style={{ width: "40%", height: 14, borderRadius: 6, backgroundColor: c.s1 }}
                  />
                  <Shimmer
                    style={{ width: "55%", height: 14, borderRadius: 6, backgroundColor: c.s1 }}
                  />
                  <Shimmer
                    style={{ width: "80%", height: 10, borderRadius: 5, backgroundColor: c.s1 }}
                  />
                </View>
              ))}
            </View>
          )}
        </Accordion>
      ) : null}
    </View>
  );
}
