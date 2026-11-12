import { Image } from "expo-image";
import { View } from "react-native";

import { useTema } from "../../tema/TemaContext";

const LOGO = require("../../../assets/images/android-icon-foreground.png");

export default function Logo({ tamano = 44 }: { tamano?: number }) {
  const { colores } = useTema();

  return (
    <View
      style={{
        width: tamano,
        height: tamano,
        borderRadius: tamano * 0.32,
        backgroundColor: colores.primarioSuave,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Image
        source={LOGO}
        style={{
          width: tamano,
          height: tamano,
          transform: [{ scale: 1.2 }],
        }}
        contentFit="contain"
        alt="Logo de Mi Ciudad Colón"
      />
    </View>
  );
}
