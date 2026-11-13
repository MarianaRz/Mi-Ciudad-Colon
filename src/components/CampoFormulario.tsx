import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { useTema } from "../tema/TemaContext";
import { fuentes } from "../tema/tipografia";
import Texto from "./ui/Texto";

interface CampoFormularioProps extends TextInputProps {
  etiqueta: string;
  error?: string;
}

export function CampoFormulario({
  etiqueta,
  error,
  style,
  onFocus,
  onBlur,
  ...resto
}: CampoFormularioProps) {
  const { colores } = useTema();
  const [enfocado, setEnfocado] = useState(false);

  const colorBorde = error
    ? colores.error
    : enfocado
      ? colores.primarioFuerte
      : colores.borde;

  return (
    <View style={estilos.campo}>
      <Texto style={estilos.etiqueta}>{etiqueta}</Texto>

      <TextInput
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel={etiqueta}
        {...resto}
        onFocus={(evento) => {
          setEnfocado(true);
          onFocus?.(evento);
        }}
        onBlur={(evento) => {
          setEnfocado(false);
          onBlur?.(evento);
        }}
        style={[
          estilos.input,
          {
            borderColor: colorBorde,
            backgroundColor: colores.superficie,
            color: colores.texto,
          },
          style,
        ]}
      />

      {error ? (
        <Texto style={[estilos.error, { color: colores.error }]}>{error}</Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: { gap: 8 },
  etiqueta: { fontSize: 14, fontWeight: "600" },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fuentes.regular,
    fontSize: 16,
  },
  error: { fontSize: 13, lineHeight: 18 },
});
