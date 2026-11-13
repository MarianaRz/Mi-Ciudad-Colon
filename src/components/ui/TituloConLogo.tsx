import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { useTema } from "../../tema/TemaContext";
import Texto from "./Texto";

const LOGO = require("../../../assets/images/android-icon-foreground.png");

interface TituloConLogoProps {
  titulo: string;
  subtitulo?: string;
}

export default function TituloConLogo({
  titulo,
  subtitulo,
}: TituloConLogoProps) {
  const { colores } = useTema();

  return (
    <View style={estilos.fila}>
      <View style={[estilos.logo, { backgroundColor: colores.primarioSuave }]}>
        <Image
          source={LOGO}
          style={estilos.imagenLogo}
          contentFit="contain"
          alt="Logo de Mi Ciudad Colón"
        />
      </View>

      <View>
        {subtitulo ? (
          <Texto
            style={[estilos.subtitulo, { color: colores.textoSecundario }]}
          >
            {subtitulo}
          </Texto>
        ) : null}
        <Texto style={estilos.titulo}>{titulo}</Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagenLogo: {
    width: 44,
    height: 44,
    transform: [{ scale: 1.2 }],
  },
  subtitulo: { fontSize: 12, lineHeight: 16 },
  titulo: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
});
