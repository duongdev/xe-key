import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/use-theme";
import { Text } from "./text";

type Toast = {
  text: string;
  action?: { label: string; onPress: () => void };
  onDismiss?: () => void;
};
type Ctx = { show: (t: Toast) => void };

const ToastContext = createContext<Ctx>({ show: () => {} });

const MS = 3000;
const MS_WITH_ACTION = 5000;

// ponytail: minimal toast (single, top). Task 009 adds motion, swipe-up and the full kinds.
export function ToastProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback((t: Toast | null) => {
    if (timer.current) clearTimeout(timer.current);
    t?.onDismiss?.();
    setToast(null);
  }, []);

  const show = useCallback((t: Toast) => {
    setToast((prev) => {
      if (timer.current) clearTimeout(timer.current);
      prev?.onDismiss?.();
      return t;
    });
    AccessibilityInfo.announceForAccessibility(t.text);
  }, []);

  useEffect(() => {
    if (!toast) return;
    timer.current = setTimeout(() => close(toast), toast.action ? MS_WITH_ACTION : MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast, close]);

  return (
    <ToastContext value={{ show }}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 16,
            right: 16,
            alignItems: "center",
          }}
        >
          <View
            accessibilityLiveRegion="polite"
            style={{
              minHeight: 48,
              paddingLeft: 18,
              paddingRight: toast.action ? 6 : 18,
              borderRadius: 24,
              backgroundColor: c.s2,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Text variant="label">{toast.text}</Text>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.onPress();
                  if (timer.current) clearTimeout(timer.current);
                  setToast(null);
                }}
                style={{
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 18,
                  justifyContent: "center",
                  backgroundColor: c.s1,
                }}
              >
                <Text variant="label" weight={600} color="acc">
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ToastContext>
  );
}

export const useToast = () => useContext(ToastContext);
