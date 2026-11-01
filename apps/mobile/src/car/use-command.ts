import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer } from "react";
import { CAR_KEY, carService } from "../services/query";
import { haptics } from "../theme/haptics";
import { type CommandKind, commandReducer, IDLE, inFlight } from "./command";

const DONE_MS = 2600;

/** Runs one command at a time; the car picture changes only via the confirmed snapshot. */
export function useCommand() {
  const qc = useQueryClient();
  const [state, dispatch] = useReducer(commandReducer, IDLE);

  useEffect(() => {
    if (state.status === "confirmed") {
      haptics.success();
      const id = setTimeout(() => dispatch({ type: "reset" }), DONE_MS);
      return () => clearTimeout(id);
    }
    if (state.status === "failed") haptics.warning();
  }, [state.status]);

  const send = useCallback(
    async (kind: CommandKind) => {
      if (inFlight(state)) return;
      dispatch({ type: "send", kind });
      try {
        const car = await carService.command(kind, dispatch);
        if (car) qc.setQueryData(CAR_KEY, car);
        else dispatch({ type: "failed" });
      } catch (e) {
        console.warn("command failed", kind, e);
        dispatch({ type: "failed" });
      }
    },
    [state, qc],
  );

  return { state, send, reset: () => dispatch({ type: "reset" }) };
}
