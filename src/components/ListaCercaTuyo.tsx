// src/components/ListaCercaTuyo.tsx
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Lugar } from "../tipos/lugar";
import { obtenerInfoCategoria } from "../utils/categorias";
import { formatearDistancia } from "../utils/distancias";

export interface LugarConDistancia extends Lugar {
  distanciaMetros: number;
}

interface ListaCercaTuyoProps {
  lugares: LugarConDistancia[];
}

export function ListaCercaTuyo({ lugares }: ListaCercaTuyoProps) {
  const router = useRouter();
  const [minimizado, setMinimizado] = useState(false);

  if (lugares.length === 0) return null;

  return (
    <View style={styles.contenedor}>
      {/* Encabezado con botón para minimizar o expandir */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setMinimizado(!minimizado)}
        activeOpacity={0.8}
      >
        <Text style={styles.tituloSeccion}>Cerca tuyo</Text>
        <View style={styles.botonMinimizar}>
          <Text style={styles.textoMinimizar}>
            {minimizado ? "Mostrar" : "Ocultar"}
          </Text>
          <Ionicons
            name={minimizado ? "chevron-up" : "chevron-down"}
            size={16}
            color="#075985"
          />
        </View>
      </TouchableOpacity>

      {/* Lista de tarjetas (solo se muestra si no está minimizada) */}
      {!minimizado &&
        lugares.map((lugar) => {
          const { icono, color } = obtenerInfoCategoria(lugar.categoriaId);

          return (
            <TouchableOpacity
              key={lugar.id}
              style={styles.tarjeta}
              onPress={() => router.push(`/lugares/${lugar.id}` as any)}
            >
              <View style={[styles.circuloIcono, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icono} size={18} color={color} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.nombreLugar} numberOfLines={1}>
                  {lugar.nombre}
                </Text>
                <Text style={styles.descLugar} numberOfLines={1}>
                  {lugar.descripcionCorta}
                </Text>
              </View>

              <Text style={styles.distancia}>
                {lugar.coordenadas ? formatearDistancia(lugar.distanciaMetros) : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tituloSeccion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  botonMinimizar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  textoMinimizar: {
    fontSize: 12,
    fontWeight: "600",
    color: "#075985",
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  circuloIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  nombreLugar: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  descLugar: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  distancia: {
    fontSize: 12,
    fontWeight: "700",
    color: "#075985",
    marginLeft: 8,
  },
});
