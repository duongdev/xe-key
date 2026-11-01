import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { AcLevel, CancelToken } from "../services/car";
import { CAR_KEY, carService } from "../services/query";
import { haptics } from "../theme/haptics";
import { type CommandKind, commandReducer, IDLE, inFlight } from "./command";

const DONE_MS = 2600;

/** Runs one command at a time; the car picture changes only via the confirmed snapshot. */
export function useCommand() {
  const qc = useQueryClient();
  const [state, dispatch] = useReducer(commandReducer, IDLE);
  const token = useRef<CancelToken | null>(null);

  useEffect(() => {
    if (state.status === "confirmed") {
      haptics.success();
      const id = setTimeout(() => dispatch({ type: "reset" }), DONE_MS);
      return () => clearTimeout(id);
    }
    if (state.status === "failed") haptics.warning();
  }, [state.status]);

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
        if (car) qc.setQueryData(CAR_KEY, car);
        else dispatch({ type: "failed" });
      } catch (e) {
        if (mine.cancelled) return;
        console.warn("command failed", kind, e);
        dispatch({ type: "failed" });
      }
    },
    [state, qc],
  );

  /** Stops waiting for a pending command. The live adapter must also call Honda's cancel endpoint. */
  const cancel = useCallback(() => {
    if (token.current) token.current.cancelled = true;
    dispatch({ type: "reset" });
  }, []);

  return { state, send, cancel };
}
