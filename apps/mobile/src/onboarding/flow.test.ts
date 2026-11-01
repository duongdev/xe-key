import { back, next, progress } from "./flow";

describe("onboarding flow", () => {
  it("walks forward through every step to done", () => {
    const seen = ["welcome"];
    let s = next("welcome");
    while (s !== "done") {
      seen.push(s);
      s = next(s);
    }
    expect(seen).toEqual([
      "welcome",
      "region",
      "sign-in",
      "device",
      "code",
      "found",
      "style",
      "setup",
    ]);
  });

  it("goes back one step, but never back past sign-in once the car is found", () => {
    expect(back("region")).toBe("welcome");
    expect(back("code")).toBe("device");
    expect(back("found")).toBeNull();
    expect(back("setup")).toBeNull();
    expect(back("welcome")).toBeNull();
    expect(back("style")).toBe("found");
  });

  it("maps steps to the 4-segment progress bar", () => {
    expect(progress("region")).toBe(1);
    expect(progress("sign-in")).toBe(2);
    expect(progress("device")).toBe(2);
    expect(progress("code")).toBe(3);
    expect(progress("found")).toBe(4);
    expect(progress("welcome")).toBe(0);
  });
});
