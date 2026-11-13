import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTema } from "../../tema/TemaContext";
import Texto from "./Texto";

interface PantallaCargaProps {
  titulo: string;
  detalle?: string;
}

export default function PantallaCarga({ titulo, detalle }: PantallaCargaProps) {
  const { colores } = useTema();

  return (
    <View
      style={[estilos.pantalla, { backgroundColor: colores.fondo }]}
      accessibilityRole="progressbar"
      accessibilityLabel={titulo}
    >
      <View style={[estilos.halo, { backgroundColor: colores.primarioSuave }]}>
        <View
          style={[
            estilos.circulo,
            { backgroundColor: colores.superficie, borderColor: colores.borde },
          ]}
        >
          <ActivityIndicator size="large" color={colores.primarioFuerte} />
        </View>
      </View>

      <Texto style={estilos.titulo}>{titulo}</Texto>

      {detalle ? (
        <Texto style={[estilos.detalle, { color: colores.textoSecundario }]}>
          {detalle}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  halo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  detalle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
