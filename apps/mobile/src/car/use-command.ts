import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useT } from "../i18n";
import type { AcLevel, CancelToken } from "../services/car";
import { CAR_KEY, carService } from "../services/query";
import { haptics } from "../theme/haptics";
import { useToast } from "../ui/toast";
import { type CommandKind, commandReducer, IDLE, inFlight } from "./command";

/** Runs one command at a time; the car picture changes only via the confirmed snapshot. */
export function useCommand() {
  const qc = useQueryClient();
  const [state, dispatch] = useReducer(commandReducer, IDLE);
  const token = useRef<CancelToken | null>(null);
  const toast = useToast();
  const t = useT();
  const resend = useRef<(kind: CommandKind) => void>(() => {});

  // Results go to a toast; screens show only the pending steps.
  useEffect(() => {
    if (state.status === "confirmed") {
      haptics.success();
      toast.show({ kind: "success", text: t.resultText[state.kind] });
      dispatch({ type: "reset" });
    }
    if (state.status === "failed") {
      haptics.warning();
      const kind = state.kind;
      // Physical commands (unlock, start, extend) are never resent by a tap; the user holds again.
      const safe = kind === "lock" || kind === "stop" || kind === "find";
      toast.show({
        kind: "error",
        text: t.notReached,
        action: safe ? { label: t.retry, onPress: () => resend.current(kind) } : undefined,
      });
      dispatch({ type: "reset" });
    }
  }, [state, toast, t]);

  const send = useCallback(
    async (kind: CommandKind, opts?: { ac?: AcLevel }) => {
      if (inFlight(state)) return;
      const mine: CancelToken = { cancelled: false };
      token.current = mine;
      // Events from a cancelled command must not move the UI.
      const report: typeof dispatch = (e) => {
        if (!mine.cancelled) dispatch(e);
      };
      dispatch({ type: "send", kind });
      try {
        const car = await carService.command(kind, report, { ...opts, cancel: mine });
        if (mine.cancelled) return;
        if (car) {
          // A background re-read started before the command would land later with the old state.
          await qc.cancelQueries({ queryKey: CAR_KEY });
          qc.setQueryData(CAR_KEY, { ...car, confirmedAt: Date.now() });
        } else dispatch({ type: "failed" });
      } catch (e) {
        if (mine.cancelled) return;
        console.warn("command failed", kind, e);
        dispatch({ type: "failed" });
      }
    },
    [state, qc],
  );

  resend.current = (kind) => send(kind);

  /** Stops waiting for a pending command. The live adapter must also call Honda's cancel endpoint. */
  const cancel = useCallback(() => {
    if (token.current) token.current.cancelled = true;
    dispatch({ type: "reset" });
  }, []);

  return { state, send, cancel };
}
