import * as Haptics from "expo-haptics";

/**
 * One haptic per user action, only when something changed. iOS mutes these when the user
 * turns System Haptics off. Native controls (Switch, keyboard) bring their own; don't add more.
 */
export const haptics = {
  /** Finger down on a Button (not links or rows); a pull that triggers a refresh. */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** A hold-to-arm action is armed. */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  /** A discrete value changed: radio pick, carousel page, slider or scrub stop. */
  selection: () => Haptics.selectionAsync(),
  /** Final good result the user waited for: code verified, command confirmed. */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  /** Final failure of the user's own action. Never for background retries. */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
