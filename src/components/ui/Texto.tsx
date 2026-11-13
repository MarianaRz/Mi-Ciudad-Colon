import { StyleSheet, Text, type TextProps } from "react-native";

import { useTema } from "../../tema/TemaContext";
import { fuentes } from "../../tema/tipografia";

const FAMILIAS: Record<string, string> = {
  normal: fuentes.regular,
  "400": fuentes.regular,
  "500": fuentes.media,
  "600": fuentes.semibold,
  "700": fuentes.negrita,
  bold: fuentes.negrita,
};

export default function Texto({ style, ...props }: TextProps) {
  const { colores } = useTema();
  const plano = StyleSheet.flatten(style) ?? {};
  const familia =
    FAMILIAS[String(plano.fontWeight ?? "400")] ?? fuentes.regular;

  return (
    <Text
      {...props}
      style={[
        { fontFamily: familia, color: colores.texto },
        style,
        { fontWeight: undefined },
      ]}
    />
  );
}
