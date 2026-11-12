import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    type PressableProps,
} from "react-native";

import { useTema } from "../../tema/TemaContext";
import Texto from "./Texto";

type Variante = "primario" | "secundario" | "texto";

interface BotonProps extends Omit<PressableProps, "children" | "style"> {
  titulo: string;
  variante?: Variante;
  cargando?: boolean;
}

export default function Boton({
  titulo,
  variante = "primario",
  cargando = false,
  disabled,
  accessibilityLabel,
  ...resto
}: BotonProps) {
  const { colores } = useTema();
  const inactivo = Boolean(disabled) || cargando;

  const fondo =
    variante === "primario"
      ? colores.primario
      : variante === "secundario"
        ? colores.primarioSuave
        : "transparent";

  const colorTexto =
    variante === "primario" ? colores.sobrePrimario : colores.primarioFuerte;

  return (
    <Pressable
      {...resto}
      disabled={inactivo}
      role="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }) => [
        estilos.base,
        {
          backgroundColor: fondo,
          opacity: inactivo ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <Texto style={[estilos.texto, { color: colorTexto }]}>{titulo}</Texto>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: { fontSize: 16, fontWeight: "700" },
});
