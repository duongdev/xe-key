import { router } from "expo-router";
import {
  ArrowCounterClockwiseIcon,
  DeviceMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  PasswordIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from "phosphor-react-native";
import { useCallback, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from "react-native";
import { useT } from "../../i18n";
import { next } from "../../onboarding/flow";
import { HondaDown } from "../../onboarding/honda-down";
import { formatVnPhone, normalizeVnPhone } from "../../onboarding/phone";
import { regionById } from "../../onboarding/region";
import { useOnboarding } from "../../onboarding/session";
import { StepHeader } from "../../onboarding/step-header";
import { usePrefs } from "../../prefs";
import type { SignInError } from "../../services/auth";
import { useAuth } from "../../services/use-auth";
import { haptics } from "../../theme/haptics";
import { iconSize, textStyle } from "../../theme/tokens";
import { useTheme } from "../../theme/use-theme";
import { Button } from "../../ui/button";
import { Field } from "../../ui/field";
import { Screen } from "../../ui/screen";
import { Text } from "../../ui/text";
import { TextButton } from "../../ui/text-button";
import { useKeyboardVisible } from "../../ui/use-keyboard";

type Problem = SignInError | "invalid-phone";

export default function SignIn() {
  const { c } = useTheme();
  const t = useT();
  const region = regionById(usePrefs().prefs.region ?? "vietnam");
  const vn = region.id === "vietnam";
  const { setPhone, setCar } = useOnboarding();
  const auth = useAuth();
  const [code, setCode] = useState<string>();
  const [phone, setPhoneText] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [focus, setFocus] = useState<"phone" | "password" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Problem | null>(null);
  const keyboard = useKeyboardVisible();
  const errorRef = useRef(error);
  errorRef.current = error;
  const [attempt, setAttempt] = useState(0);

  const national = vn ? normalizeVnPhone(phone) : phone.replace(/\D/g, "") || null;
  const ready = !!national && password.length > 0;

  const submit = useCallback(async () => {
    if (!national) {
      setError("invalid-phone");
      haptics.warning();
      return;
    }
    setBusy(true);
    setAttempt((n) => n + 1);
    // Keep the Honda-down view up while retrying; clear form errors.
    setError((e) => (e === "server-down" || e === "app-blocked" ? e : null));
    const res = await auth.signIn({ region: region.id, phone: national, password });
    setBusy(false);
    if (!res.ok) {
      // Auto-retries while Honda is down stay silent: only a new failure buzzes.
      if (errorRef.current !== res.error) haptics.warning();
      setError(res.error);
      setCode(res.code);
      return;
    }
    setError(null);
    setPhone(national);
    // Already-trusted device: no SMS code, straight to the car.
    if (res.car) {
      setCar(res.car);
      router.push("/onboarding/found");
      return;
    }
    router.push(`/onboarding/${next("sign-in")}`);
  }, [auth, national, password, region.id, setPhone, setCar]);

  const down = error === "server-down" || error === "app-blocked";

  const input = {
    flex: 1,
    minWidth: 0,
    color: c.fg,
    ...textStyle("body"),
    lineHeight: undefined,
  } as const;

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <StepHeader step="sign-in" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ ...textStyle("large"), marginTop: 28, marginBottom: 8 }}>
            {t.signInTitle}
          </Text>
          <Text variant="label" weight={400} color="fg2" style={{ marginBottom: 24 }}>
            {t.signInHint}
          </Text>
          <View style={{ gap: 14 }}>
            <Field
              label={t.phone}
              state={error === "invalid-phone" ? "error" : focus === "phone" ? "focus" : undefined}
            >
              <DeviceMobileIcon size={20} color={c.fg2} />
              <Text color="fg2">{region.callingCode}</Text>
              <View style={{ width: 1, height: 24, backgroundColor: c.line }} />
              <TextInput
                accessibilityLabel={t.phone}
                value={phone}
                onChangeText={(v) => {
                  setPhoneText(vn ? formatVnPhone(v) : v);
                  if (error === "invalid-phone") setError(null);
                }}
                onFocus={() => setFocus("phone")}
                onBlur={() => setFocus(null)}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                placeholder="90 123 4567"
                placeholderTextColor={c.fg2}
                style={{ ...input, letterSpacing: 0.34 }}
              />
            </Field>
            <Field
              label={t.password}
              state={
                error === "wrong-credentials" ? "error" : focus === "password" ? "focus" : undefined
              }
            >
              <PasswordIcon size={20} color={error === "wrong-credentials" ? c.error : c.fg2} />
              <TextInput
                accessibilityLabel={t.password}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (error === "wrong-credentials") setError(null);
                }}
                onFocus={() => setFocus("password")}
                onBlur={() => setFocus(null)}
                secureTextEntry={!reveal}
                textContentType="password"
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={submit}
                style={input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={reveal ? t.hidePassword : t.showPassword}
                onPress={() => setReveal((r) => !r)}
                style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
              >
                {reveal ? (
                  <EyeSlashIcon size={20} color={c.fg2} />
                ) : (
                  <EyeIcon size={20} color={c.fg2} />
                )}
              </Pressable>
            </Field>
            {error === "wrong-credentials" ||
            error === "invalid-phone" ||
            error === "wrong-region" ||
            error === "unknown" ? (
              <View
                accessibilityRole="alert"
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <WarningCircleIcon size={iconSize.sm} color={c.error} />
                <Text variant="caption" color="error" style={{ fontSize: 14 }}>
                  {error === "invalid-phone"
                    ? t.invalidPhone
                    : error === "wrong-region"
                      ? t.wrongRegion
                      : error === "unknown"
                        ? t.hondaError(code)
                        : t.wrongCredentials}
                </Text>
              </View>
            ) : null}
            <TextButton
              label={error === "wrong-credentials" ? t.resetPassword : t.forgotPassword}
              color="acc"
              icon={
                error === "wrong-credentials" ? (
                  <ArrowCounterClockwiseIcon size={iconSize.sm} color={c.acc} />
                ) : undefined
              }
              style={{ alignSelf: "flex-start", marginTop: -8 }}
              onPress={() => Alert.alert(t.resetInHondaApp)}
            />
          </View>
          <View style={{ flex: 1, minHeight: 24 }} />
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <ShieldCheckIcon size={16} color={c.fg2} />
            <Text variant="caption" color="fg2">
              {t.passwordOnlyHonda}
            </Text>
          </View>
        </ScrollView>
        <Button
          height={64}
          tone="neutral"
          label={t.signIn}
          disabled={!ready}
          loading={busy}
          onPress={submit}
        />
        {keyboard ? (
          <View style={{ height: 8 }} />
        ) : (
          <TextButton
            label={t.noAccount}
            style={{ marginTop: 6 }}
            onPress={() => Alert.alert(t.signUpInHondaApp)}
          />
        )}
      </KeyboardAvoidingView>
      {down ? (
        // Overlay, not a swap: removing the password field makes iOS offer "Save Password".
        <Screen style={{ position: "absolute", inset: 0 }}>
          <StepHeader step="sign-in" />
          <HondaDown key={attempt} blocked={error === "app-blocked"} onRetry={submit} />
        </Screen>
      ) : null}
    </Screen>
  );
}
