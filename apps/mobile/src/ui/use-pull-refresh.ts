import { useCallback, useState } from "react";
import { haptics } from "../theme/haptics";

/**
 * Pull-to-refresh for any list: one light tap when the pull triggers (iOS gives none), and the
 * spinner shows only for the user's pull, not for background re-reads.
 */
export function usePullRefresh(refresh: () => unknown) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    haptics.light();
    setRefreshing(true);
    try {
      await refresh();
    } catch {
      // The screen shows the query's own error state.
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);
  return { refreshing, onRefresh };
}
