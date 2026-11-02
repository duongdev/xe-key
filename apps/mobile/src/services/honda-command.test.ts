import { done, logged, pullDelayMs, reasonText } from "./honda-command";

describe("pullDelayMs", () => {
  it("gives horn and lights at least 30 s, like the official app", () => {
    expect(pullDelayMs({ timeOutInterval: 5000 }, "lights")).toBe(33000);
    expect(pullDelayMs({ timeOutInterval: 60000 }, "horn")).toBe(63000);
    expect(pullDelayMs({}, "horn")).toBe(33000);
  });

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

describe("logged", () => {
  // Honda logs horn / lights results as command messages (live 2026-11-02: "Đèn đã bật").
  const msg = (at: number, ok: boolean, kind: "command" | "diagnosis" = "command") => ({
    id: String(at),
    kind,
    at,
    unread: false,
    ok,
  });
  it("is the first command result logged after the send", () => {
    expect(logged([msg(5000, true), msg(900, false)], 1000)?.ok).toBe(true);
    expect(logged([msg(7000, true), msg(5000, false)], 1000)?.ok).toBe(false);
  });
  it("waits while nothing new is logged", () => {
    expect(logged([msg(900, true), msg(5000, true, "diagnosis")], 1000)).toBeNull();
  });
});

describe("reasonText", () => {
  it("drops Honda's code prefix", () => {
    expect(reasonText("W101: Thao tác này không thể thực hiện khi xe đang nổ máy.")).toBe(
      "Thao tác này không thể thực hiện khi xe đang nổ máy.",
    );
    expect(reasonText("Thao tác này không thể thực hiện.")).toBe(
      "Thao tác này không thể thực hiện.",
    );
    expect(reasonText("")).toBeNull();
  });
});
