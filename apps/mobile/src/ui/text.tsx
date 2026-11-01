import { Text as RNText, type TextProps } from "react-native";
import { type Colors, type TextVariant, textStyle, type Weight } from "../theme/tokens";
import { useTheme } from "../theme/use-theme";

type Props = TextProps & { variant?: TextVariant; weight?: Weight; color?: keyof Colors };

export function Text({ variant = "body", weight, color = "fg", style, ...rest }: Props) {
  const { c } = useTheme();
  return <RNText {...rest} style={[textStyle(variant, weight), { color: c[color] }, style]} />;
}
