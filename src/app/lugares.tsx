import Ionicons from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Link } from "expo-router";
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
import Texto from "../components/ui/Texto";
import { useTema } from "../tema/TemaContext";
import { fuentes } from "../tema/tipografia";
import { obtenerInfoCategoria } from "../utils/categorias";

import type { Lugar } from "../tipos/lugar";

const AZUL = "#075985";

const SOMBRA = {
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

export default function LugaresScreen() {
  const { colores } = useTema();
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
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        <>
          {/* Buscador */}
          <View
            style={[
              styles.buscador,
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
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar por nombre"
              placeholderTextColor={colores.textoSecundario}
              autoCapitalize="none"
              returnKeyType="search"
              style={[styles.input, { color: colores.texto }]}
              accessibilityLabel="Buscar lugares por nombre"
            />
            {busqueda.length > 0 && (
              <Pressable
                onPress={() => setBusqueda("")}
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

          {/* Categorías */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categorias}
            contentContainerStyle={styles.categoriasContenido}
          >
            <Chip
              etiqueta="Todas"
              icono="apps-outline"
              activo={categoriaSeleccionada === null}
              onPress={() => setCategoriaSeleccionada(null)}
            />

            {categorias.map((categoria) => (
              <Chip
                key={categoria.id}
                etiqueta={categoria.nombre}
                icono={obtenerInfoCategoria(categoria.id).icono}
                activo={categoriaSeleccionada === categoria.id}
                onPress={() => setCategoriaSeleccionada(categoria.id)}
              />
            ))}
          </ScrollView>
        </>
      }
      renderItem={({ item }) => {
        const {
          icono,
          color,
          nombre: nombreCategoria,
        } = obtenerInfoCategoria(item.categoriaId);

        return (
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
              <View style={styles.contenedorImagen}>
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

                {/* Categoría en la esquina de la foto */}
                <View
                  style={[
                    styles.etiquetaCategoria,
                    { backgroundColor: colores.superficie },
                  ]}
                >
                  <Ionicons name={icono} size={14} color={color} />
                  <Texto style={{ fontSize: 12, fontWeight: "600" }}>
                    {nombreCategoria}
                  </Texto>
                </View>
              </View>

              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text>{item.descripcionCorta}</Text>
              <Text style={styles.direccion}>{item.direccion}</Text>
            </Pressable>
          </Link>
        );
      }}
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

interface ChipProps {
  etiqueta: string;
  icono: React.ComponentProps<typeof Ionicons>["name"];
  activo: boolean;
  onPress: () => void;
}

function Chip({ etiqueta, icono, activo, onPress }: ChipProps) {
  const { colores } = useTema();

  return (
    <Pressable
      onPress={onPress}
      role="button"
      accessibilityLabel={`Filtrar por ${etiqueta}`}
      accessibilityState={{ selected: activo }}
      style={[
        styles.chip,
        {
          backgroundColor: activo ? colores.primario : colores.superficie,
          borderColor: activo ? colores.primario : colores.borde,
        },
      ]}
    >
      <Ionicons
        name={icono}
        size={16}
        color={activo ? colores.sobrePrimario : colores.primarioFuerte}
      />
      <Texto
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: activo ? colores.sobrePrimario : colores.texto,
        }}
      >
        {etiqueta}
      </Texto>
    </Pressable>
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
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
  categorias: {
    marginTop: 8,
    marginBottom: 10,
  },
  categoriasContenido: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  contenedorImagen: {
    marginBottom: 14,
  },
  imagen: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  imagenVacia: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#E8EEF3",
    alignItems: "center",
    justifyContent: "center",
  },
  etiquetaCategoria: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
