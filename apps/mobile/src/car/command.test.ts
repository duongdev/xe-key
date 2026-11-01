import { type Command, commandReducer, IDLE, MAX_RETRIES } from "./command";

const run = (...events: Parameters<typeof commandReducer>[1][]) =>
  events.reduce(commandReducer, IDLE);

describe("commandReducer", () => {
  it("walks sent → accepted → confirmed", () => {
    expect(run({ type: "send", kind: "unlock" })).toEqual({
      status: "sent",
      kind: "unlock",
      attempt: 0,
    });
    expect(run({ type: "send", kind: "unlock" }, { type: "accepted" }).status).toBe("accepted");
    expect(
      run({ type: "send", kind: "unlock" }, { type: "accepted" }, { type: "confirmed" }),
    ).toEqual({
      status: "confirmed",
      kind: "unlock",
      attempt: 0,
    });
  });

  it("counts retries while the car is asleep and stays queued", () => {
    const s = run(
      { type: "send", kind: "lock" },
      { type: "accepted" },
      { type: "asleep" },
      { type: "asleep" },
    );
    expect(s).toEqual({ status: "retrying", kind: "lock", attempt: 2 });
    expect(commandReducer(s, { type: "confirmed" }).status).toBe("confirmed");
  });

  it("fails after the last retry, nothing changed", () => {
    const events = Array.from({ length: MAX_RETRIES + 1 }, () => ({ type: "asleep" }) as const);
    const s = run({ type: "send", kind: "lock" }, ...events);
    expect(s).toEqual({ status: "failed", kind: "lock", attempt: MAX_RETRIES });
  });

  it("fails at once on a hard error", () => {
    expect(run({ type: "send", kind: "lock" }, { type: "failed" }).status).toBe("failed");
  });

  it("ignores a second send while one is in flight", () => {
    const s = run({ type: "send", kind: "unlock" }, { type: "send", kind: "lock" });
    expect(s).toEqual({ status: "sent", kind: "unlock", attempt: 0 });
  });

  it("allows a new send after confirmed or failed (try again)", () => {
    const failed = run({ type: "send", kind: "lock" }, { type: "failed" });
    expect(commandReducer(failed, { type: "send", kind: "lock" }).status).toBe("sent");
  });

  it("ignores progress events when idle and resets on reset", () => {
    expect(run({ type: "accepted" })).toBe(IDLE);
    expect(run({ type: "send", kind: "lock" }, { type: "reset" })).toBe(IDLE);
  });

  it("does not move backwards from accepted to sent", () => {
    const s: Command = { status: "retrying", kind: "lock", attempt: 1 };
    expect(commandReducer(s, { type: "accepted" })).toBe(s);
  });
});
