import {
  CheckIcon,
  HourglassIcon,
  PowerIcon,
  TrashIcon,
  WarningIcon,
  XCircleIcon,
} from "phosphor-react-native";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { settle, useReducedMotion } from "../theme/motion";
import { useTheme } from "../theme/use-theme";
import { Glass } from "./glass";
import { Text } from "./text";
import { durationOf, type ToastData, type ToastKind, toastReducer } from "./toast-queue";

type ShowArgs = {
  kind: ToastKind;
  text: string;
  /** Use for "background" results, e.g. engine auto-off. */
  icon?: "power";
  action?: { label: string; onPress: () => void };
  /** Called when the toast goes away for any reason other than its action. */
  onDismiss?: () => void;
};
type Ctx = { show: (t: ShowArgs) => void };

const ToastContext = createContext<Ctx>({ show: () => {} });

const HIDE_Y = -120;

let nextId = 1;

/**
 * Result toasts (never ongoing state — that is a banner). Top, under the island; drops in with a
 * 4 pt overshoot (Settle 400 ms); 3 s, or 5 s with an action; swipe up dismisses; a new toast replaces
 * the old one. Announced to VoiceOver. Reduce Motion: fade only.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [toast, dispatch] = useReducer(toastReducer, null);
  const extras = useRef(new Map<number, ShowArgs>());
  const y = useSharedValue(HIDE_Y);
  const o = useSharedValue(0);

  const finish = useCallback((id: number, viaAction: boolean) => {
    const args = extras.current.get(id);
    extras.current.delete(id);
    if (!viaAction) args?.onDismiss?.();
    dispatch({ type: "dismiss", id });
  }, []);

  const hide = useCallback(
    (id: number) => {
      const done = () => finish(id, false);
      if (reduced) {
        o.value = withTiming(0, { duration: 150 }, () => runOnJS(done)());
        return;
      }
      y.value = withTiming(HIDE_Y, { duration: 220, easing: settle }, () => runOnJS(done)());
    },
    [finish, reduced, o, y],
  );

  const show = useCallback((t: ShowArgs) => {
    const id = nextId++;
    // The replaced toast is gone for good: run its dismiss side effect (e.g. commit a delete).
    for (const [old, args] of extras.current) {
      args.onDismiss?.();
      extras.current.delete(old);
    }
    extras.current.set(id, t);
    dispatch({
      type: "show",
      toast: {
        id,
        kind: t.kind,
        text: t.text,
        action: t.action ? { label: t.action.label } : undefined,
      },
    });
    AccessibilityInfo.announceForAccessibility(t.action ? `${t.text}. ${t.action.label}` : t.text);
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (reduced) {
      y.value = 0;
      o.value = withTiming(1, { duration: 150 });
    } else {
      o.value = 1;
      y.value = HIDE_Y;
      y.value = withSequence(
        withTiming(4, { duration: 300, easing: settle }),
        withTiming(0, { duration: 100, easing: settle }),
      );
    }
    const id = setTimeout(() => hide(toast.id), durationOf(toast));
    return () => clearTimeout(id);
  }, [toast, reduced, hide, o, y]);

  const swipe = usePanGesture({
    runOnJS: true,
    onUpdate: (e) => {
      y.value = Math.min(0, e.translationY);
    },
    onDeactivate: (e) => {
      if (!toast) return;
      if (e.translationY < -24 || e.velocityY < -400) hide(toast.id);
      else y.value = withTiming(0, { duration: 160, easing: settle });
    },
  });

  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));

  return (
    <ToastContext value={{ show }}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 6,
            left: 16,
            right: 16,
            alignItems: "center",
          }}
        >
          <GestureDetector gesture={swipe}>
            <Animated.View style={anim}>
              <ToastView
                toast={toast}
                icon={extras.current.get(toast.id)?.icon}
                onAction={() => {
                  extras.current.get(toast.id)?.action?.onPress();
                  finish(toast.id, true);
                }}
              />
            </Animated.View>
          </GestureDetector>
        </View>
      ) : null}
    </ToastContext>
  );
}

function ToastView({
  toast,
  icon,
  onAction,
}: {
  toast: ToastData;
  icon?: "power";
  onAction: () => void;
}) {
  const { c } = useTheme();
  const tone = { success: c.acc, info: c.fg2, warn: c.warn, error: c.error, undo: c.fg2 }[
    toast.kind
  ];
  const Icon =
    icon === "power"
      ? PowerIcon
      : {
          success: CheckIcon,
          info: HourglassIcon,
          warn: WarningIcon,
          error: XCircleIcon,
          undo: TrashIcon,
        }[toast.kind];
  return (
    <Glass
      interactive
      style={{
        minHeight: 52,
        maxWidth: 380,
        paddingLeft: 10,
        paddingRight: toast.action ? 8 : 20,
        borderRadius: 26,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: c.s1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} color={tone} />
      </View>
      <Text variant="label" weight={500} style={{ flexShrink: 1 }}>
        {toast.text}
      </Text>
      {toast.action ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => ({
            height: 36,
            paddingHorizontal: 14,
            borderRadius: 18,
            justifyContent: "center",
            backgroundColor: c.s1,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text variant="label" weight={600}>
            {toast.action.label}
          </Text>
        </Pressable>
      ) : null}
    </Glass>
  );
}

export const useToast = () => useContext(ToastContext);
