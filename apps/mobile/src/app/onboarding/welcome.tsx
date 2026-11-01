import { router } from "expo-router";
import {
  BellIcon,
  ChatTextIcon,
  DeviceMobileIcon,
  LockIcon,
  MapPinIcon,
  SnowflakeIcon,
  ThermometerSimpleIcon,
  TimerIcon,
} from "phosphor-react-native";
import { type ReactNode, useRef, useState } from "react";
import { ScrollView, type ScrollViewInstance, useWindowDimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Car } from "../../car/car";
import { useT } from "../../i18n";
import { next } from "../../onboarding/flow";
import { haptics } from "../../theme/haptics";
import { iconSize, radius, space, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { Chip } from "../../ui/chip";
import { Glow } from "../../ui/glow";
import { setLaunchTarget } from "../../ui/launch-target";
import { LogoTile } from "../../ui/logo";
import { Screen } from "../../ui/screen";
import { Text } from "../../ui/text";
import { TextButton } from "../../ui/text-button";

const goOn = () => router.push(`/onboarding/${next("welcome")}`);

function ClimateRing() {
  const { c } = useTheme();
  const r = 104;
  const len = 2 * Math.PI * r;
  return (
    <View style={{ alignSelf: "center", width: 240, height: 240 }}>
      <Svg width={240} height={240}>
        <Circle cx={120} cy={120} r={r} fill="none" stroke={c.s2} strokeWidth={8} />
        <Circle
          cx={120}
          cy={120}
          r={r}
          fill="none"
          stroke={c.acc}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * 0.2}
          transform="rotate(-90 120 120)"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <SnowflakeIcon size={iconSize.lg} color={c.acc} />
        <Text style={{ ...textStyle("hero"), fontSize: 52, lineHeight: 56, letterSpacing: -1.56 }}>
          8:02
        </Text>
        <Text variant="caption" color="fg2" style={{ fontSize: 14 }}>
          34° → 26°
        </Text>
      </View>
    </View>
  );
}

function StatusPreview() {
  const { c } = useTheme();
  const t = useT();
  const card = { backgroundColor: c.s1, borderWidth: 1, borderColor: c.line, height: 96 } as const;
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 14 }}>
      <View
        style={{
          ...card,
          width: 96,
          borderRadius: 48,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <LockIcon size={iconSize.lg} color={c.fg} />
        <Text variant="caption" weight={600} style={{ fontSize: 12 }}>
          {t.locked}
        </Text>
      </View>
      <View
        style={{
          ...card,
          width: 200,
          borderRadius: radius.cardLg,
          paddingHorizontal: 18,
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Text variant="label" weight={600}>
          HR-V · {t.locked}
        </Text>
        <Text variant="caption" color="fg2">
          Landmark 81 · {t.minAgo(2)}
        </Text>
        <Text variant="caption" color="fg2">
          62% · 418 km
        </Text>
      </View>
    </View>
  );
}

export default function Welcome() {
  const { c } = useTheme();
  const t = useT();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollViewInstance>(null);
  const carBox = useRef<React.ComponentRef<typeof View>>(null);
  const [i, setI] = useState(0);

  const chip = (Icon: typeof LockIcon, label: string, live?: boolean) => (
    <Chip
      key={label}
      label={label}
      icon={<Icon size={iconSize.sm} color={live ? c.acc : c.fg} />}
    />
  );
  const slides: { visual: ReactNode; title: string; chips: ReactNode[] }[] = [
    {
      visual: (
        <View style={{ paddingHorizontal: 4 }}>
          {/* The cold-start animation lands its car exactly here, as on Home. */}
          <View
            ref={carBox}
            onLayout={() =>
              carBox.current?.measureInWindow((x, y, width) =>
                setLaunchTarget({
                  x,
                  y,
                  width,
                  body: "crossover",
                  paint: "#6B7078",
                  look: "shaded",
                }),
              )
            }
          >
            <Car body="crossover" paint="#6B7078" />
          </View>
        </View>
      ),
      title: t.welcome1,
      chips: [
        chip(LockIcon, t.chipLock),
        chip(SnowflakeIcon, t.chipCool, true),
        chip(MapPinIcon, t.chipFind),
      ],
    },
    {
      visual: <ClimateRing />,
      title: t.welcome2,
      chips: [
        chip(SnowflakeIcon, t.chipAc, true),
        chip(TimerIcon, t.chip10min),
        chip(ThermometerSimpleIcon, "26°", true),
      ],
    },
    {
      visual: <StatusPreview />,
      title: t.welcome3,
      chips: [
        chip(DeviceMobileIcon, t.chipWidget),
        chip(ChatTextIcon, t.chipSiri),
        chip(BellIcon, t.chipAlerts),
      ],
    },
  ];
  const last = i === slides.length - 1;

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <Glow color={c.acc} opacity={0.16} style={{ left: -60, right: -60, top: 250, height: 340 }} />
      <View
        style={{
          paddingHorizontal: space.gutter,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <LogoTile />
          <Text weight={600}>{t.appName}</Text>
        </View>
        <TextButton label={t.skip} onPress={goOn} />
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const k = Math.round(e.nativeEvent.contentOffset.x / width);
          if (k !== i) haptics.selection();
          setI(k);
        }}
        style={{ flex: 1 }}
      >
        {slides.map((s) => (
          <View key={s.title} style={{ width }}>
            <View style={{ flex: 1, justifyContent: "center" }}>{s.visual}</View>
            <View style={{ paddingHorizontal: space.gutter, gap: 12 }}>
              <Text
                style={{
                  ...textStyle("title"),
                  fontSize: 36,
                  lineHeight: 42,
                  letterSpacing: -1.08,
                }}
              >
                {s.title}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>{s.chips}</View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ marginTop: 32, paddingHorizontal: space.gutter, gap: 20 }}>
        <View
          accessible
          accessibilityLabel={t.slideOf(i + 1, slides.length)}
          style={{ flexDirection: "row", gap: 6 }}
        >
          {slides.map((s, k) => (
            <View
              key={s.title}
              style={{
                height: 6,
                borderRadius: 3,
                width: k === i ? 24 : 6,
                backgroundColor: k === i ? c.fg : c.s2,
              }}
            />
          ))}
        </View>
        {last ? (
          <Button height={64} label={t.connect} onPress={goOn} />
        ) : (
          <Button
            height={64}
            tone="neutral"
            label={t.next}
            onPress={() => {
              scroller.current?.scrollTo({ x: (i + 1) * width, animated: true });
              setI(i + 1);
            }}
          />
        )}
        <Text variant="caption" color="fg2" style={{ fontSize: 12, textAlign: "center" }}>
          {t.unofficial}
        </Text>
      </View>
    </Screen>
  );
}
