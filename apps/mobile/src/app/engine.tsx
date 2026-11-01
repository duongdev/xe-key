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
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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
import { useReducedMotion } from "../theme/motion";
import { iconSize, textStyle } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { HoldButton } from "../ui/hold-button";
import { Screen } from "../ui/screen";
import { SegmentedSlider } from "../ui/segmented-slider";
import { Text } from "../ui/text";
import { useNow } from "../ui/use-now";

const LEVELS: AcLevel[] = ["low", "mid", "high"];
/** Target cabin temperature per AC level (sent as acTempVal). */
const TARGET_C: Record<AcLevel, number> = { low: 28, mid: 26, high: 22 };
const SIZE = 260;
const R = 112;
const LEN = 2 * Math.PI * R;

const ACircle = Animated.createAnimatedComponent(Circle);

/** Pending ring: 1.4 s per turn; amber dashed at half speed when retrying; pulse under Reduce Motion. */
function BusyRing({ retrying }: { retrying: boolean }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const turn = useSharedValue(0);
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduced) {
      pulse.value = withRepeat(withTiming(0.35, { duration: 700 }), -1, true);
      return;
    }
    turn.value = 0;
    turn.value = withRepeat(
      withTiming(360, { duration: retrying ? 2800 : 1400, easing: Easing.linear }),
      -1,
    );
  }, [reduced, retrying, turn, pulse]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value}deg` }],
    opacity: pulse.value,
  }));
  return (
    <Animated.View style={[{ position: "absolute", width: SIZE, height: SIZE }, style]}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={retrying ? c.warn : c.acc}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={retrying ? "40 30" : `120 ${LEN - 120}`}
        />
      </Svg>
    </Animated.View>
  );
}

function DrainRing({ fraction }: { fraction: number }) {
  const { c } = useTheme();
  const offset = useSharedValue(LEN * (1 - fraction));
  useEffect(() => {
    offset.value = withTiming(LEN * (1 - fraction), { duration: 1000, easing: Easing.linear });
  }, [fraction, offset]);
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
  const [note, setNote] = useState<{ text: string; icon: typeof LockIcon } | null>(null);

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
    if (wasRunning && !engine.running && !pending) setNote({ text: t.autoOff, icon: TimerIcon });
    setWasRunning(engine.running);
  }, [engine.running, pending, t.autoOff, wasRunning]);

  useEffect(() => {
    if (cmd.status === "confirmed" && cmd.kind === "stop") {
      setNote({ text: t.engineOff, icon: PowerIcon });
      setReminder(false);
      cancelReminder().catch((e: unknown) => console.warn("reminder cancel failed", e));
    }
    if (cmd.status === "confirmed" && cmd.kind === "extend")
      setNote({ text: t.extendUsed, icon: PlusIcon });
    if (cmd.status === "confirmed" && cmd.kind === "start") setReminder(false);
  }, [cmd, t]);

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
    if (cmd.status === "failed") return { text: t.notReached, icon: WarningIcon, color: c.warn };
    if (engine.running)
      return { text: t.cooling(TARGET_C[level]), icon: SnowflakeIcon, color: c.acc };
    if (note) return { text: note.text, icon: note.icon, color: c.fg2 };
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
        {pending && !engine.running ? <BusyRing retrying={retrying} /> : null}
        <View style={{ alignItems: "center", gap: 6 }} accessible accessibilityLiveRegion="polite">
          <Text
            style={{
              ...textStyle(engine.running ? "hero" : "title"),
              lineHeight: engine.running ? 66 : 44,
            }}
          >
            {big}
          </Text>
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
            setNote({ text: t.noStartUsed, icon: CheckIcon });
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
            setNote(null);
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
