export type ToastKind = "success" | "info" | "warn" | "error" | "undo";

export type ToastData = {
  id: number;
  kind: ToastKind;
  text: string;
  action?: { label: string };
};

export type ToastEvent = { type: "show"; toast: ToastData } | { type: "dismiss"; id: number };

/** One toast at a time: a new one replaces the old; a dismiss for an older toast is ignored. */
export function toastReducer(current: ToastData | null, e: ToastEvent): ToastData | null {
  if (e.type === "show") return e.toast;
  return current?.id === e.id ? null : current;
}

export const durationOf = (t: ToastData) => (t.action ? 5000 : 3000);
