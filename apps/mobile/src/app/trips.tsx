import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { LockKeyIcon, MapPinIcon, PathIcon, SparkleIcon, WarningIcon } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, type ScrollViewInstance, View } from "react-native";
import { fuelAverage, periodDays } from "../car/behaviour";
import { type PeriodKind, periodOf } from "../car/summary";
import { useLang, useT } from "../i18n";
import type { Trip } from "../services/car";
import { carService } from "../services/query";
import { tripCache, useSavedTrips } from "../services/trip-cache";
import {
  autoFaceId,
  faceIdUnlock,
  loadPlaces,
  openedTrip,
  usePinSession,
} from "../services/trip-pin";
import { lacking } from "../services/trip-places";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { DayRow } from "../ui/day-list";
import { EmptyState } from "../ui/empty-state";
import { PageHeader } from "../ui/page-header";
import { askPin } from "../ui/pin-sheet";
import { SolidPressable } from "../ui/press-glass";
import { Screen, useBottomPad } from "../ui/screen";
import { SummaryCard, usePeriodTitle } from "../ui/summary-card";
import { Text } from "../ui/text";
import { useToast } from "../ui/toast";
import { TripRowSkeleton } from "../ui/trip-row";
import { usePullRefresh } from "../ui/use-pull-refresh";

/** Days you closed, kept for the app session. */
const closedDays = new Set<number>();

export default function Trips() {
  const bottomPad = useBottomPad();
  const { c } = useTheme();
  const t = useT();
  const _lang = useLang();
  const [today] = useState(() => new Date());
  const [kind, setKind] = useState<PeriodKind>("week");
  const [period, setPeriod] = useState(() => periodOf("week", today));
  const [picked, setPicked] = useState<number | null>(null);
  const recent = useQuery({ queryKey: ["trips"], queryFn: () => carService.trips() });
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => carService.summary() });
  const qc = useQueryClient();
  // The list under the card: days of the shown period (Year: months). The newest starts open.
  const days = summary.data ? periodDays(summary.data, period) : [];
  const avg = summary.data ? fuelAverage(summary.data.day, today) : { kmPerL: null, trips: 0 };
  // Every day starts open; the ones you close stay closed for this app session.
  const [closed, setClosed] = useState(() => new Set(closedDays));
  const setDay = (date: number, isOpen: boolean) => {
    if (isOpen) closedDays.delete(date);
    else closedDays.add(date);
    setClosed(new Set(closedDays));
  };
  const scroll = useRef<ScrollViewInstance>(null);
  const listY = useRef(0);
  const rowY = useRef(new Map<number, number>());
  const periodTitle = usePeriodTitle(period, today);

  const saved = useSavedTrips();
  const pin = usePinSession();
  const toast = useToast();
  const listed = recent.data ?? [];
  const missing = lacking(listed, saved);

  // Face ID by itself, once per app session, only when listed trips lack places (HANDOFF).
  useEffect(() => {
    const trips = recent.data;
    if (!trips) return;
    autoFaceId(trips, t.pinFaceIdReason).then((r) => {
      if (r === "ok") void loadPlaces(lacking(trips, tripCache.all()));
      if (r === "changed") askPin({ changed: true }, () => afterPin.current());
    });
  }, [recent.data, t.pinFaceIdReason]);

  // After the PIN sheet: load places, then go on to the trip that asked for it (or say so).
  const unlocked = (next?: Trip) => {
    if (missing.length) void loadPlaces(missing);
    if (next) showTrip(next);
    else toast.show({ kind: "success", text: t.placesShown });
  };

  // The Face ID effect runs once per data load; it reads the latest handler through this ref.
  const afterPin = useRef(unlocked);
  afterPin.current = unlocked;

  const showTrip = (trip: Trip) => {
    openedTrip.set(trip);
    router.push(`/trip/${trip.id}`);
  };
  // Details always need this session's PIN or Face ID first.
  const openTrip = async (trip: Trip) => {
    const r = await faceIdUnlock(t.pinFaceIdReason);
    if (r !== "ok") return askPin({ changed: r === "changed" }, () => unlocked(trip));
    if (missing.length) void loadPlaces(missing);
    showTrip(trip);
  };

  // Refetches keep the shown values in place (no skeleton over loaded content).
  const pull = usePullRefresh(async () => {
    const res = await Promise.all([
      recent.refetch(),
      summary.refetch(),
      qc.refetchQueries({ queryKey: ["dayTrips"], type: "active" }).then(() => null),
    ]);
    // Values stay; say so instead of dropping them.
    if (res.some((r) => r?.isError)) toast.show({ kind: "error", text: t.refreshFailed });
    if (pin.unlocked) await loadPlaces(lacking(listed, tripCache.all()));
  });

  const body = (() => {
    if (recent.isError && summary.isError)
      return (
        <EmptyState
          icon={<PathIcon size={56} color={c.fg2} />}
          badge={<WarningIcon size={20} color={c.warn} />}
          badgeTone="warn"
          title={t.loadFailed}
          action={{
            label: t.retry,
            onPress: () => {
              recent.refetch();
              summary.refetch();
            },
          }}
        />
      );
    const loaded = !recent.isPending && !summary.isPending;
    if (loaded && !recent.data?.length && !summary.data?.day.length)
      return (
        <EmptyState
          icon={<PathIcon size={56} color={c.fg2} />}
          badge={<SparkleIcon size={20} color={c.acc} />}
          badgeTone="acc"
          title={t.noTrips}
        />
      );

    const header =
      period.kind === "year"
        ? `${periodTitle} · ${t.byMonth}`
        : `${periodTitle} · ${t.daysCount(days.length)}`;
    return (
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pull.refreshing}
            onRefresh={pull.onRefresh}
            tintColor={c.fg2}
          />
        }
      >
        {summary.data || summary.isPending ? (
          <SummaryCard
            summary={summary.data}
            kind={kind}
            period={period}
            picked={picked}
            today={today}
            onKind={(k) => {
              setKind(k);
              setPeriod(periodOf(k, today));
              setPicked(null);
            }}
            onPeriod={(p) => {
              setPeriod(p);
              setPicked(null);
            }}
            onPick={(start) => {
              setPicked(start);
              if (start === null) return;
              // A bar opens that day (others stay as they are) and brings it under the card.
              setDay(start, true);
              setTimeout(() => {
                const y = rowY.current.get(start);
                if (y !== undefined) scroll.current?.scrollTo({ y: listY.current + y - 120 });
              }, 260);
            }}
          />
        ) : null}

        {missing.length && !pin.unlocked ? (
          <View style={{ padding: 16, gap: 14, borderRadius: radius.card, backgroundColor: c.s1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${c.acc}24`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPinIcon size={20} color={c.acc} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight={600}>
                  {Object.keys(saved).length ? t.pinBannerNew(missing.length) : t.pinBannerHidden}
                </Text>
                <Text variant="caption" color="fg2" style={{ fontSize: 14 }}>
                  {pin.faceIdFailed
                    ? t.pinFaceIdFailed
                    : Object.keys(saved).length
                      ? t.pinBannerNewSub
                      : t.pinBannerHiddenSub}
                </Text>
              </View>
            </View>
            <SolidPressable
              accessibilityRole="button"
              onPress={() => askPin({}, () => unlocked())}
              style={{
                height: 48,
                borderRadius: 24,
                backgroundColor: c.s2,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <LockKeyIcon size={18} color={c.fg} />
              <Text weight={600}>{t.showPlaces}</Text>
            </SolidPressable>
          </View>
        ) : null}

        <Text weight={600} accessibilityRole="header" style={{ marginTop: 8, height: 28 }}>
          {header}
        </Text>
        <View onLayout={(e) => (listY.current = e.nativeEvent.layout.y)}>
          {!summary.data
            ? [0, 1, 2, 3].map((i) => <TripRowSkeleton key={i} first={i === 0} />)
            : days.map((row, i) => (
                <DayRow
                  key={row.date}
                  row={row}
                  month={period.kind === "year"}
                  open={!closed.has(row.date)}
                  first={i === 0}
                  saved={saved}
                  avg={avg}
                  onLayout={(y) => rowY.current.set(row.date, y)}
                  onToggle={() => {
                    if (period.kind !== "year") return setDay(row.date, closed.has(row.date));
                    // A month in Year: the card switches to that month.
                    setKind("month");
                    setPeriod(periodOf("month", new Date(row.date)));
                    setPicked(null);
                  }}
                  onTrip={openTrip}
                />
              ))}
        </View>
      </ScrollView>
    );
  })();

  return (
    <Screen scroll>
      <PageHeader title={t.trips} />
      {body}
    </Screen>
  );
}
