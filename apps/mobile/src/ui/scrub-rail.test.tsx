import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScrubRail } from "./scrub-rail";

jest.mock("../theme/haptics", () => ({ haptics: { selection: jest.fn() } }));

function setup(value: number) {
  const onChange = jest.fn();
  return {
    onChange,
    view: render(
      <GestureHandlerRootView>
        <ScrubRail count={3} value={value} onChange={onChange} label="Style" valueText="Line">
          {() => <Text>rail</Text>}
        </ScrubRail>
      </GestureHandlerRootView>,
    ),
  };
}

describe("ScrubRail", () => {
  it("is adjustable with its value text", async () => {
    await setup(1).view;
    expect(screen.getByRole("adjustable", { name: "Style" })).toHaveAccessibilityValue({
      now: 1,
      text: "Line",
    });
  });

  it("steps up and down with VoiceOver and stops at the ends", async () => {
    const { onChange, view } = setup(2);
    await view;
    const rail = screen.getByRole("adjustable");
    fireEvent(rail, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent(rail, "accessibilityAction", { nativeEvent: { actionName: "decrement" } });
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
