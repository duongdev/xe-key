import { badgeText } from "./ui/glass-tabs";

test("badgeText hides zero, caps at 9+", () => {
  expect(badgeText(0)).toBeNull();
  expect(badgeText(undefined)).toBeNull();
  expect(badgeText(1)).toBe("1");
  expect(badgeText(9)).toBe("9");
  expect(badgeText(10)).toBe("9+");
});
