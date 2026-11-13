import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { categoriasMock } from "../mocks/categorias";
import { useTema } from "../tema/TemaContext";
import Texto from "./ui/Texto";

interface FiltroCategoriasProps {
  categoriaSeleccionada: string | null;
  onSeleccionarCategoria: (categoriaId: string | null) => void;
}

export function FiltroCategorias({
  categoriaSeleccionada,
  onSeleccionarCategoria,
}: FiltroCategoriasProps) {
  const { colores } = useTema();

  return (
    <View style={estilos.contenedor}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.listaScroll}
      >
        {/* Chip "Todas" */}
        <Pressable
          onPress={() => onSeleccionarCategoria(null)}
          style={[
            estilos.chip,
            {
              backgroundColor:
                categoriaSeleccionada === null
                  ? colores.primarioFuerte
                  : colores.superficie,
            },
          ]}
        >
          <Texto
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: categoriaSeleccionada === null ? "#FFFFFF" : undefined,
            }}
          >
            Todas
          </Texto>
        </Pressable>

        {/* Chips de cada categoría */}
        {categoriasMock.map((cat) => {
          const activa = categoriaSeleccionada === cat.id;

          return (
            <Pressable
              key={cat.id}
              onPress={() =>
                // Si ya estaba activa, la desmarca y vuelve a mostrar todas
                onSeleccionarCategoria(activa ? null : cat.id)
              }
              style={[
                estilos.chip,
                {
                  backgroundColor: activa ? cat.color : colores.superficie,
                },
              ]}
            >
              <Ionicons
                name={cat.icono as any}
                size={15}
                color={activa ? "#FFFFFF" : cat.color}
              />
              <Texto
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: activa ? "#FFFFFF" : undefined,
                }}
              >
                {cat.nombre}
              </Texto>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  listaScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
