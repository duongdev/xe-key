import { useQuery } from "@tanstack/react-query";
import { ArrowCounterClockwiseIcon, CarProfileIcon, SealCheckIcon } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { carNameFor, hondaLook, NAME_MAX, saveName, vinTail } from "../car/your-car";
import { useT } from "../i18n";
import { type CarLook, usePrefs } from "../prefs";
import { carService } from "../services/query";
import { fontFamily, radius } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";
import { Shimmer } from "../ui/appear";
import { CarLookEditor } from "../ui/car-look-editor";
import { PageHeader } from "../ui/page-header";
import { Screen, useBottomPad } from "../ui/screen";
import { Text } from "../ui/text";
import { useToast } from "../ui/toast";

/** Saves land this long after the last change, so a drag or scrub saves once on lift. */
const SETTLE_MS = 400;

/**
 * "Your car" (task 018): name, body, style and paint save as you go (no Save button) and show on
 * Home, widgets and Siri at once. Plate, model and VIN stay read-only from Honda.
 */
export default function YourCar() {
  const { c } = useTheme();
  const t = useT();
  const bottomPad = useBottomPad();
  const toast = useToast();
  const { prefs, update } = usePrefs();
  const honda = useQuery({ queryKey: ["hondaCar"], queryFn: () => carService.hondaCar() });
  const model = honda.data?.model ?? "";
  const [look, setLook] = useState<CarLook>(prefs.car);
  // The field shows the name in use; Honda's own name saves as "no own name".
  const [name, setName] = useState(prefs.carName ?? "");
  useEffect(() => {
    if (!prefs.carName && model) setName(model);
  }, [prefs.carName, model]);

  // "Saved" shows once per visit: autosave is the rule, so later saves stay quiet.
  const toldSaved = useRef(false);
  const saved = (text: string) => toast.show({ kind: "success", text });
  const savedOnce = () => {
    if (toldSaved.current) return;
    toldSaved.current = true;
    saved(t.savedToast);
  };

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeLook = (next: CarLook) => {
    // The carousel reports its page on settle too; only a real change saves.
    if (next.body === look.body && next.look === look.look && next.paint === look.paint) return;
    setLook(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      update({ car: next });
      savedOnce();
    }, SETTLE_MS);
  };
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const saveNameNow = () => {
    const next = saveName(name, model);
    setName(carNameFor(next, model));
    if (carNameFor(next, model) === carNameFor(prefs.carName, model)) return;
    update({ carName: next });
    savedOnce();
  };

  const reset = () => {
    if (!honda.data) return;
    const back = hondaLook(honda.data);
    if (timer.current) clearTimeout(timer.current);
    setLook(back.car);
    setName(model);
    update(back);
    saved(t.resetHonda);
  };

  const rows = [
    { label: t.plateLabel, value: honda.data?.plate ?? null },
    {
      label: t.modelLabel,
      value: honda.data ? [model, honda.data.year].filter(Boolean).join(" · ") : null,
    },
    { label: t.vin, value: vinTail(honda.data?.vin ?? null) },
  ].filter((r) => r.value !== null || honda.isPending);

  return (
    <Screen scroll>
      <PageHeader title={t.yourCar} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CarLookEditor value={look} onChange={changeLook} photo={honda.data?.photo ?? null}>
          <View style={{ gap: 8, marginTop: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <CarProfileIcon size={14} color={c.fg2} />
              <Text variant="caption" color="fg2">
                {t.carNameLabel}
              </Text>
            </View>
            <View
              style={{
                height: 52,
                borderRadius: 16,
                backgroundColor: c.s1,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TextInput
                value={name}
                onChangeText={(v) => setName(v.slice(0, NAME_MAX))}
                onBlur={saveNameNow}
                onSubmitEditing={saveNameNow}
                placeholder={carNameFor(null, model)}
                placeholderTextColor={c.fg2}
                maxLength={NAME_MAX}
                returnKeyType="done"
                accessibilityLabel={t.carNameLabel}
                style={{ flex: 1, color: c.fg, fontSize: 17, fontFamily: fontFamily[500] }}
              />
              <Text variant="caption" color="fg2" style={{ fontSize: 13 }}>
                {`${name.length}/${NAME_MAX}`}
              </Text>
            </View>
            <Text variant="caption" color="fg2" style={{ fontSize: 13 }}>
              {t.carNameHint}
            </Text>
          </View>
        </CarLookEditor>

        <View style={{ padding: 16, gap: 10, borderRadius: radius.card, backgroundColor: c.s1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 2 }}>
            <SealCheckIcon size={14} color={c.acc} />
            <Text variant="caption" color="fg2">
              {t.fromHonda}
            </Text>
          </View>
          {rows.map((r) => (
            <View
              key={r.label}
              accessible
              accessibilityLabel={`${r.label}: ${r.value ?? ""}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: c.s2,
              }}
            >
              <Text color="fg2">{r.label}</Text>
              {r.value !== null ? (
                <Text weight={600}>{r.value}</Text>
              ) : (
                <Shimmer
                  style={{ width: 110, height: 14, borderRadius: 6, backgroundColor: c.s2 }}
                />
              )}
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!honda.data}
          onPress={reset}
          hitSlop={8}
          style={({ pressed }) => ({
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 8,
            opacity: !honda.data ? 0.4 : pressed ? 0.6 : 1,
          })}
        >
          <ArrowCounterClockwiseIcon size={16} color={c.fg2} />
          <Text color="fg2">{t.resetHonda}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
