import { useLocalSearchParams } from "expo-router";
import { PinPanel } from "../ui/pin-sheet";

/** Honda PIN form sheet (native sheet, see `_layout`). Open it with `askPin`. */
export default function Pin() {
  const { changed, remember } = useLocalSearchParams<{ changed?: string; remember?: string }>();
  return <PinPanel changed={changed === "1"} remember={remember === "1"} />;
}
