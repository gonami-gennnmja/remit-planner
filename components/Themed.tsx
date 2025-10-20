import { useTheme } from "@/contexts/ThemeContext";
import { Text as DefaultText, View as DefaultView } from "react-native";

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & DefaultView["props"];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ReturnType<typeof useTheme>["colors"]
) {
  const { colors, isDark } = useTheme();
  const colorFromProps = isDark ? props.dark : props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return colors[colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { colors, isDark } = useTheme();
  const color = isDark ? darkColor || colors.text : lightColor || colors.text;

  return (
    <DefaultText
      style={[{ color, fontFamily: "Inter_400Regular" }, style]}
      {...otherProps}
    />
  );
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { colors, isDark } = useTheme();
  const backgroundColor = isDark
    ? darkColor || colors.background
    : lightColor || colors.background;

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
