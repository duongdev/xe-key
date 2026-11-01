import { router } from "expo-router";
import {
  CaretLeftIcon,
  CaretRightIcon,
  DropIcon,
  EyeIcon,
  HandSwipeRightIcon,
} from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Car } from "../../car/car";
import { BODIES, type Body } from "../../car/geometry";
import { PAINTS } from "../../car/paints";
import { useT } from "../../i18n";
import { next } from "../../onboarding/flow";
import { type CarLook, usePrefs } from "../../prefs";
import { haptics } from "../../theme/haptics";
import { pop, useTiming } from "../../theme/motion";
import { iconSize, radius, space, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { GlassButton } from "../../ui/glass";
import { Glow } from "../../ui/glow";
import { Screen } from "../../ui/screen";
import { ScrubRail } from "../../ui/scrub-rail";
import { SegmentedSlider } from "../../ui/segmented-slider";
import { Text } from "../../ui/text";
import { TextButton } from "../../ui/text-button";

const ORDER: Body[] = ["crossover", "city", "sedan", "suv", "mpv"];
const LOOKS: CarLook["look"][] = ["shaded", "line", "photo"];

function Swatch({ hex, on, big }: { hex: string; on: boolean; big: boolean }) {
  const { c } = useTheme();
  const timing = useTiming();
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  useEffect(() => {
    s.value = withTiming(on ? (big ? 1.3 : 1.15) : 1, timing(180, pop));
  }, [on, big, s, timing]);
  return (
    <Animated.View
      style={[
        {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: hex,
          borderWidth: on ? 2 : 1,
          borderColor: on ? c.acc : "rgba(255,255,255,.18)",
        },
        style,
      ]}
    />
  );
}

export default function Style() {
  const { c, scheme } = useTheme();
  const t = useT();
  const { width } = useWindowDimensions();
  const { prefs, update } = usePrefs();
  const carousel = useRef<ScrollViewInstance>(null);
  const [bodyIndex, setBodyIndex] = useState(Math.max(0, ORDER.indexOf(prefs.car.body)));
  const [look, setLook] = useState(Math.max(0, LOOKS.indexOf(prefs.car.look)));
  const [paint, setPaint] = useState(
    Math.max(
      0,
      PAINTS.findIndex((p) => p.hex === prefs.car.paint),
    ),
  );
  const [scrubbing, setScrubbing] = useState(false);

  const body = ORDER[bodyIndex] ?? "crossover";
  const hex = PAINTS[paint]?.hex ?? PAINTS[0].hex;
  const done = (save: boolean) => {
    if (save) update({ car: { body, look: LOOKS[look] ?? "shaded", paint: hex } });
    router.push(`/onboarding/${next("style")}`);
  };
  // Programmatic scrolls skip onMomentumScrollEnd, so update the index here.
  const goTo = (i: number) => {
    if (i === bodyIndex) return;
    // haptics: body carousel step; no shared carousel (HANDOFF › Haptics).
    haptics.selection();
    setBodyIndex(i);
    carousel.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <Screen>
      <Glow color={c.fg} opacity={0.09} style={{ left: -80, right: -80, top: 120, height: 300 }} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <GlassButton
          label={t.back}
          symbol="chevron.left"
          onPress={() => router.back()}
          style={{ marginLeft: -4 }}
        >
          <CaretLeftIcon size={iconSize.md} color={c.fg} />
        </GlassButton>
        <TextButton label={t.skip} onPress={() => done(false)} />
      </View>
      <Text style={{ ...textStyle("large"), fontSize: 30, lineHeight: 36, marginTop: 8 }}>
        {t.styleTitle}
      </Text>

      {LOOKS[look] === "photo" ? (
        <View
          style={{
            marginTop: 14,
            height: 170,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: c.line,
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Text variant="label" weight={600}>
            {t.photoPlaceholder}
          </Text>
          <Text variant="caption" color="fg2">
            {t.photoSource}
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={carousel}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          accessibilityLabel={t.bodyShape}
          contentOffset={{ x: bodyIndex * width, y: 0 }}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            // haptics: body carousel step (see goTo).
            if (i !== bodyIndex) haptics.selection();
            setBodyIndex(i);
          }}
          style={{ marginTop: 14, marginHorizontal: -space.gutter, height: 170, flexGrow: 0 }}
        >
          {ORDER.map((b, i) => (
            <View
              key={b}
              style={{
                width,
                height: 170,
                paddingHorizontal: 8,
                justifyContent: "center",
                opacity: i === bodyIndex ? 1 : 0.35,
              }}
            >
              <Car
                body={b}
                look={LOOKS[look] === "line" ? "line" : "shaded"}
                paint={hex}
                ground={scheme}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: 4,
        }}
      >
        <Pressable
          accessibilityLabel={t.back}
          hitSlop={12}
          onPress={() => goTo(Math.max(0, bodyIndex - 1))}
        >
          <CaretLeftIcon size={14} color={c.fg2} />
        </Pressable>
        <Text
          weight={600}
          accessibilityLiveRegion="polite"
          style={{ minWidth: 64, textAlign: "center" }}
        >
          {BODIES[body].name}
        </Text>
        <Pressable
          accessibilityLabel={t.next}
          hitSlop={12}
          onPress={() => goTo(Math.min(ORDER.length - 1, bodyIndex + 1))}
        >
          <CaretRightIcon size={14} color={c.fg2} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 }}>
        {ORDER.map((b, i) => (
          <View
            key={b}
            style={{
              height: 6,
              borderRadius: 3,
              width: i === bodyIndex ? 20 : 6,
              backgroundColor: i === bodyIndex ? c.fg : c.s2,
            }}
          />
        ))}
      </View>
      <View
        style={{
          marginTop: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <HandSwipeRightIcon size={14} color={c.fg2} />
        <Text variant="caption" color="fg2" style={{ fontSize: 12 }}>
          {t.swipe}
        </Text>
      </View>

      <View style={{ gap: 8, marginTop: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <EyeIcon size={14} color={c.fg2} />
          <Text variant="caption" color="fg2">
            {t.style}
          </Text>
        </View>
        <SegmentedSlider options={t.looks} value={look} onChange={setLook} label={t.style} />
      </View>

      <View style={{ gap: 10, marginTop: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <DropIcon size={14} color={c.fg2} />
          <Text variant="caption" color="fg2">
            {PAINTS[paint]?.name}
          </Text>
        </View>
        <ScrubRail
          count={PAINTS.length}
          value={paint}
          onChange={setPaint}
          onScrub={setScrubbing}
          label={t.paint}
          valueText={PAINTS[paint]?.name ?? ""}
          style={{ height: 56, borderRadius: 28, backgroundColor: c.s1 }}
        >
          {() => (
            <View style={{ flex: 1, flexDirection: "row" }}>
              {PAINTS.map((p, i) => (
                <View
                  key={p.hex}
                  style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                >
                  <Swatch hex={p.hex} on={i === paint} big={scrubbing} />
                </View>
              ))}
            </View>
          )}
        </ScrubRail>
      </View>

      <View style={{ flex: 1 }} />
      <Button height={64} tone="neutral" label={t.looksRight} onPress={() => done(true)} />
    </Screen>
  );
}
