import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  LockKeyIcon,
  MapPinIcon,
  PathIcon,
  SparkleIcon,
  WarningIcon,
  XIcon,
} from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
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
import { lacking, withPlaces } from "../services/trip-places";
import { radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { EmptyState } from "../ui/empty-state";
import { PageHeader } from "../ui/page-header";
import { askPin } from "../ui/pin-sheet";
import { SolidPressable } from "../ui/press-glass";
import { Screen, useBottomPad } from "../ui/screen";
import { SummaryCard } from "../ui/summary-card";
import { Text } from "../ui/text";
import { useToast } from "../ui/toast";
import { TripRow, TripRowSkeleton } from "../ui/trip-row";
import { usePullRefresh } from "../ui/use-pull-refresh";

export default function Trips() {
  const bottomPad = useBottomPad();
  const { c } = useTheme();
  const t = useT();
  const lang = useLang();
  const [today] = useState(() => new Date());
  const [kind, setKind] = useState<PeriodKind>("week");
  const [period, setPeriod] = useState(() => periodOf("week", today));
  const [picked, setPicked] = useState<number | null>(null);
  const recent = useQuery({ queryKey: ["trips"], queryFn: () => carService.trips() });
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => carService.summary() });
  const day = useQuery({
    queryKey: ["dayTrips", picked],
    queryFn: () => carService.dayTrips(picked ?? 0),
    enabled: picked !== null,
    placeholderData: keepPreviousData,
  });

  const saved = useSavedTrips();
  const pin = usePinSession();
  const toast = useToast();
  const listed = picked === null ? (recent.data ?? []) : (day.data ?? []);
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
      picked !== null ? day.refetch() : null,
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

    const list = withPlaces(listed, saved);
    const pickedDate = picked === null ? null : new Date(picked);
    const header = pickedDate
      ? `${t.weekdaysShort[pickedDate.getDay()] ?? ""} ${pickedDate.toLocaleDateString(
          lang === "vi" ? "vi-VN" : "en-GB",
          { day: "numeric", month: "short" },
        )}${day.data && !day.isPlaceholderData ? ` · ${t.tripCount(day.data.length)}` : ""}`
      : t.recentTrips;
    return (
      <ScrollView
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
            onPick={setPicked}
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

        {/* Always here, so a bar tap swaps its text instead of pushing the rows down. */}
        <View
          style={{
            height: 36,
            marginTop: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text weight={600} accessibilityRole="header">
            {header}
          </Text>
          {picked !== null ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setPicked(null)}
              style={{
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 16,
                backgroundColor: c.s1,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <XIcon size={12} color={c.fg2} />
              <Text variant="caption" weight={600} color="fg2">
                {t.showRecent}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={{ opacity: picked !== null && day.isFetching && day.data ? 0.5 : 1 }}>
          {(picked === null ? recent.isPending : !day.data)
            ? [0, 1, 2, 3].map((i) => <TripRowSkeleton key={i} first={i === 0} />)
            : list.map((trip, i) => (
                <TripRow key={trip.id} trip={trip} first={i === 0} onPress={() => openTrip(trip)} />
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
