import { Image } from "expo-image";
import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { obtenerCategoriasApi } from "../api/categorias";
import { obtenerLugaresApi } from "../api/lugares";

import type { Lugar } from "../tipos/lugar";

const AZUL = "#075985";

export default function LugaresScreen() {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null);

  const consultaLugares = useQuery({
    queryKey: ["lugares"],
    queryFn: obtenerLugaresApi,
  });

  const consultaCategorias = useQuery({
    queryKey: ["categorias"],
    queryFn: obtenerCategoriasApi,
  });

  const cargando = consultaLugares.isPending || consultaCategorias.isPending;

  const hayError = consultaLugares.isError || consultaCategorias.isError;

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={AZUL} />
        <Text style={styles.textoSecundario}>Cargando lugares...</Text>
      </View>
    );
  }

  if (hayError) {
    return (
      <View style={styles.centro}>
        <Text style={styles.errorTitulo}>No pudimos cargar los lugares.</Text>

        <Text style={styles.textoSecundario}>
          Comprobá tu conexión e intentá nuevamente.
        </Text>

        <Pressable
          style={styles.botonReintentar}
          onPress={() => {
            void consultaLugares.refetch();
            void consultaCategorias.refetch();
          }}
          accessibilityRole="button"
          accessibilityLabel="Reintentar carga de lugares"
        >
          <Text style={styles.botonReintentarTexto}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const lugares = consultaLugares.data?.datos ?? [];
  const categorias = consultaCategorias.data?.datos ?? [];

  const lugaresFiltrados = lugares.filter((lugar: Lugar) => {
    const coincideNombre = lugar.nombre
      .toLowerCase()
      .includes(busqueda.trim().toLowerCase());

    const coincideCategoria =
      categoriaSeleccionada === null ||
      lugar.categoriaId === categoriaSeleccionada;

    return coincideNombre && coincideCategoria;
  });

  return (
    <FlatList
      data={lugaresFiltrados}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        <>
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre"
            placeholderTextColor="#7C8792"
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.buscador}
            accessibilityLabel="Buscar lugares por nombre"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categorias}
          >
            <Pressable
              onPress={() => setCategoriaSeleccionada(null)}
              style={[
                styles.chip,
                categoriaSeleccionada === null && styles.chipActivo,
              ]}
            >
              <Text
                style={[
                  styles.textoChip,
                  categoriaSeleccionada === null && styles.textoChipActivo,
                ]}
              >
                Todas
              </Text>
            </Pressable>

            {categorias.map((categoria) => (
              <Pressable
                key={categoria.id}
                onPress={() => setCategoriaSeleccionada(categoria.id)}
                style={[
                  styles.chip,
                  categoriaSeleccionada === categoria.id && styles.chipActivo,
                ]}
              >
                <Text
                  style={[
                    styles.textoChip,
                    categoriaSeleccionada === categoria.id &&
                      styles.textoChipActivo,
                  ]}
                >
                  {categoria.nombre}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      }
      renderItem={({ item }) => (
        <Link
          href={{
            pathname: "/lugares/[id]",
            params: { id: item.id },
          }}
          asChild
        >
          <Pressable
            style={styles.tarjeta}
            role="button"
            accessibilityLabel={`Ver detalle de ${item.nombre}`}
          >
            {item.imagenes.length > 0 ? (
              <Image
                source={{ uri: item.imagenes[0] }}
                style={styles.imagen}
                contentFit="cover"
                transition={200}
                alt={`Imagen de ${item.nombre}`}
              />
            ) : (
              <View style={styles.imagenVacia}>
                <Text>Sin imagen disponible</Text>
              </View>
            )}

            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text>{item.descripcionCorta}</Text>
            <Text style={styles.direccion}>{item.direccion}</Text>
          </Pressable>
        </Link>
      )}
      ListEmptyComponent={
        <View style={styles.vacio}>
          <Text style={styles.vacioTitulo}>
            {lugares.length === 0
              ? "No hay lugares disponibles"
              : "No encontramos resultados"}
          </Text>

          {lugares.length > 0 && (
            <Text style={styles.vacioTexto}>
              Probá con otro nombre o seleccioná otra categoría.
            </Text>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    flexGrow: 1,
    padding: 16,
    gap: 14,
    backgroundColor: "#F8FAFC",
  },
  buscador: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#17202A",
    marginBottom: 8,
  },
  categorias: {
    marginTop: 8,
    marginBottom: 10,
  },
  chip: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AZUL,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    marginRight: 8,
  },
  chipActivo: {
    backgroundColor: AZUL,
  },
  textoChip: {
    color: AZUL,
    fontSize: 15,
    fontWeight: "600",
  },
  textoChipActivo: {
    color: "#FFFFFF",
  },
  tarjeta: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  imagen: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 14,
  },
  imagenVacia: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: "#E8EEF3",
    alignItems: "center",
    justifyContent: "center",
  },
  nombre: {
    fontSize: 20,
    fontWeight: "700",
    color: "#17202A",
    marginBottom: 6,
  },
  direccion: {
    marginTop: 10,
    color: "#5F6B76",
    fontSize: 14,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#F8FAFC",
  },
  textoSecundario: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
  },
  errorTitulo: {
    fontSize: 19,
    fontWeight: "700",
    color: "#B42318",
    textAlign: "center",
  },
  botonReintentar: {
    backgroundColor: AZUL,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  botonReintentarTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  vacio: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  vacioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
    textAlign: "center",
  },
  vacioTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5F6B76",
    textAlign: "center",
  },
});
