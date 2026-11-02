import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { HOLD_MS, HoldButton } from "./hold-button";

jest.mock("../theme/haptics", () => ({
  haptics: { light: jest.fn(), medium: jest.fn(), selection: jest.fn() },
}));

async function hold(mode: "hold" | "tap", ms: number) {
  const onAction = jest.fn();
  await render(<HoldButton mode={mode} label="Hold to unlock" onAction={onAction} />);
  const button = screen.getByRole("button", { name: "Hold to unlock" });
  await fireEvent(button, "pressIn", { nativeEvent: { locationX: 0, locationY: 0 } });
  await act(() => new Promise((r) => setTimeout(r, ms)));
  await fireEvent(button, "pressOut");
  return onAction;
}

describe("HoldButton", () => {
  it("sends nothing when released before 1.5 s", async () => {
    expect(await hold("hold", HOLD_MS - 50)).not.toHaveBeenCalled();
  });

  it("fires once when held for 1.5 s, even if held longer", async () => {
    expect(await hold("hold", HOLD_MS + 200)).toHaveBeenCalledTimes(1);
  });

  it("acts directly for VoiceOver users", async () => {
    const onAction = jest.fn();
    await render(<HoldButton mode="hold" label="Hold to unlock" onAction={onAction} />);
    await fireEvent(screen.getByRole("button"), "accessibilityAction", {
      nativeEvent: { actionName: "activate" },
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", async () => {
    const onAction = jest.fn();
    await render(<HoldButton mode="hold" label="Hold to unlock" onAction={onAction} disabled />);
    await fireEvent(screen.getByRole("button"), "accessibilityAction", {
      nativeEvent: { actionName: "activate" },
    });
    expect(onAction).not.toHaveBeenCalled();
  });
});
