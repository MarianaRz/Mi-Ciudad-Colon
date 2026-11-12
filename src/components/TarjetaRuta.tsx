// src/components/TarjetaRuta.tsx
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Lugar } from "../tipos/lugar";
import { formatearDistancia } from "../utils/distancias";
import { ResultadoRuta } from "../utils/rutas";

interface TarjetaRutaProps {
  lugar: Lugar;
  ruta: ResultadoRuta;
  onCerrar: () => void;
}

export function TarjetaRuta({ lugar, ruta, onCerrar }: TarjetaRutaProps) {
  const router = useRouter();

  return (
    <View style={styles.contenedor}>
      <View style={styles.tarjeta}>
        {/* Info del destino y distancia */}
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => router.push(`/lugares/${lugar.id}` as any)}
        >
          <View style={styles.filaTitulo}>
            <Ionicons name="navigate" size={16} color="#075985" />
            <Text style={styles.titulo} numberOfLines={1}>
              {lugar.nombre}
            </Text>
          </View>
          <Text style={styles.subtitulo}>
            {formatearDistancia(ruta.distanciaMetros)} • Aprox.{" "}
            {ruta.duracionMinutos} min en auto (Tocar para ver ficha)
          </Text>
        </TouchableOpacity>

        {/* Botón Cerrar bien visible */}
        <TouchableOpacity onPress={onCerrar} style={styles.botonCerrar}>
          <Ionicons name="close" size={18} color="#B91C1C" />
          <Text style={styles.textoCerrar}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  subtitulo: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },
  botonCerrar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 10,
  },
  textoCerrar: {
    color: "#B91C1C",
    fontWeight: "700",
    fontSize: 13,
  },
});
