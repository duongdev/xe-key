import { router } from "expo-router";
import { LockKeyIcon, LockSimpleIcon } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Linking,
  Pressable,
  Switch,
  TextInput,
  type TextInputInstance,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "../i18n";
import { hondaPin } from "../services/secret";
import { unlock } from "../services/trip-pin";
import { haptics } from "../theme/haptics";
import { useTheme } from "../theme/use-theme";
import { Button } from "./button";
import { Text } from "./text";

// No link scheme for the Honda app is known; the App Store search finds it either way.
const HONDA_APP =
  "itms-apps://search.itunes.apple.com/WebObjects/MZSearch.woa/wa/search?media=software&term=Honda%20CONNECT";

type Status = "idle" | "checking" | "wrong" | "failed";

/** Honda PINs are 4 digits (HANDOFF › Honda PIN). */
const PIN_LEN = 4;

let pending: { onUnlocked: () => void } | null = null;

/**
 * Opens the Honda PIN form sheet (native iOS sheet, route `/pin`). `onUnlocked` runs once the PIN
 * is accepted and the sheet has closed.
 */
export function askPin(opts: { changed?: boolean; remember?: boolean }, onUnlocked: () => void) {
  pending = { onUnlocked };
  router.push({
    pathname: "/pin",
    params: { changed: opts.changed ? "1" : "", remember: opts.remember ? "1" : "" },
  });
}

/**
 * Honda PIN entry (HANDOFF › Honda PIN and trip detail, board Pin-states): 4 secure dots over the
 * system number pad; the 6th digit sends. Wrong → amber dots, next digit starts over. Locked and
 * Forgot replace the pad: only the Honda app can reset the PIN. Lives in the `/pin` form sheet.
 */
export function PinPanel({
  changed,
  remember: rememberFirst,
}: {
  changed?: boolean;
  remember?: boolean;
}) {
  const { c } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const close = () => router.back();
  const input = useRef<TextInputInstance>(null);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [view, setView] = useState<"pad" | "locked" | "forgot">("pad");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    hondaPin.saved().then((on) => setRemember(!!rememberFirst || !!changed || on));
  }, [changed, rememberFirst]);

  const send = async (value: string) => {
    setStatus("checking");
    AccessibilityInfo.announceForAccessibility(t.pinChecking);
    const res = await unlock(value, remember).catch(() => ({ ok: false, error: "other" }) as const);
    if (res.ok) {
      haptics.success();
      setStatus("idle");
      const done = pending;
      pending = null;
      close();
      done?.onUnlocked();
      return;
    }
    haptics.warning();
    if (res.error === "locked") {
      setView("locked");
      return;
    }
    setStatus(res.error === "wrong" ? "wrong" : "failed");
    input.current?.focus();
    AccessibilityInfo.announceForAccessibility(res.error === "wrong" ? t.pinWrong : t.pinFailed);
  };

  const type = (text: string) => {
    if (status === "checking") return;
    const digits = text.replace(/\D/g, "");
    // After a wrong PIN the next digit starts over.
    const next =
      status === "wrong" || status === "failed" ? digits.slice(-1) : digits.slice(0, PIN_LEN);
    if (status !== "idle") setStatus("idle");
    setPin(next);
    if (next.length === PIN_LEN) void send(next);
  };

  const dotColor = status === "wrong" ? c.warn : c.fg;
  const stopView = view !== "pad";
  return (
    <View
      style={{
        backgroundColor: c.s1,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: Math.max(insets.bottom, 16) + 8,
        alignItems: "center",
        gap: 14,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: stopView ? `${c.warn}24` : `${c.acc}24`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {stopView ? (
          <LockSimpleIcon size={22} color={c.warn} />
        ) : (
          <LockKeyIcon size={22} color={c.acc} />
        )}
      </View>
      <Text weight={700} accessibilityRole="header" style={{ fontSize: 20, textAlign: "center" }}>
        {view === "locked"
          ? t.pinLockedTitle
          : view === "forgot"
            ? t.pinForgotTitle
            : changed
              ? t.pinChangedTitle
              : t.pinTitle}
      </Text>
      <Text color="fg2" style={{ textAlign: "center", fontSize: 15 }}>
        {view === "locked"
          ? t.pinLockedText
          : view === "forgot"
            ? t.pinForgotText
            : changed
              ? t.pinChangedText
              : t.pinText}
      </Text>

      {stopView ? (
        <View style={{ alignSelf: "stretch", gap: 10, marginTop: 6 }}>
          <Button label={t.openHondaApp} onPress={() => Linking.openURL(HONDA_APP)} />
          <Button label={t.notNow} tone="secondary" onPress={close} />
        </View>
      ) : (
        <>
          <Pressable
            accessible
            accessibilityLabel={t.pinDots(pin.length)}
            onPress={() => input.current?.focus()}
            style={{ flexDirection: "row", gap: 20, paddingVertical: 8 }}
          >
            {Array.from({ length: PIN_LEN }, (_, i) => (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed dot positions
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  borderWidth: 1.5,
                  borderColor: i < pin.length ? dotColor : c.fg2,
                  backgroundColor: i < pin.length ? dotColor : "transparent",
                }}
              />
            ))}
          </Pressable>
          <Text
            accessibilityLiveRegion="polite"
            variant="caption"
            color={status === "wrong" ? "warn" : "fg2"}
            style={{ height: 18, textAlign: "center" }}
          >
            {status === "checking"
              ? t.pinChecking
              : status === "wrong"
                ? t.pinWrong
                : status === "failed"
                  ? t.pinFailed
                  : ""}
          </Text>
          <TextInput
            ref={input}
            value={pin}
            onChangeText={type}
            autoFocus
            keyboardType="number-pad"
            textContentType="none"
            autoComplete="off"
            caretHidden
            // Off-screen: the dots are the visible field.
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          />
          <View
            style={{
              alignSelf: "stretch",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text>{t.pinRemember}</Text>
            <View style={{ height: 31 }}>
              <Switch
                accessibilityLabel={t.pinRemember}
                value={remember}
                onValueChange={setRemember}
                trackColor={{ true: c.acc, false: c.s2 }}
              />
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setView("forgot")} hitSlop={8}>
            <Text weight={600} color="acc" style={{ fontSize: 15 }}>
              {t.pinForgot}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
