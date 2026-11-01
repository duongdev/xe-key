import { router } from "expo-router";
import {
  CaretLeftIcon,
  CarProfileIcon,
  CheckIcon,
  ClockIcon,
  DoorIcon,
  EngineIcon,
  HandTapIcon,
  LockIcon,
  LockOpenIcon,
  WarningIcon,
} from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { inFlight, MAX_RETRIES } from "../car/command";
import { freshness } from "../car/freshness";
import { useCommand } from "../car/use-command";
import { useT } from "../i18n";
import { useCar } from "../services/query";
import { iconSize } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { HoldButton } from "../ui/hold-button";
import { Screen } from "../ui/screen";
import { Text } from "../ui/text";
import { useNow } from "../ui/use-now";

export default function Doors() {
  const { c } = useTheme();
  const t = useT();
  const now = useNow();
  const { data: car } = useCar();
  const { state: cmd, send } = useCommand();
  const [holding, setHolding] = useState(false);

  const unlocked = car?.doors === "unlocked";
  const pending = inFlight(cmd);
  const age = car ? freshness(car.updatedAt, now) : null;
  const ageText = !age || age.unit === "live" ? t.live : t.age(age.n, age.unit);
  const parts = [
    { key: "doors", icon: DoorIcon, label: t.doors, closed: car?.closed.doors ?? true },
    { key: "trunk", icon: CarProfileIcon, label: t.trunk, closed: car?.closed.trunk ?? true },
    { key: "hood", icon: EngineIcon, label: t.hood, closed: car?.closed.hood ?? true },
  ];

  const hint = (() => {
    if (holding)
      return { text: t.keepHolding, color: c.warn, icon: <HandTapIcon size={16} color={c.warn} /> };
    if (cmd.status === "sent" || cmd.status === "accepted")
      return {
        text: cmd.status === "sent" ? t.sending : t.acceptedWaiting,
        color: c.fg2,
        icon: <ActivityIndicator size="small" color={c.fg2} />,
      };
    if (cmd.status === "retrying")
      return {
        text: t.retrying(cmd.attempt, MAX_RETRIES),
        color: c.warn,
        icon: <ActivityIndicator size="small" color={c.warn} />,
      };
    if (cmd.status === "failed")
      return { text: t.notReached, color: c.warn, icon: <WarningIcon size={16} color={c.warn} /> };
    return null;
  })();

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
            alignItems: "center",
            marginLeft: -10,
          }}
        >
          <CaretLeftIcon size={iconSize.md} color={c.fg} />
        </Pressable>
        <Text variant="label" weight={600} accessibilityRole="header">
          {t.doors}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28 }}>
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: c.s1,
            borderWidth: unlocked ? 2 : 1,
            borderColor: unlocked ? c.warn : c.line,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {unlocked ? (
            <LockOpenIcon size={72} color={c.warn} />
          ) : (
            <LockIcon size={72} color={c.fg} />
          )}
        </View>
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text variant="title" color={unlocked ? "warn" : "fg"} accessibilityLiveRegion="polite">
            {unlocked ? t.unlocked : t.locked}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
            {parts.map(({ key, icon: Icon, label, closed }) => (
              <View
                key={key}
                accessible
                accessibilityLabel={closed ? label : `${label}, ${t.open}`}
                style={{
                  height: 34,
                  paddingHorizontal: 12,
                  borderRadius: 17,
                  backgroundColor: c.s1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon size={16} color={closed ? c.fg2 : c.warn} />
                <Text variant="caption" style={{ fontSize: 14, color: closed ? c.fg : c.warn }}>
                  {label}
                </Text>
                {closed ? (
                  <CheckIcon size={14} color={c.acc} />
                ) : (
                  <WarningIcon size={14} color={c.warn} />
                )}
              </View>
            ))}
          </View>
          <View
            accessible
            accessibilityLabel={t.confirmedAgo(ageText)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <ClockIcon size={14} color={c.fg2} />
            <Text variant="caption" color="fg2">
              {ageText}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          minHeight: 28,
          marginBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {hint ? (
          <>
            {hint.icon}
            <Text variant="caption" style={{ color: hint.color }} accessibilityLiveRegion="polite">
              {hint.text}
            </Text>
          </>
        ) : null}
      </View>
      <View style={{ flexDirection: "row" }}>
        <HoldButton
          mode={unlocked ? "tap" : "hold"}
          label={
            pending
              ? cmd.kind === "unlock"
                ? t.unlocking
                : t.locking
              : unlocked
                ? t.lock
                : t.holdToUnlock
          }
          accessibilityHint={unlocked ? undefined : t.holdHint}
          disabled={car?.account !== "ok" || pending}
          bg={unlocked && !pending ? "warn" : "s1"}
          fg={unlocked && !pending ? "onwarn" : "fg"}
          icon={
            unlocked ? (
              <LockIcon size={iconSize.md} color={pending ? c.fg : c.onwarn} />
            ) : (
              <LockOpenIcon size={iconSize.md} color={c.fg} />
            )
          }
          onHoldChange={setHolding}
          onAction={() => send(unlocked ? "lock" : "unlock")}
        />
      </View>
      <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "center", gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <LockIcon size={14} color={c.fg2} />
          <Text variant="caption" color="fg2">
            {t.tap}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <LockOpenIcon size={14} color={c.fg2} />
          <Text variant="caption" color="fg2">
            {t.hold}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
