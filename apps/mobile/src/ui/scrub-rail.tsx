import { type ReactNode, useRef, useState } from "react";
import { type AccessibilityActionEvent, View, type ViewStyle } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { haptics } from "../theme/haptics";
import { stopAt } from "./stops";

type Props = {
  count: number;
  value: number;
  onChange: (i: number) => void;
  label: string;
  valueText: string;
  /** Called while the finger is down so stops can grow under it. */
  onScrub?: (active: boolean) => void;
  style?: ViewStyle;
  children: (width: number) => ReactNode;
};

/**
 * Pick one of `count` stops by touching or dragging along the rail. Value changes live under
 * the finger with a selection tick per stop; VoiceOver adjusts it by swiping up/down.
 */
export function ScrubRail({
  count,
  value,
  onChange,
  label,
  valueText,
  onScrub,
  style,
  children,
}: Props) {
  const [width, setWidth] = useState(0);
  const last = useRef(value);
  last.current = value;

  const pick = (x: number) => {
    const i = stopAt(x, width, count);
    if (i !== last.current) {
      last.current = i;
      haptics.selection();
      onChange(i);
    }
  };

  const pan = usePanGesture({
    minDistance: 0,
    runOnJS: true,
    onBegin: (e) => {
      onScrub?.(true);
      pick(e.x);
    },
    onUpdate: (e) => pick(e.x),
    onFinalize: () => onScrub?.(false),
  });

  const onAction = (e: AccessibilityActionEvent) => {
    const step = e.nativeEvent.actionName === "increment" ? 1 : -1;
    const i = Math.min(count - 1, Math.max(0, value + step));
    if (i !== value) onChange(i);
  };

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: count - 1, now: value, text: valueText }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={onAction}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={style}
      >
        {width > 0 ? children(width) : null}
      </View>
    </GestureDetector>
  );
}
