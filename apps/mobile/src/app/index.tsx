import { Redirect } from "expo-router";
import { usePrefs } from "../prefs";

export default function Index() {
  return <Redirect href={usePrefs().prefs.onboarded ? "/home" : "/onboarding/welcome"} />;
}
