import { Text, TextProps } from "./Themed";

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: "SpaceMono" }]} />;
}

export function BoldText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, { fontFamily: "Inter_700Bold" }]} />
  );
}

export function SemiBoldText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[props.style, { fontFamily: "Inter_600SemiBold" }]}
    />
  );
}

export function MediumText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, { fontFamily: "Inter_500Medium" }]} />
  );
}
