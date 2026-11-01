import { durationOf, toastReducer } from "./toast-queue";

const a = { id: 1, kind: "success" as const, text: "Locked" };
const b = { id: 2, kind: "undo" as const, text: "Deleted", action: { label: "Undo" } };

describe("toastReducer", () => {
  it("shows a toast", () => {
    expect(toastReducer(null, { type: "show", toast: a })).toBe(a);
  });

  it("replaces the current toast instead of stacking", () => {
    expect(toastReducer(a, { type: "show", toast: b })).toBe(b);
  });

  it("dismisses only the toast it was meant for (stale timers do nothing)", () => {
    expect(toastReducer(b, { type: "dismiss", id: a.id })).toBe(b);
    expect(toastReducer(b, { type: "dismiss", id: b.id })).toBeNull();
  });
});

describe("durationOf", () => {
  it("is 3 s, or 5 s when the toast has an action", () => {
    expect(durationOf(a)).toBe(3000);
    expect(durationOf(b)).toBe(5000);
  });
});
