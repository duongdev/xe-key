import { router } from "expo-router";
import {
  ArrowsClockwiseIcon,
  BellIcon,
  CaretLeftIcon,
  CheckIcon,
  FanIcon,
  KeyIcon,
  LockIcon,
  PlusIcon,
  PowerIcon,
  SnowflakeIcon,
  TimerIcon,
  WarningIcon,
} from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { inFlight, MAX_RETRIES } from "../car/command";
import { clock, engineState, extendAction, MAX_STARTS } from "../car/engine";
import { cancelReminder, remindBeforeOff } from "../car/reminder";
import { useCommand } from "../car/use-command";
import { useT } from "../i18n";
import type { AcLevel } from "../services/car";
import { useCar } from "../services/query";
import { settle, useReducedMotion } from "../theme/motion";
import { iconSize, textStyle } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Appear, Spin } from "../ui/appear";
import { BusyRing } from "../ui/busy-ring";
import { Digits } from "../ui/digits";
import { HoldButton } from "../ui/hold-button";
import { Screen } from "../ui/screen";
import { SegmentedSlider } from "../ui/segmented-slider";
import { Text } from "../ui/text";
import { useToast } from "../ui/toast";
import { useNow } from "../ui/use-now";

const LEVELS: AcLevel[] = ["low", "mid", "high"];
/** Target cabin temperature per AC level (sent as acTempVal). */
const TARGET_C: Record<AcLevel, number> = { low: 28, mid: 26, high: 22 };
const SIZE = 260;
const R = 112;
const LEN = 2 * Math.PI * R;

const ACircle = Animated.createAnimatedComponent(Circle);

/** Sweeps full in 1.2 s (Settle) when the engine starts, then drains once per second. */
function DrainRing({ fraction }: { fraction: number }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const offset = useSharedValue(reduced ? LEN * (1 - fraction) : LEN);
  const swept = useRef(false);
  useEffect(() => {
    const to = LEN * (1 - fraction);
    if (!swept.current && !reduced) {
      swept.current = true;
      offset.value = withTiming(to, { duration: 1200, easing: settle });
      return;
    }
    offset.value = withTiming(to, { duration: 1000, easing: Easing.linear });
  }, [fraction, offset, reduced]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <ACircle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={R}
      fill="none"
      stroke={c.acc}
      strokeWidth={8}
      strokeLinecap="round"
      strokeDasharray={LEN}
      transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      animatedProps={props}
    />
  );
}

export default function Engine() {
  const { c } = useTheme();
  const t = useT();
  const now = useNow(1000);
  const { data: car } = useCar();
  const { state: cmd, send, cancel } = useCommand();
  const [ac, setAc] = useState(1);
  const [reminder, setReminder] = useState(false);
  const toast = useToast();

  const engine = car ? engineState(car.engine, now) : ({ running: false } as const);
  const starts = car?.startsLeft ?? 0;
  const pending =
    inFlight(cmd) && (cmd.kind === "start" || cmd.kind === "extend" || cmd.kind === "stop");
  const starting = pending && cmd.kind === "start";
  const retrying = cmd.status === "retrying";
  const level = LEVELS[ac] ?? "mid";

  // Auto-off: running → off without a command means the 10 minutes ran out.
  const [wasRunning, setWasRunning] = useState(engine.running);
  useEffect(() => {
    if (wasRunning && !engine.running && !pending)
      toast.show({ kind: "info", icon: "power", text: t.engineOffAuto });
    setWasRunning(engine.running);
  }, [engine.running, pending, t.engineOffAuto, wasRunning, toast]);

  useEffect(() => {
    if (cmd.status === "confirmed" && cmd.kind === "stop") {
      setReminder(false);
      cancelReminder().catch((e: unknown) => console.warn("reminder cancel failed", e));
    }
    if (cmd.status === "confirmed" && cmd.kind === "start") setReminder(false);
  }, [cmd]);

  const big = engine.running
    ? clock(engine.left)
    : starting
      ? retrying
        ? t.retryingShort
        : cmd.status === "sent"
          ? t.sending
          : t.starting
      : t.off;
  const offAt = engine.running ? new Date(now + engine.left * 1000).toTimeString().slice(0, 5) : "";

  const msg: { text: string; icon: typeof LockIcon; color: string } = (() => {
    if (cmd.status === "sent") return { text: t.sending, icon: ArrowsClockwiseIcon, color: c.fg2 };
    if (cmd.status === "accepted")
      return { text: t.acceptedWaiting, icon: CheckIcon, color: c.fg2 };
    if (cmd.status === "retrying")
      return { text: t.retrying(cmd.attempt, MAX_RETRIES), icon: WarningIcon, color: c.warn };
    if (engine.running)
      return { text: t.cooling(TARGET_C[level]), icon: SnowflakeIcon, color: c.acc };
    return { text: t.doorsStayLocked, icon: LockIcon, color: c.fg2 };
  })();

  const extend = extendAction(starts, reminder);

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.backToCar}
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            justifyContent: "center",
            marginLeft: -10,
            alignItems: "center",
          }}
        >
          <CaretLeftIcon size={iconSize.md} color={c.fg} />
        </Pressable>
        <Text variant="label" weight={600} accessibilityRole="header">
          {t.climate}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ marginTop: 28, height: SIZE, alignItems: "center", justifyContent: "center" }}>
        <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={c.s2} strokeWidth={8} />
          {engine.running ? <DrainRing fraction={engine.fraction} /> : null}
        </Svg>
        {pending && !engine.running ? <BusyRing size={SIZE} retrying={retrying} /> : null}
        <View style={{ alignItems: "center", gap: 6 }} accessible accessibilityLiveRegion="polite">
          {engine.running ? (
            <Spin periodMs={8000}>
              <SnowflakeIcon size={20} color={c.acc} />
            </Spin>
          ) : null}
          <Appear kind="rise" play={engine.running}>
            {engine.running ? (
              <Digits value={big} style={{ ...textStyle("hero"), lineHeight: 66, color: c.fg }} />
            ) : (
              <Text style={{ ...textStyle("title"), lineHeight: 44 }}>{big}</Text>
            )}
          </Appear>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {engine.running ? (
              <TimerIcon size={16} color={c.fg2} />
            ) : (
              <SnowflakeIcon size={16} color={c.fg2} />
            )}
            <Text variant="label" weight={400} color="fg2">
              {engine.running ? t.offAt(offAt) : t.tenMin}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          marginTop: 18,
          minHeight: 32,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <msg.icon size={iconSize.sm} color={msg.color} />
        <Text
          variant="label"
          weight={400}
          style={{ color: msg.color }}
          accessibilityLiveRegion="polite"
        >
          {msg.text}
        </Text>
      </View>

      <View style={{ marginTop: 18, gap: 10 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <FanIcon size={16} color={c.fg2} />
            <Text variant="caption" color="fg2">
              {t.ac}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 14 }}>
            {[6, 10, 14].map((h, k) => (
              <View
                key={h}
                style={{
                  width: 5,
                  height: h,
                  borderRadius: 2,
                  backgroundColor: k <= ac ? c.acc : c.s2,
                }}
              />
            ))}
          </View>
        </View>
        <SegmentedSlider
          options={t.acLevels}
          value={ac}
          onChange={setAc}
          label={t.ac}
          height={56}
          knob="acc"
          onKnob="onacc"
          knobIcon={<SnowflakeIcon size={16} color={c.onacc} />}
        />
      </View>

      <View
        accessible
        accessibilityLabel={t.startsAria(starts, MAX_STARTS)}
        style={{
          marginTop: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <KeyIcon size={16} color={c.fg2} />
          <Text variant="caption" color="fg2">
            {t.startsLeft(starts)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {Array.from({ length: MAX_STARTS }, (_, i) => i + 1).map((n) => (
            <View
              key={n}
              style={{
                width: 24,
                height: 6,
                borderRadius: 3,
                backgroundColor: starts >= n ? c.acc : c.s2,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {starting ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            cancel();
            toast.show({ kind: "info", text: t.noStartUsed });
          }}
          style={({ pressed }) => ({
            height: 68,
            borderRadius: 34,
            backgroundColor: c.s1,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text weight={600}>{t.cancel}</Text>
        </Pressable>
      ) : engine.running ? (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            disabled={pending}
            onPress={() => send("stop")}
            style={({ pressed }) => ({
              opacity: pending ? 0.5 : pressed ? 0.7 : 1,
              flex: 1,
              height: 68,
              borderRadius: 34,
              backgroundColor: c.s1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            })}
          >
            <PowerIcon size={20} color={c.fg} />
            <Text weight={600}>{t.stop}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              extend === "extend"
                ? t.extendAria
                : extend === "remind"
                  ? t.remindAria
                  : t.reminderSet
            }
            disabled={pending}
            onPress={async () => {
              if (extend === "extend") send("extend");
              else if (extend === "remind" && car?.engine.on)
                setReminder(
                  await remindBeforeOff(car.engine.endsAt, t.reminderTitle, t.reminderBody),
                );
            }}
            style={({ pressed }) => ({
              flex: 1.6,
              height: 68,
              borderRadius: 34,
              backgroundColor: c.acc,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: pending ? 0.5 : pressed ? 0.8 : 1,
            })}
          >
            {extend === "extend" ? (
              <PlusIcon size={20} color={c.onacc} />
            ) : extend === "remind" ? (
              <BellIcon size={20} color={c.onacc} />
            ) : (
              <CheckIcon size={20} color={c.onacc} />
            )}
            <Text weight={600} color="onacc">
              {extend === "extend" ? t.extend : extend === "remind" ? t.remindAt : t.reminderSet}
            </Text>
          </Pressable>
        </View>
      ) : starts > 0 ? (
        <HoldButton
          mode="hold"
          label={t.holdToStart}
          accessibilityHint={t.holdHint}
          bg="acc"
          fg="onacc"
          fill="onacc"
          disabled={car?.account !== "ok"}
          icon={<PowerIcon size={iconSize.md} color={c.onacc} />}
          onAction={() => {
            send("start", { ac: level });
          }}
        />
      ) : (
        <View
          accessible
          accessibilityLabel={t.driveToReset}
          style={{
            height: 68,
            borderRadius: 34,
            backgroundColor: c.s1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <KeyIcon size={iconSize.sm} color={c.fg2} />
          <Text variant="label" weight={400} color="fg2">
            {t.driveToReset}
          </Text>
        </View>
      )}
    </Screen>
  );
}
