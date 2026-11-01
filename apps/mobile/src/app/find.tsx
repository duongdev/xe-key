import { router } from "expo-router";
import {
  ArrowsClockwiseIcon,
  CaretLeftIcon,
  CarProfileIcon,
  ClockIcon,
  CrosshairIcon,
  MapPinIcon,
  NavigationArrowIcon,
  QuestionIcon,
} from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { inFlight } from "../car/command";
import { freshness } from "../car/freshness";
import { useCommand } from "../car/use-command";
import { useT } from "../i18n";
import { useCar } from "../services/query";
import { useDistance } from "../services/use-distance";
import { iconSize, radius, space, textStyle } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { EmptyState } from "../ui/empty-state";
import { PageHeader } from "../ui/page-header";
import { Screen } from "../ui/screen";
import { Text } from "../ui/text";
import { useNow } from "../ui/use-now";

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
  const locating = inFlight(cmd);
  const loc = car?.location ?? null;
  const km = useDistance(loc, true);
  const name = loc?.name ?? t.carSpot;
  const map = useRef<MapView>(null);
  // The map runs under the sheet (no black corners); padding keeps the car and Apple's legal label above it.
  const [sheetH, setSheetH] = useState(0);
  useEffect(() => {
    if (loc) map.current?.animateToRegion(regionFor(loc), 400);
  }, [loc]);

  if (car && !loc) {
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
          userInterfaceStyle={scheme}
          showsPointsOfInterests={false}
          pitchEnabled={false}
          ref={map}
          onMapReady={() => map.current?.animateToRegion(regionFor(loc), 0)}
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
                  borderWidth: 4,
                  borderColor: c.bg,
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.backToCar}
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + 6,
          left: space.gutter - 4,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${c.bg}cc`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CaretLeftIcon size={iconSize.md} color={c.fg} />
      </Pressable>

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
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            disabled={locating}
            onPress={() => send("find")}
            style={({ pressed }) => ({
              flex: 1,
              height: 60,
              borderRadius: 30,
              backgroundColor: c.acc,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {locating ? (
              <ActivityIndicator color={c.onacc} />
            ) : (
              <ArrowsClockwiseIcon size={20} color={c.onacc} />
            )}
            <Text weight={600} color="onacc">
              {locating ? t.locating : t.update}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!loc}
            onPress={() => loc && Linking.openURL(`maps://?daddr=${loc.lat},${loc.lng}&dirflg=w`)}
            style={({ pressed }) => ({
              flex: 1,
              height: 60,
              borderRadius: 30,
              backgroundColor: c.s2,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <NavigationArrowIcon size={20} color={c.fg} />
            <Text weight={600}>{t.go}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
