import * as Haptics from "expo-haptics";

/**
 * Haptic kinds per design/HANDOFF.md › Tokens › Haptics. One per moment, fired at the change
 * (touch down, threshold, new stop), never on lift, only on change. Shared components own these;
 * a screen calls them only for a flow no component covers, with a `haptics:` comment (a test
 * checks this). Native and glass controls bring their own. iOS System Haptics off mutes all.
 */
export const haptics = {
  /** Touch down on a solid button (pairs with the glass press); pull-to-refresh threshold. */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** A hold-to-arm action is armed. */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  /** A step changed under the finger: stop, tab, page, swipe threshold, hold start and progress. */
  selection: () => Haptics.selectionAsync(),
  /** Final good result the user waited for: code verified, command confirmed. */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  /** Final failure of the user's own action. Never for background retries. */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
