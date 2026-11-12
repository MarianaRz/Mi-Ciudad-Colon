// src/components/BuscadorMapa.tsx
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";

import { useTema } from "../tema/TemaContext";
import { fuentes } from "../tema/tipografia";
import { Lugar } from "../tipos/lugar";
import { obtenerInfoCategoria } from "../utils/categorias";
import Texto from "./ui/Texto";

interface BuscadorMapaProps {
  lugares: Lugar[];
  onSeleccionarLugar: (lugar: Lugar) => void;
  onCambiarEstadoBusqueda: (estaBuscando: boolean) => void;
}

const SOMBRA = {
  shadowColor: "#000",
  shadowOpacity: 0.14,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
} as const;

export function BuscadorMapa({
  lugares,
  onSeleccionarLugar,
  onCambiarEstadoBusqueda,
}: BuscadorMapaProps) {
  const router = useRouter();
  const { colores } = useTema();
  const [busqueda, setBusqueda] = useState("");

  const textoLimpio = busqueda.trim().toLowerCase();

  const lugaresFiltrados = lugares.filter((lugar) =>
    lugar.nombre.toLowerCase().includes(textoLimpio),
  );

  const manejarCambioTexto = (texto: string) => {
    setBusqueda(texto);
    // Avisamos al mapa si hay texto para ocultar "Cerca tuyo"
    onCambiarEstadoBusqueda(texto.trim().length > 0);
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    onCambiarEstadoBusqueda(false);
    Keyboard.dismiss();
  };

  return (
    <View style={estilos.contenedor}>
      {/* Fila principal: buscador + botón "Ver todas" */}
      <View style={estilos.filaSuperior}>
        <View
          style={[
            estilos.cajaInput,
            SOMBRA,
            { backgroundColor: colores.superficie },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colores.textoSecundario}
          />
          <TextInput
            style={[estilos.input, { color: colores.texto }]}
            placeholder="Buscar lugares"
            placeholderTextColor={colores.textoSecundario}
            accessibilityLabel="Buscar lugares"
            value={busqueda}
            onChangeText={manejarCambioTexto}
            onFocus={() => onCambiarEstadoBusqueda(true)}
          />
          {busqueda.length > 0 && (
            <Pressable
              onPress={limpiarBusqueda}
              hitSlop={12}
              role="button"
              accessibilityLabel="Borrar búsqueda"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colores.textoSecundario}
              />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[
            estilos.botonTodas,
            SOMBRA,
            { backgroundColor: colores.primario },
          ]}
          onPress={() => router.push("/lugares" as any)}
          role="button"
          accessibilityLabel="Ver todos los lugares"
        >
          <Texto
            style={{
              color: colores.sobrePrimario,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            Ver todas
          </Texto>
        </Pressable>
      </View>

      {/* Cartelito con las coincidencias */}
      {textoLimpio.length > 0 && (
        <View
          style={[
            estilos.listaSugerencias,
            SOMBRA,
            { backgroundColor: colores.superficie },
          ]}
        >
          {lugaresFiltrados.length === 0 ? (
            <Texto
              style={{
                padding: 16,
                color: colores.textoSecundario,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              No se encontraron lugares con "{busqueda}"
            </Texto>
          ) : (
            lugaresFiltrados.slice(0, 5).map((lugar, indice) => {
              const { icono, color } = obtenerInfoCategoria(lugar.categoriaId);
              return (
                <Pressable
                  key={lugar.id}
                  style={[
                    estilos.itemSugerencia,
                    indice > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colores.borde,
                    },
                  ]}
                  onPress={() => {
                    setBusqueda("");
                    onCambiarEstadoBusqueda(false);
                    Keyboard.dismiss();
                    onSeleccionarLugar(lugar);
                  }}
                  role="button"
                  accessibilityLabel={`Ir a ${lugar.nombre}`}
                >
                  <View
                    style={[
                      estilos.circuloIcono,
                      { backgroundColor: `${color}20` },
                    ]}
                  >
                    <Ionicons name={icono} size={18} color={color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Texto
                      numberOfLines={1}
                      style={{ fontSize: 15, fontWeight: "700" }}
                    >
                      {lugar.nombre}
                    </Texto>
                    <Texto
                      numberOfLines={1}
                      style={{ fontSize: 13, color: colores.textoSecundario }}
                    >
                      {lugar.descripcionCorta}
                    </Texto>
                  </View>

                  <Ionicons
                    name="navigate-outline"
                    size={20}
                    color={colores.primarioFuerte}
                  />
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cajaInput: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
  botonTodas: {
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  listaSugerencias: {
    marginTop: 10,
    borderRadius: 24,
    paddingVertical: 6,
    overflow: "hidden",
  },
  itemSugerencia: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  circuloIcono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
