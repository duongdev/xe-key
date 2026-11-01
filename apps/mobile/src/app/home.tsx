import { Link, router } from "expo-router";
import { View } from "react-native";
import { Car } from "../car/car";
import { BODIES } from "../car/geometry";
import { usePrefs } from "../prefs";
import { useTheme } from "../theme/use-theme";
import { Screen } from "../ui/screen";
import { Text } from "../ui/text";
import { TextButton } from "../ui/text-button";

// ponytail: placeholder until task 005 builds Home.
export default function Home() {
  const { scheme } = useTheme();
  const { prefs, update } = usePrefs();
  const { body, look, paint } = prefs.car;
  return (
    <Screen style={{ justifyContent: "center", gap: 16 }}>
      <Text variant="title">{prefs.carName ?? BODIES[body].name}</Text>
      <View style={{ marginHorizontal: -16 }}>
        <Car body={body} look={look === "line" ? "line" : "shaded"} paint={paint} ground={scheme} />
      </View>
      {__DEV__ ? (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
          <Link href="/dev" asChild>
            <TextButton label="Kitchen sink" />
          </Link>
          <TextButton
            label="Restart onboarding"
            onPress={() => {
              update({ onboarded: false });
              router.replace("/onboarding/welcome");
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}
