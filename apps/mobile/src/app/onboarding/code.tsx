import { router } from "expo-router";
import { ArrowsClockwiseIcon, ChatTextIcon, WarningCircleIcon } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  type TextInputInstance,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useT } from "../../i18n";
import { next } from "../../onboarding/flow";
import { maskPhone } from "../../onboarding/phone";
import { useOnboarding } from "../../onboarding/session";
import { StepHeader } from "../../onboarding/step-header";
import type { CodeError } from "../../services/auth";
import { forgetCar } from "../../services/query";
import { useAuth } from "../../services/use-auth";
import { haptics } from "../../theme/haptics";
import { useReducedMotion } from "../../theme/motion";
import { iconSize, radius, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { Screen } from "../../ui/screen";
import { Text } from "../../ui/text";

const LENGTH = 6;
const RESEND_S = 60;
/** Wrong code: keep the red digits through the shake, then clear for a new try. */
const CLEAR_MS = 700;
const BOXES = [0, 1, 2, 3, 4, 5];

type State = "typing" | "checking" | "ok" | CodeError;

export default function Code() {
  const { c } = useTheme();
  const t = useT();
  const reduced = useReducedMotion();
  const { phone, setCar } = useOnboarding();
  const auth = useAuth();
  const input = useRef<TextInputInstance>(null);
  const [code, setCode] = useState("");
  const [state, setState] = useState<State>("typing");
  const [resend, setResend] = useState(RESEND_S);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  useEffect(() => {
    const id = setInterval(() => setResend((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const verify = async (value: string) => {
    setState("checking");
    const res = await auth.verifyCode(value);
    if (res.ok) {
      forgetCar();
      setCar(res.car);
      setState("ok");
      // haptics: code verified / rejected; no shared form submit helper yet (HANDOFF › Haptics).
      haptics.success();
      input.current?.blur();
      return;
    }
    setState(res.error);
    // haptics: rejected code (see above).
    haptics.warning();
    setTimeout(() => setCode(""), CLEAR_MS);
    if (!reduced) {
      const step = (x: number) => withTiming(x, { duration: 50 });
      shake.value = withSequence(step(-8), step(8), step(-6), step(6), step(0));
    }
  };

  const onChange = (raw: string) => {
    if (state === "checking" || state === "ok") return;
    const value = raw.replace(/\D/g, "").slice(0, LENGTH);
    setCode(value);
    setState("typing");
    if (value.length === LENGTH) verify(value);
  };

  const newCode = async () => {
    await auth.sendCode();
    setCode("");
    setState("typing");
    setResend(RESEND_S);
    input.current?.focus();
  };

  const failed =
    state === "wrong-code" ||
    state === "expired-code" ||
    state === "server-down" ||
    state === "unknown";
  const ring = (i: number) =>
    failed
      ? c.error
      : state === "ok"
        ? c.acc
        : state === "typing" && i === code.length
          ? c.acc
          : c.s1;

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <StepHeader step="code" />
        <View
          style={{
            marginTop: 28,
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: c.s1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChatTextIcon size={iconSize.lg} color={c.acc} />
        </View>
        <Text style={{ ...textStyle("large"), marginTop: 16, marginBottom: 8 }}>{t.codeTitle}</Text>
        <Text variant="label" weight={400} color="fg2" style={{ marginBottom: 28 }}>
          {t.sentTo(maskPhone(phone ?? ""))}
        </Text>

        <View>
          <Animated.View style={[{ flexDirection: "row", gap: 8 }, shakeStyle]}>
            {BOXES.map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 60,
                  borderRadius: 14,
                  backgroundColor: c.s1,
                  borderWidth: 2,
                  borderColor: ring(i),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text weight={600} style={{ fontSize: 26, lineHeight: 32 }}>
                  {code[i] ?? ""}
                </Text>
              </View>
            ))}
          </Animated.View>
          <TextInput
            ref={input}
            value={code}
            onChangeText={onChange}
            autoFocus
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={LENGTH}
            caretHidden
            accessibilityLabel={t.code}
            selectionColor="transparent"
            // Full-size and transparent (not 1x1) so taps focus it and iOS offers the SMS code.
            style={{ position: "absolute", inset: 0, color: "transparent", fontSize: 1 }}
          />
        </View>

        {failed ? (
          <View style={{ marginTop: 14, gap: 20 }}>
            <View
              accessibilityRole="alert"
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <WarningCircleIcon size={iconSize.sm} color={c.error} />
              <Text variant="caption" color="error" style={{ fontSize: 14 }}>
                {state === "expired-code"
                  ? t.expiredCode
                  : state === "server-down"
                    ? t.hondaDown
                    : state === "unknown"
                      ? t.hondaError()
                      : t.wrongCode}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={newCode}
              style={{
                alignSelf: "flex-start",
                height: 44,
                paddingHorizontal: 18,
                borderRadius: radius.chip * 2,
                backgroundColor: c.s1,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ArrowsClockwiseIcon size={iconSize.sm} color={c.acc} />
              <Text variant="label" weight={600} color="acc">
                {t.newCode}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              marginTop: 18,
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {state === "checking" ? <ActivityIndicator size="small" color={c.acc} /> : null}
            {state === "typing" && resend === 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={newCode}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text variant="label" weight={400} color="acc">
                  {t.resend}
                </Text>
              </Pressable>
            ) : (
              <Text variant="label" weight={400} color="fg2" accessibilityLiveRegion="polite">
                {state === "ok"
                  ? t.verified
                  : state === "checking"
                    ? t.checking
                    : t.resendIn(resend)}
              </Text>
            )}
          </View>
        )}

        <View style={{ flex: 1 }} />
        {state === "ok" ? (
          <Button
            height={64}
            label={t.meetCar}
            onPress={() => router.replace(`/onboarding/${next("code")}`)}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
