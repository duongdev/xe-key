import { router, useLocalSearchParams } from "expo-router";
import {
  CrosshairIcon,
  GasPumpIcon,
  GaugeIcon,
  MoonIcon,
  RoadHorizonIcon,
  SunIcon,
  TimerIcon,
  XIcon,
} from "phosphor-react-native";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLang, useT } from "../../i18n";
import { useFormatTime } from "../../i18n/format";
import { NoPin } from "../../services/car";
import { carService } from "../../services/query";
import { tripCache, useSavedTrips } from "../../services/trip-cache";
import { openedTrip } from "../../services/trip-pin";
import { radius, space, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Shimmer } from "../../ui/appear";
import { GlassButton } from "../../ui/glass";
import { Text } from "../../ui/text";

const DAY = 86_400_000;
const MAP_H = 380;

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  const { c } = useTheme();
  return (
    // Padding on an inner view: Yoga adds outer padding on top of flex, so rows of 2 grew wider.
    <View style={{ flex: 1, minWidth: 0 }}>
      <View
        accessible
        accessibilityLabel={`${label}: ${value}`}
        style={{ padding: 12, gap: 6, borderRadius: radius.chip, backgroundColor: c.s2 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          {icon}
          <Text variant="caption" color="fg2" numberOfLines={1} style={{ fontSize: 13 }}>
            {label}
          </Text>
        </View>
        {/* Number big, unit small (HANDOFF › Stats): "8.2 km" → 8.2 + km. */}
        <Text numberOfLines={1} adjustsFontSizeToFit>
          <Text weight={600} style={{ fontSize: 18 }}>
            {value.split(" ")[0]}
          </Text>
          <Text
            color="fg2"
            style={{ fontSize: 12 }}
          >{` ${value.split(" ").slice(1).join(" ")}`}</Text>
        </Text>
      </View>
    </View>
  );
}

/**
 * Trip detail (HANDOFF › Trip detail, board Trip-detail): route map on top, a solid sheet with the
 * places, stats Honda sends and the day/night split. Opened only after this session's PIN or Face
 * ID; the route comes from the cache once loaded (past trips never change).
 */
export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, scheme } = useTheme();
  const t = useT();
  const lang = useLang();
  const time = useFormatTime();
  const insets = useSafeAreaInsets();
  const map = useRef<MapView>(null);
  const trip = openedTrip.get(id);
  const saved = useSavedTrips()[id];
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!trip) router.back();
  }, [trip]);

  // A page sheet has no pull (it would fight drag-to-close): re-read once on open when the saved
  // copy is incomplete, and only with this session's token.
  const complete = !!saved && saved.route.length > 1 && saved.from !== null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per opened trip
  useEffect(() => {
    if (complete || !id) return;
    carService
      .tripDetail(id)
      .then((d) => tripCache.put({ [id]: d }))
      .catch((e: unknown) => {
        if (!(e instanceof NoPin)) console.warn("trip detail failed", e);
        setFailed(true);
      });
  }, [id]);

  const route = saved?.route ?? [];
  const coords = route.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const start = coords[0];
  const end = coords[coords.length - 1];
  const showRoute = (animated: boolean) =>
    coords.length > 1 &&
    map.current?.fitToCoordinates(coords, {
      edgePadding: { top: 64, right: 48, bottom: 48, left: 48 },
      animated,
    });

  // Opened from a cold link with no row behind it: nothing to show.
  if (!trip) return null;
  const n = (v: number, digits = 0) =>
    v.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(trip.startedAt);
  const day =
    trip.startedAt >= today
      ? t.today
      : trip.startedAt >= today - DAY
        ? t.yesterday
        : `${t.weekdaysShort[d.getDay()] ?? ""} ${d.getDate()}/${d.getMonth() + 1}`;
  const range = trip.endedAt
    ? `${time(trip.startedAt)}–${time(trip.endedAt)}`
    : time(trip.startedAt);
  const from = saved?.from ?? trip.from;
  const to = saved?.to ?? trip.to;
  // Tiles Honda doesn't send are dropped (it sends no idle time).
  const tiles = [
    { key: "km", icon: RoadHorizonIcon, label: t.statDistance, value: `${n(trip.km, 1)} km` },
    { key: "time", icon: TimerIcon, label: t.statTime, value: t.minShort(trip.minutes) },
    trip.kmPerL != null
      ? { key: "fuel", icon: GasPumpIcon, label: t.statFuel, value: `${n(trip.kmPerL, 1)} km/l` }
      : null,
    trip.avgKmh != null
      ? { key: "avg", icon: GaugeIcon, label: t.statAvgSpeed, value: `${n(trip.avgKmh)} km/h` }
      : null,
    trip.maxKmh != null
      ? { key: "max", icon: GaugeIcon, label: t.statMaxSpeed, value: `${n(trip.maxKmh)} km/h` }
      : null,
  ].filter((x) => x !== null);
  const rows = [tiles.slice(0, 3), tiles.slice(3)].filter((r) => r.length);
  const daySec = trip.daySeconds ?? null;
  const nightSec = trip.nightSeconds ?? null;
  const lit = (daySec ?? 0) + (nightSec ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.s1 }}>
      <View style={{ height: MAP_H }}>
        {coords.length ? (
          <MapView
            ref={map}
            style={StyleSheet.absoluteFill}
            userInterfaceStyle={scheme}
            showsPointsOfInterests={false}
            pitchEnabled={false}
            accessibilityLabel={[from, to].filter(Boolean).join(" → ")}
            onMapReady={() => showRoute(false)}
          >
            <Polyline coordinates={coords} strokeColor={c.bg} strokeWidth={9} />
            <Polyline coordinates={coords} strokeColor={c.acc} strokeWidth={5} />
            {start ? (
              <Marker coordinate={start} anchor={{ x: 0.5, y: 0.5 }}>
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 3,
                    borderColor: c.fg,
                    backgroundColor: c.bg,
                  }}
                />
              </Marker>
            ) : null}
            {end ? (
              <Marker coordinate={end} anchor={{ x: 0.5, y: 0.5 }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 3,
                    borderColor: c.bg,
                    backgroundColor: c.acc,
                  }}
                />
              </Marker>
            ) : null}
          </MapView>
        ) : (
          <Shimmer style={{ flex: 1, backgroundColor: c.s1 }} />
        )}
        {/* Page sheet: drawn grabber, ✕ to close, fit-route on the map (HANDOFF › Trip detail). */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 8,
            alignSelf: "center",
            width: 36,
            height: 5,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
        <GlassButton
          label={t.closeSheet}
          symbol="xmark"
          onPress={() => router.back()}
          style={{ position: "absolute", top: 14, right: 14 }}
        >
          <XIcon size={18} color={c.fg} />
        </GlassButton>
        {coords.length > 1 ? (
          <GlassButton
            label={t.fitRoute}
            symbol="scope"
            onPress={() => showRoute(true)}
            style={{ position: "absolute", bottom: 14, right: 14 }}
          >
            <CrosshairIcon size={18} color={c.fg} />
          </GlassButton>
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: space.gutter,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="caption" color="fg2" style={{ fontSize: 14 }}>
          {`${day} · ${range}`}
        </Text>
        <View style={{ gap: 6 }}>
          {[
            { key: "from", text: from, end: false },
            { key: "to", text: to, end: true },
          ].map(({ key, text, end }) => (
            <View key={key} style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ width: 10, height: 28, justifyContent: "center" }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    borderWidth: end ? 0 : 2,
                    borderColor: c.fg,
                    backgroundColor: end ? c.acc : "transparent",
                  }}
                />
              </View>
              {/* Dotted line from the start dot down to the end dot, whatever the name's lines. */}
              {end ? null : (
                <View
                  style={{
                    position: "absolute",
                    left: 4.5,
                    top: 20,
                    bottom: -15,
                    borderLeftWidth: 1,
                    borderStyle: "dotted",
                    borderColor: c.fg2,
                  }}
                />
              )}
              {text ? (
                <Text
                  numberOfLines={2}
                  style={{ ...textStyle("stat"), fontSize: 22, lineHeight: 28, flex: 1 }}
                >
                  {text}
                </Text>
              ) : failed ? (
                <Text color="fg2" style={{ lineHeight: 28 }}>
                  {end ? time(trip.endedAt ?? trip.startedAt) : time(trip.startedAt)}
                </Text>
              ) : (
                <View style={{ height: 28, flex: 1, justifyContent: "center" }}>
                  <Shimmer
                    style={{ height: 18, width: "55%", borderRadius: 6, backgroundColor: c.s2 }}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
        {rows.map((row) => (
          <View key={row.map((x) => x.key).join()} style={{ flexDirection: "row", gap: 8 }}>
            {row.map(({ key, icon: Icon, label, value }) => (
              <Tile key={key} icon={<Icon size={14} color={c.fg2} />} label={label} value={value} />
            ))}
            {row.length < 3
              ? Array.from({ length: 3 - row.length }, (_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: spacer cells keep tile widths
                  <View key={i} style={{ flex: 1, minWidth: 0 }} />
                ))
              : null}
          </View>
        ))}
        {lit ? (
          <View style={{ padding: 12, gap: 8, borderRadius: radius.chip, backgroundColor: c.s2 }}>
            <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden" }}>
              <View style={{ flex: daySec ?? 0, backgroundColor: c.warn }} />
              <View style={{ flex: nightSec ?? 0, backgroundColor: c.night }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <SunIcon size={14} color={c.fg2} />
                <Text variant="caption" color="fg2">
                  {`${t.tripDay} ${t.minShort(Math.round((daySec ?? 0) / 60))}`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text variant="caption" color="fg2">
                  {`${t.tripNight} ${t.minShort(Math.round((nightSec ?? 0) / 60))}`}
                </Text>
                <MoonIcon size={14} color={c.fg2} />
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
