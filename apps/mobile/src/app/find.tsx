import { router } from "expo-router";
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
  QuestionIcon,
} from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type CommandKind, inFlight, MAX_RETRIES } from "../car/command";
import { freshness } from "../car/freshness";
import { useCommand } from "../car/use-command";
import { useT } from "../i18n";
import { useCar } from "../services/query";
import { useDistance, usePhonePosition } from "../services/use-distance";
import { colors, iconSize, radius, space, textStyle } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { EmptyState } from "../ui/empty-state";
import { GlassButton } from "../ui/glass";
import { HoldButton } from "../ui/hold-button";
import { PageHeader } from "../ui/page-header";
import { SolidPressable } from "../ui/press-glass";
import { Screen } from "../ui/screen";
import { Text } from "../ui/text";
import { useNow } from "../ui/use-now";

/** Icons on map glass: always the dark-theme foreground (the glass is dark over satellite). */
const MAP_FG = colors("dark").fg;

const SPAN = 0.012;
/** Apple adds its own margin above the padding; tuck the label so its bottom gap equals its left inset. */
const LEGAL_TUCK = 33;
const regionFor = (l: { lat: number; lng: number }) => ({
  latitude: l.lat,
  longitude: l.lng,
  latitudeDelta: SPAN,
  longitudeDelta: SPAN,
});

export default function Find() {
  const { c, scheme } = useTheme();
  const t = useT();
  const now = useNow();
  const insets = useSafeAreaInsets();
  const { data: car } = useCar();
  const { state: cmd, send } = useCommand();
  const busy = inFlight(cmd) ? cmd : null;
  const locating = busy?.kind === "find";
  const [holding, setHolding] = useState(false);
  const loc = car?.location ?? null;
  const km = useDistance(loc, true);
  const name = loc?.name ?? t.carSpot;
  const map = useRef<MapView>(null);
  // The map runs under the sheet (no black corners); padding keeps the car and Apple's legal label above it.
  const [sheetH, setSheetH] = useState(0);
  const phone = usePhonePosition(loc, true);
  const me = phone ? { latitude: phone.lat, longitude: phone.lng } : null;
  // Frame you and the car together once your position is known (Find.png: both in view, no line between).
  const framed = useRef(false);
  const [ready, setReady] = useState(false);
  const edgeBack = usePanGesture({
    runOnJS: true,
    activeOffsetX: 10,
    onDeactivate: (e) => {
      if (e.translationX > 60 || e.velocityX > 500) router.back();
    },
  });
  const frame = () => {
    if (!loc) return;
    if (!me) return map.current?.animateToRegion(regionFor(loc), 400);
    // mapPadding already keeps the sheet and status bar clear; this is breathing room only.
    map.current?.fitToCoordinates([me, { latitude: loc.lat, longitude: loc.lng }], {
      edgePadding: { top: 60, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: frame reads the same loc and me
  useEffect(() => {
    if (!ready || !loc || !me || framed.current) return;
    framed.current = true;
    frame();
  }, [ready, loc, me]);
  useEffect(() => {
    if (loc && !framed.current) map.current?.animateToRegion(regionFor(loc), 400);
  }, [loc]);

  // undefined = not fetched yet (never saved to disk): show the map area empty, not "no GPS".
  if (car && car.location === null) {
    return (
      <Screen>
        <PageHeader title={t.findCar} />
        <EmptyState
          icon={<MapPinIcon size={56} color={c.fg2} />}
          badge={<QuestionIcon size={20} color={c.warn} />}
          badgeTone="warn"
          title={t.noGps}
          action={locating ? undefined : { label: t.askAgain, onPress: () => send("find") }}
        />
      </Screen>
    );
  }

  // A running horn / lights command turns its own button into a spinner (Find-horn.png).
  const pending = (kind: CommandKind) => {
    if (busy?.kind !== kind) return null;
    const retrying = busy.status === "retrying";
    const text = retrying
      ? t.retryingCount(busy.attempt, MAX_RETRIES)
      : kind === "horn"
        ? t.honking
        : t.flashing;
    return (
      <View
        accessible
        accessibilityLabel={text}
        style={{
          flex: 1,
          height: 52,
          borderRadius: 26,
          backgroundColor: c.s2,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <ActivityIndicator color={retrying ? c.warn : c.fg2} />
        <Text weight={600} color={retrying ? "warn" : "fg"}>
          {text}
        </Text>
      </View>
    );
  };

  const age = loc ? freshness(loc.at, now) : null;
  const ageText =
    !age || age.unit === "live"
      ? t.live
      : age.unit === "m"
        ? t.minShort(age.n)
        : age.unit === "h"
          ? t.hShort(age.n)
          : t.age(age.n, age.unit);
  const stats = loc
    ? [
        km !== null && { icon: NavigationArrowIcon, value: `${km} km`, label: t.distanceFromYou },
        { icon: ClockIcon, value: ageText, label: t.sinceUpdate },
        loc.accuracyM !== null && {
          icon: CrosshairIcon,
          value: `±${loc.accuracyM} m`,
          label: t.accuracy,
        },
      ].filter((s) => s !== false)
    : [];
  const tile = {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: c.s2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {loc ? (
        <MapView
          accessibilityLabel={km !== null ? t.mapLabel(name, km) : name}
          style={StyleSheet.absoluteFill}
          mapPadding={{
            top: insets.top,
            right: 0,
            bottom: Math.max(0, sheetH - LEGAL_TUCK),
            left: 0,
          }}
          // Satellite with road labels: car parks, rooftops and gates show (HANDOFF › Find).
          mapType="hybrid"
          userInterfaceStyle={scheme}
          showsPointsOfInterests={false}
          // Your own position; shows once location is allowed (asked on this screen).
          showsUserLocation
          showsMyLocationButton={false}
          pitchEnabled={false}
          ref={map}
          onMapReady={() => {
            map.current?.animateToRegion(regionFor(loc), 0);
            setReady(true);
          }}
          initialRegion={regionFor(loc)}
        >
          <Marker
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: `${c.acc}29`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: c.acc,
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CarProfileIcon size={20} color={c.onacc} />
              </View>
            </View>
          </Marker>
        </MapView>
      ) : null}
      <View style={{ flex: 1 }} pointerEvents="none" />
      {/* MapKit's pan swallows the iOS edge swipe, so the left edge gets its own swipe-back. */}
      <GestureDetector gesture={edgeBack}>
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 24 }} />
      </GestureDetector>

      {/* Float over the map: Liquid Glass on iOS 26+. Icons stay fg to read on any map colour. */}
      <GlassButton
        map
        label={t.backToCar}
        symbol="chevron.left"
        onPress={() => router.back()}
        style={{ position: "absolute", top: insets.top + 6, left: space.gutter - 4 }}
      >
        <CaretLeftIcon size={iconSize.md} color={MAP_FG} />
      </GlassButton>
      {loc && sheetH ? (
        <GlassButton
          map
          label={t.recenter}
          symbol="location"
          onPress={() => {
            frame();
          }}
          style={{ position: "absolute", bottom: sheetH + 12, right: space.gutter - 4 }}
        >
          <NavigationArrowIcon size={iconSize.md} color={MAP_FG} />
        </GlassButton>
      ) : null}

      <View
        onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
        style={{
          backgroundColor: c.s1,
          borderTopLeftRadius: radius.cardLg,
          borderTopRightRadius: radius.cardLg,
          padding: space.gutter,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
          <View
            style={{
              // Centred on the first line of the name (line height 28): 14 − 44 / 2.
              marginTop: -8,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.s2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MapPinIcon size={iconSize.md} color={c.acc} />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ ...textStyle("stat"), fontSize: 22, lineHeight: 28 }}>
              {name}
            </Text>
            <Text variant="label" weight={400} color="fg2" numberOfLines={1}>
              {/* A lone stat tile looks empty: with only the age known, it joins this line. */}
              {[loc?.area, stats.length === 1 ? ageText : null].filter(Boolean).join(" · ")}
            </Text>
          </View>
        </View>
        {stats.length > 1 ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {stats.map(({ icon: Icon, value, label }) => (
              <View key={label} accessible accessibilityLabel={`${label}: ${value}`} style={tile}>
                <Icon size={16} color={c.fg2} />
                <Text variant="label" weight={600}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {/* Horn and lights (HANDOFF › Find): a tap is quiet, the horn is loud so it needs a hold. */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {pending("lights") ?? (
            <SolidPressable
              accessibilityRole="button"
              disabled={!!busy}
              onPress={() => send("lights")}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 26,
                backgroundColor: c.s2,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <HeadlightsIcon size={18} color={c.fg} />
              <Text weight={600}>{t.flashLights}</Text>
            </SolidPressable>
          )}
          {pending("horn") ?? (
            <HoldButton
              mode="hold"
              height={52}
              bg="s2"
              disabled={!!busy}
              label={holding ? t.keepHolding : t.holdToHonk}
              accessibilityLabel={t.holdToHonk}
              icon={<BellRingingIcon size={18} color={c.fg} />}
              onHoldChange={setHolding}
              onAction={() => send("horn")}
            />
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <SolidPressable
            accessibilityRole="button"
            disabled={!!busy}
            onPress={() => {
              send("find");
            }}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 30,
              backgroundColor: c.acc,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {locating ? (
              <ActivityIndicator color={c.onacc} />
            ) : (
              <ArrowsClockwiseIcon size={20} color={c.onacc} />
            )}
            <Text weight={600} color="onacc">
              {locating ? t.locating : t.update}
            </Text>
          </SolidPressable>
          <SolidPressable
            accessibilityRole="button"
            disabled={!loc}
            onPress={() => {
              if (!loc) return;
              Linking.openURL(`maps://?daddr=${loc.lat},${loc.lng}&dirflg=w`);
            }}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 30,
              backgroundColor: c.s2,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <NavigationArrowIcon size={20} color={c.fg} />
            <Text weight={600}>{t.go}</Text>
          </SolidPressable>
        </View>
      </View>
    </View>
  );
}
