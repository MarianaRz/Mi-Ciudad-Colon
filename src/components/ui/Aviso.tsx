import Ionicons from "@react-native-vector-icons/ionicons";
import { StyleSheet, View } from "react-native";

import { useTema } from "../../tema/TemaContext";
import Texto from "./Texto";

type Tipo = "error" | "exito" | "info";

const ICONOS = {
  error: "alert-circle",
  exito: "checkmark-circle",
  info: "information-circle",
} as const;

interface AvisoProps {
  mensaje: string;
  tipo?: Tipo;
}

export default function Aviso({ mensaje, tipo = "error" }: AvisoProps) {
  const { colores } = useTema();

  const paleta = {
    error: { fondo: colores.errorSuave, texto: colores.error },
    exito: { fondo: colores.exitoSuave, texto: colores.exito },
    info: { fondo: colores.primarioSuave, texto: colores.primarioFuerte },
  }[tipo];

  return (
    <View
      style={[estilos.caja, { backgroundColor: paleta.fondo }]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={ICONOS[tipo]} size={20} color={paleta.texto} />
      <Texto style={[estilos.texto, { color: paleta.texto }]}>{mensaje}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  texto: { flex: 1, fontSize: 14, lineHeight: 20 },
});
