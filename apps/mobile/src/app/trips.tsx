import { useQuery } from "@tanstack/react-query";
import {
  GaugeIcon,
  LightningIcon,
  PathIcon,
  RoadHorizonIcon,
  SparkleIcon,
  TrafficSignalIcon,
  TrendDownIcon,
  TrendUpIcon,
  WarningIcon,
} from "phosphor-react-native";
import { ActivityIndicator, ScrollView, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { tripTotals, weekBars } from "../car/trips";
import { useLang, useT } from "../i18n";
import { useFormatTime } from "../i18n/format";
import type { Driving, Trip } from "../services/car";
import { carService } from "../services/query";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { EmptyState } from "../ui/empty-state";
import { PageHeader, Pill } from "../ui/page-header";
import { Screen, useBottomPad } from "../ui/screen";
import { Text } from "../ui/text";

const BAR_PT = 64;
const DAY = 86_400_000;

function ScoreRing({ score, delta }: { score: number; delta: number }) {
  const { c } = useTheme();
  const t = useT();
  const r = 42;
  const len = 2 * Math.PI * r;
  const Trend = delta >= 0 ? TrendUpIcon : TrendDownIcon;
  return (
    <View
      accessible
      accessibilityLabel={`${t.score}: ${score}`}
      style={{ width: 104, height: 104, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={104} height={104} style={{ position: "absolute" }}>
        <Circle cx={52} cy={52} r={r} fill="none" stroke={c.s2} strokeWidth={8} />
        <Circle
          cx={52}
          cy={52}
          r={r}
          fill="none"
          stroke={c.acc}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - score / 100)}
          transform="rotate(-90 52 52)"
        />
      </Svg>
      <Text variant="stat" style={{ fontSize: 28, lineHeight: 32 }}>
        {score}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Trend size={12} color={c.acc} />
        <Text variant="caption" color="acc" style={{ fontSize: 12, lineHeight: 14 }}>
          {Math.abs(delta)}
        </Text>
      </View>
    </View>
  );
}

function Behaviour({ d }: { d: Driving }) {
  const { c } = useTheme();
  const t = useT();
  const rows = [
    {
      key: "accel",
      icon: LightningIcon,
      label: t.acceleration,
      value: t.gentle,
      fill: d.accel,
      warn: false,
    },
    {
      key: "brake",
      icon: TrafficSignalIcon,
      label: t.braking,
      value: t.hardBrakes(d.hardBrakes),
      fill: Math.max(0.1, 1 - d.hardBrakes * 0.19),
      warn: d.hardBrakes > 0,
    },
    { key: "speed", icon: GaugeIcon, label: t.speed, value: t.ok, fill: d.speed, warn: false },
  ];
  return (
    <View style={{ flex: 1, gap: 12 }}>
      {rows.map(({ key, icon: Icon, label, value, fill, warn }) => (
        <View
          key={key}
          accessible
          accessibilityLabel={`${label}: ${value}`}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <Icon size={16} color={warn ? c.warn : c.acc} />
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.s2 }}>
            <View
              style={{
                width: `${fill * 100}%`,
                height: 6,
                borderRadius: 3,
                backgroundColor: warn ? c.warn : c.acc,
              }}
            />
          </View>
          <Text variant="caption" color="fg2" style={{ minWidth: 52, textAlign: "right" }}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TripRow({ trip, first }: { trip: Trip; first: boolean }) {
  const { c } = useTheme();
  const t = useT();
  const time = useFormatTime();
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const lang = useLang();
  // Live trips have no place names (needs the Honda PIN), so their lines show start and end time.
  const timed = trip.from === null || trip.to === null;
  const when =
    trip.startedAt >= dayStart
      ? timed
        ? t.today
        : time(trip.startedAt)
      : trip.startedAt >= dayStart - DAY
        ? t.yesterday
        : (t.weekdaysShort[new Date(trip.startedAt).getDay()] ?? "");
  const from = timed ? time(trip.startedAt) : trip.from;
  const to = timed ? (trip.endedAt ? time(trip.endedAt) : "") : trip.to;
  const n = (v: number) => v.toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
  const stats = [
    trip.avgKmh != null ? `${n(Math.round(trip.avgKmh))} km/h` : null,
    trip.kmPerL != null ? `${n(trip.kmPerL)} km/l` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <View
      accessible
      accessibilityLabel={[
        when,
        `${from} → ${to}`,
        `${trip.km} km`,
        t.minShort(trip.minutes),
        stats,
      ]
        .filter(Boolean)
        .join(", ")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.s1,
      }}
    >
      <Text variant="caption" color="fg2" style={{ width: 48 }}>
        {when}
      </Text>
      <View style={{ alignItems: "center", gap: 2 }}>
        <View
          style={{ width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: c.fg2 }}
        />
        <View
          style={{
            width: 1,
            height: 12,
            borderLeftWidth: 1,
            borderStyle: "dotted",
            borderColor: c.fg2,
          }}
        />
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.acc }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="label" weight={400} color="fg2">
          {from}
        </Text>
        <Text variant="label" weight={600}>
          {to}
        </Text>
        {stats ? (
          <Text variant="caption" color="fg2" style={{ marginTop: 2 }}>
            {stats}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            backgroundColor: c.s1,
          }}
        >
          <Text variant="caption" weight={600}>{`${trip.km} km`}</Text>
        </View>
        <Text variant="caption" color="fg2">
          {t.minShort(trip.minutes)}
        </Text>
      </View>
    </View>
  );
}

export default function Trips() {
  const bottomPad = useBottomPad();
  const { c } = useTheme();
  const t = useT();
  const lang = useLang();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["trips"],
    queryFn: () => carService.trips(),
  });

  const body = (() => {
    if (isPending)
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={c.fg2} />
        </View>
      );
    if (isError || !data)
      return (
        <EmptyState
          icon={<PathIcon size={56} color={c.fg2} />}
          badge={<WarningIcon size={20} color={c.warn} />}
          badgeTone="warn"
          title={t.loadFailed}
          action={{ label: t.retry, onPress: () => refetch() }}
        />
      );
    if (data.trips.length === 0)
      return (
        <EmptyState
          icon={<PathIcon size={56} color={c.fg2} />}
          badge={<SparkleIcon size={20} color={c.acc} />}
          badgeTone="acc"
          title={t.noTrips}
        />
      );

    const today = new Date();
    const bars = weekBars(data.trips, today);
    const weekLabel = bars.map((b) => `${t.weekdays[b.weekday]} ${Math.round(b.km)} km`).join(", ");
    const sorted = [...data.trips].sort((a, b) => b.startedAt - a.startedAt);
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View
          accessible
          accessibilityLabel={weekLabel}
          style={{
            padding: 16,
            paddingBottom: 12,
            borderRadius: radius.card,
            backgroundColor: c.s1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              height: BAR_PT + 22,
            }}
          >
            {bars.map((b) => (
              <View
                key={`${b.weekday}-${b.today}`}
                style={{ flex: 1, alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    width: 22,
                    height: Math.max(4, b.height * BAR_PT),
                    borderRadius: 6,
                    backgroundColor: b.today ? c.acc : b.km ? c.line : c.s2,
                  }}
                />
                <Text
                  variant="caption"
                  weight={b.today ? 700 : 600}
                  color={b.today ? "fg" : "fg2"}
                  style={{ fontSize: 12, lineHeight: 14 }}
                >
                  {t.weekdays[b.weekday]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {data.driving ? (
          <View
            style={{
              padding: 16,
              borderRadius: radius.card,
              backgroundColor: c.s1,
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
            }}
          >
            <ScoreRing score={data.driving.score} delta={data.driving.scoreDelta} />
            <Behaviour d={data.driving} />
          </View>
        ) : null}

        <View style={{ marginTop: 4 }}>
          {sorted.map((trip, i) => (
            <TripRow key={trip.id} trip={trip} first={i === 0} />
          ))}
        </View>
      </ScrollView>
    );
  })();

  const totals = data?.trips.length ? tripTotals(data.trips, new Date()) : null;
  return (
    <Screen scroll>
      <PageHeader
        title={t.trips}
        right={
          totals ? (
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pill
                icon={<PathIcon size={14} color={c.fg2} />}
                text={String(totals.trips)}
                label={t.tripsLabel(totals.trips)}
              />
              <Pill
                icon={<RoadHorizonIcon size={14} color={c.fg2} />}
                text={`${totals.km.toLocaleString(lang === "vi" ? "vi-VN" : "en-US")} km`}
                label={t.weekKm(totals.km)}
              />
            </View>
          ) : null
        }
      />
      {body}
    </Screen>
  );
}
