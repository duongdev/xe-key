import { Pressable, View } from "react-native";
import { useLang, useT } from "../i18n";
import { useFormatTime } from "../i18n/format";
import { useFuel } from "../i18n/fuel";
import type { Trip } from "../services/car";
import { useTheme } from "../theme/use-theme";
import { Shimmer } from "./appear";
import { Text } from "./text";

const DAY = 86_400_000;
/** From and to lines (HANDOFF › Trip row): the dots, day label, km pill and minutes sit on them. */
const LINE = 20;
const DOT = 8;
const DOT_COL = 12;
// "Hôm nay" (VI) shrinks a little to fit; wider would cut the stats line.
const DAY_COL = 50;

/** Two lines with a dot on each line's centre, joined by a dotted line. */
function Dots() {
  const { c } = useTheme();
  return (
    <View style={{ width: DOT_COL, height: LINE * 2, alignItems: "center" }}>
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
            width: DOT,
            height: DOT,
            borderRadius: DOT / 2,
            borderWidth: 1.5,
            borderColor: c.fg2,
            backgroundColor: c.bg,
          }}
        />
      </View>
      <View style={{ height: LINE, justifyContent: "center" }}>
        <View style={{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: c.acc }} />
      </View>
    </View>
  );
}

export function TripRow({
  trip,
  first,
  onPress,
}: {
  trip: Trip;
  first: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const t = useT();
  const fuel = useFuel();
  const time = useFormatTime();
  const lang = useLang();
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // Live trips have no place names until the Honda PIN loads them: the lines show times instead.
  const timed = trip.from === null || trip.to === null;
  const d = new Date(trip.startedAt);
  const when =
    trip.startedAt >= dayStart
      ? t.today
      : trip.startedAt >= dayStart - DAY
        ? t.yesterday
        : trip.startedAt >= dayStart - 6 * DAY
          ? (t.weekdaysShort[d.getDay()] ?? "")
          : `${d.getDate()}/${d.getMonth() + 1}`;
  const from = timed ? time(trip.startedAt) : trip.from;
  const to = timed ? (trip.endedAt ? time(trip.endedAt) : "") : trip.to;
  const n = (v: number) => v.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
  const fuelText = fuel(trip.kmPerL);
  const stats = [
    !timed && trip.endedAt ? `${time(trip.startedAt)}–${time(trip.endedAt)}` : null,
    trip.avgKmh != null ? `${n(Math.round(trip.avgKmh))} km/h` : null,
    fuelText ? `${fuelText.value} ${fuelText.unit}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const line = { height: LINE, lineHeight: LINE } as const;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      accessibilityLabel={[
        when,
        `${from} → ${to}`,
        `${n(trip.km)} km`,
        t.minShort(trip.minutes),
        stats,
      ]
        .filter(Boolean)
        .join(", ")}
      style={{
        flexDirection: "row",
        gap: 10,
        paddingVertical: 12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.sep,
      }}
    >
      <Text
        variant="caption"
        color="fg2"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{ ...line, width: DAY_COL }}
      >
        {when}
      </Text>
      <Dots />
      <View style={{ flex: 1 }}>
        <Text variant="label" weight={400} color="fg2" numberOfLines={1} style={line}>
          {from}
        </Text>
        <Text variant="label" weight={600} numberOfLines={1} style={line}>
          {to}
        </Text>
        {stats ? (
          <Text variant="caption" color="fg2" numberOfLines={1} style={{ marginTop: 2 }}>
            {stats}
          </Text>
        ) : null}
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
    </Pressable>
  );
}

/** Same boxes as a trip row (72 pt). */
export function TripRowSkeleton({ first }: { first: boolean }) {
  const { c } = useTheme();
  const bar = { backgroundColor: c.s1, borderRadius: 6 } as const;
  return (
    <View
      style={{
        height: 72,
        flexDirection: "row",
        gap: 10,
        paddingVertical: 12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.sep,
      }}
    >
      <View style={{ width: DAY_COL, height: LINE, justifyContent: "center" }}>
        <Shimmer style={{ ...bar, width: 36, height: 10 }} />
      </View>
      <Dots />
      <View style={{ flex: 1, gap: 6, paddingTop: 4 }}>
        <Shimmer style={{ ...bar, width: "35%", height: 12 }} />
        <Shimmer style={{ ...bar, width: "45%", height: 14 }} />
        <Shimmer style={{ ...bar, width: "60%", height: 10 }} />
      </View>
      <View style={{ alignItems: "flex-end", gap: 8 }}>
        <Shimmer style={{ ...bar, width: 56, height: LINE, borderRadius: 8 }} />
        <Shimmer style={{ ...bar, width: 40, height: 10 }} />
      </View>
    </View>
  );
}
