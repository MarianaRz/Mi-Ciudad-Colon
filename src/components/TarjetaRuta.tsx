// src/components/TarjetaRuta.tsx
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { useTema } from "../tema/TemaContext";
import { Lugar } from "../tipos/lugar";
import { formatearDistancia } from "../utils/distancias";
import { ResultadoRuta, abrirNavegacionExterna } from "../utils/rutas";
import Texto from "./ui/Texto";

interface TarjetaRutaProps {
  lugar: Lugar;
  ruta: ResultadoRuta;
  onCerrar: () => void;
}

export function TarjetaRuta({ lugar, ruta, onCerrar }: TarjetaRutaProps) {
  const router = useRouter();
  const { colores } = useTema();

  const manejarComoLlegar = () => {
    if (!lugar.coordenadas) return;
    abrirNavegacionExterna(
      lugar.coordenadas.latitud,
      lugar.coordenadas.longitud,
      lugar.nombre
    );
  };

  return (
    <View style={estilos.contenedor}>
      <View style={[estilos.tarjeta, { backgroundColor: colores.superficie }]}>
        {/* Fila superior: Info del destino y botón Cerrar */}
        <View style={estilos.filaSuperior}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => router.push(`/lugares/${lugar.id}` as any)}
            role="button"
            accessibilityLabel={`Ver ficha de ${lugar.nombre}`}
          >
            <View style={estilos.filaTitulo}>
              <Ionicons
                name="navigate"
                size={18}
                color={colores.primarioFuerte}
              />
              <Texto
                numberOfLines={1}
                style={{ flex: 1, fontSize: 16, fontWeight: "700" }}
              >
                {lugar.nombre}
              </Texto>
            </View>
            <Texto
              style={{
                fontSize: 13,
                color: colores.textoSecundario,
                marginTop: 4,
              }}
            >
              {formatearDistancia(ruta.distanciaMetros)} • Aprox.{" "}
              {ruta.duracionMinutos} min en auto (Tocar para ver ficha)
            </Texto>
          </Pressable>

          <Pressable
            onPress={onCerrar}
            style={[estilos.botonCerrar, { backgroundColor: colores.errorSuave }]}
            role="button"
            accessibilityLabel="Cerrar ruta"
          >
            <Ionicons name="close" size={18} color={colores.error} />
            <Texto
              style={{ color: colores.error, fontSize: 13, fontWeight: "700" }}
            >
              Cerrar
            </Texto>
          </Pressable>
        </View>

        {/* Botón inferior: Cómo llegar */}
        <Pressable
          onPress={manejarComoLlegar}
          style={[
            estilos.botonComoLlegar,
            { backgroundColor: colores.primarioFuerte },
          ]}
          role="button"
          accessibilityLabel={`Cómo llegar a ${lugar.nombre}`}
        >
          <Ionicons name="map-outline" size={18} color="#FFFFFF" />
          <Texto style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
            Cómo llegar
          </Texto>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  tarjeta: {
    padding: 16,
    borderRadius: 24,
    gap: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
  },
  filaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botonCerrar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 12,
  },
  botonComoLlegar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 20,
  },
});
