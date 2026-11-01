import { done, pullDelayMs } from "./honda-command";

describe("pullDelayMs", () => {
  it("waits Honda's interval plus 3 s, like the official app", () => {
    expect(pullDelayMs({ timeOutInterval: 60000 })).toBe(63000);
    expect(pullDelayMs({ timeOutInterval: "45000" })).toBe(48000);
  });
  it("falls back to the app's 5 min when Honda sends nothing", () => {
    expect(pullDelayMs({})).toBe(303000);
    expect(pullDelayMs({ timeOutInterval: "x" })).toBe(303000);
  });
});

describe("done", () => {
  it("reads the target state from Honda's door and engine replies", () => {
    expect(done("lock", { allDoors: "Lock" })).toBe(true);
    expect(done("lock", { allDoors: "Unlock" })).toBe(false);
    expect(done("unlock", { allDoors: "UNLOCK" })).toBe(true);
    expect(done("unlock", { allDoors: "Open" })).toBe(true);
    expect(done("start", { engine: true })).toBe(true);
    expect(done("stop", { engine: false })).toBe(true);
    expect(done("stop", {})).toBe(false);
  });
  it("cannot tell an extend from the status, so waits for the result", () => {
    expect(done("extend", { engine: true })).toBe(false);
  });
});
