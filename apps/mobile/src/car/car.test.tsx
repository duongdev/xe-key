import { render, screen } from "@testing-library/react-native";
import { Car } from "./car";

describe("Car", () => {
  it("is an image labelled with the model name", async () => {
    await render(<Car body="sedan" />);
    expect(screen.getByRole("image", { name: "Honda Civic, side view" })).toBeOnTheScreen();
  });

  it("shows unlocked and engine effects only for those confirmed states", async () => {
    const { rerender } = await render(<Car body="crossover" />);
    expect(screen.queryByTestId("car-unlocked")).toBeNull();
    expect(screen.queryByTestId("car-engine")).toBeNull();

    await rerender(<Car body="crossover" doors="unlocked" engine />);
    expect(screen.getByTestId("car-unlocked")).toBeTruthy();
    expect(screen.getByTestId("car-engine")).toBeTruthy();
  });

  it("drops state effects in the line look", async () => {
    await render(<Car body="suv" look="line" doors="unlocked" engine />);
    expect(screen.queryByTestId("car-unlocked")).toBeNull();
  });
});
