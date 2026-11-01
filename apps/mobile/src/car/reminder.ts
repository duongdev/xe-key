import * as Notifications from "expo-notifications";

const ID = "engine-off-reminder";

/** Local notification 1 min before auto-off. Asks for permission only now, when the user wants it. */
export async function remindBeforeOff(
  endsAt: number,
  title: string,
  body: string,
): Promise<boolean> {
  const at = endsAt - 60_000;
  if (at <= Date.now()) return false;
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
  });
  return true;
}

export function cancelReminder(): Promise<void> {
  return Notifications.cancelScheduledNotificationAsync(ID);
}
