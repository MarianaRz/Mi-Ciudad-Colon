import Ionicons from "@react-native-vector-icons/ionicons";
import { Magnetometer } from "expo-sensors";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const AZUL = "#075985";

type EstadoBrujula =
  | { fase: "comprobando" }
  | { fase: "no-disponible" }
  | { fase: "lista"; grados: number };

function calcularRumbo(x: number, y: number): number {
  const angulo = Math.atan2(y, x) * (180 / Math.PI);
  return (angulo + 360) % 360;
}

function obtenerPuntoCardinal(grados: number): string {
  const puntos = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

  const indice = Math.round(grados / 45) % 8;

  return puntos[indice];
}

export default function BrujulaTuristica() {
  const [estado, setEstado] = useState<EstadoBrujula>({
    fase: "comprobando",
  });

  useEffect(() => {
    let activo = true;
    let suscripcion: ReturnType<typeof Magnetometer.addListener> | null = null;

    async function iniciarSensor() {
      try {
        const disponible = await Magnetometer.isAvailableAsync();

        if (!activo) return;

        if (!disponible) {
          setEstado({ fase: "no-disponible" });
          return;
        }

        Magnetometer.setUpdateInterval(250);

        suscripcion = Magnetometer.addListener(({ x, y }) => {
          if (!activo) return;

          setEstado({
            fase: "lista",
            grados: calcularRumbo(x, y),
          });
        });
      } catch {
        if (activo) {
          setEstado({ fase: "no-disponible" });
        }
      }
    }

    void iniciarSensor();

    return () => {
      activo = false;
      suscripcion?.remove();
    };
  }, []);

  if (estado.fase === "comprobando") {
    return (
      <View style={styles.tarjeta}>
        <ActivityIndicator color={AZUL} />
        <Text style={styles.textoSecundario}>Comprobando brújula...</Text>
      </View>
    );
  }

  if (estado.fase === "no-disponible") {
    return (
      <View style={styles.tarjeta}>
        <Ionicons name="compass-outline" size={34} color="#94A3B8" />
        <Text style={styles.textoSecundario}>
          La brújula no está disponible en este dispositivo.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.titulo}>Brújula turística</Text>

      <View style={styles.circulo}>
        <Text style={styles.norte}>N</Text>

        <Ionicons
          name="navigate"
          size={52}
          color={AZUL}
          style={{
            transform: [{ rotate: `${-estado.grados}deg` }],
          }}
        />
      </View>

      <Text style={styles.rumbo}>{Math.round(estado.grados)}°</Text>

      <Text style={styles.textoSecundario}>
        Dirección aproximada: {obtenerPuntoCardinal(estado.grados)}
      </Text>

      <Text style={styles.advertencia}>
        La orientación puede variar por interferencias magnéticas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  titulo: {
    fontSize: 19,
    fontWeight: "700",
    color: "#17202A",
  },
  circulo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "#BAE6FD",
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  norte: {
    position: "absolute",
    top: 8,
    fontSize: 17,
    fontWeight: "700",
    color: "#B42318",
  },
  rumbo: {
    fontSize: 26,
    fontWeight: "700",
    color: AZUL,
  },
  textoSecundario: {
    fontSize: 14,
    textAlign: "center",
    color: "#64748B",
  },
  advertencia: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "#94A3B8",
  },
});
