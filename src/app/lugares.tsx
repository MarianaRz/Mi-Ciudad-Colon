import Ionicons from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";

import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { obtenerCategoriasApi } from "../api/categorias";
import { obtenerLugaresApi } from "../api/lugares";
import Boton from "../components/ui/Boton";
import PantallaCarga from "../components/ui/PantallaCarga";
import Texto from "../components/ui/Texto";
import { useTema } from "../tema/TemaContext";
import { fuentes } from "../tema/tipografia";
import { obtenerInfoCategoria } from "../utils/categorias";

import type { Lugar } from "../tipos/lugar";

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
    return <PantallaCarga titulo="Cargando lugares..." />;
  }

  if (hayError) {
    return (
      <View style={[styles.centro, { backgroundColor: colores.fondo }]}>
        <View
          style={[
            styles.circuloEstado,
            { backgroundColor: colores.errorSuave },
          ]}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={32}
            color={colores.error}
          />
        </View>

        <Texto
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colores.error,
            textAlign: "center",
          }}
        >
          No pudimos cargar los lugares
        </Texto>

        <Texto
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: colores.textoSecundario,
            textAlign: "center",
          }}
        >
          Comprobá tu conexión e intentá nuevamente.
        </Texto>

        <View style={{ alignSelf: "stretch", marginTop: 8 }}>
          <Boton
            titulo="Reintentar"
            onPress={() => {
              void consultaLugares.refetch();
              void consultaCategorias.refetch();
            }}
            accessibilityLabel="Reintentar carga de lugares"
          />
        </View>
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
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={styles.lista}
      ItemSeparatorComponent={() => <View style={styles.separador} />}
      ListHeaderComponent={
        <View style={styles.encabezadoLista}>
          {/* Buscador */}
          <View
            style={[
              styles.buscador,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
              },
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

          {/* Encabezado de sección */}
          {lugaresFiltrados.length > 0 && (
            <View style={styles.encabezado} accessibilityRole="header">
              <View
                style={[
                  styles.iconoEncabezado,
                  { backgroundColor: colores.primarioSuave },
                ]}
              >
                <Ionicons
                  name="location"
                  size={16}
                  color={colores.primarioFuerte}
                />
              </View>

              <Texto style={{ fontSize: 17, fontWeight: "700" }}>
                Lugares para descubrir
              </Texto>
            </View>
          )}
        </View>
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
              style={StyleSheet.flatten([
                styles.tarjeta,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.borde,
                },
              ])}
              role="button"
              accessibilityLabel={`Ver detalle de ${item.nombre}`}
            >
              <View
                style={[
                  styles.contenedorImagen,
                  { backgroundColor: colores.primarioSuave },
                ]}
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
                    <Ionicons
                      name="image-outline"
                      size={42}
                      color={colores.primarioFuerte}
                    />
                    <Texto
                      style={{ fontSize: 14, color: colores.textoSecundario }}
                    >
                      Sin imagen disponible
                    </Texto>
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
                  <Texto style={{ fontSize: 13, fontWeight: "700" }}>
                    {nombreCategoria}
                  </Texto>
                </View>
              </View>

              <View style={styles.contenidoTarjeta}>
                <Texto
                  numberOfLines={2}
                  style={{ fontSize: 19, lineHeight: 26, fontWeight: "700" }}
                >
                  {item.nombre}
                </Texto>

                <Texto
                  numberOfLines={3}
                  style={{
                    fontSize: 15,
                    lineHeight: 22,
                    color: colores.textoSecundario,
                  }}
                >
                  {item.descripcionCorta}
                </Texto>

                <View
                  style={[
                    styles.filaInferior,
                    { borderTopColor: colores.borde },
                  ]}
                >
                  <View style={styles.filaDireccion}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colores.primarioFuerte}
                    />
                    <Texto
                      numberOfLines={2}
                      style={{
                        flex: 1,
                        fontSize: 14,
                        lineHeight: 20,
                        color: colores.textoSecundario,
                      }}
                    >
                      {item.direccion}
                    </Texto>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={colores.textoSecundario}
                  />
                </View>
              </View>
            </Pressable>
          </Link>
        );
      }}
      ListEmptyComponent={
        <View style={styles.vacio}>
          <View
            style={[
              styles.circuloEstado,
              { backgroundColor: colores.primarioSuave },
            ]}
          >
            <Ionicons
              name={
                lugares.length === 0 ? "location-outline" : "search-outline"
              }
              size={32}
              color={colores.primarioFuerte}
            />
          </View>

          <Texto
            style={{ fontSize: 18, fontWeight: "700", textAlign: "center" }}
          >
            {lugares.length === 0
              ? "No hay lugares disponibles"
              : "No encontramos resultados"}
          </Texto>

          {lugares.length > 0 && (
            <Texto
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: colores.textoSecundario,
                textAlign: "center",
              }}
            >
              Probá con otro nombre o seleccioná otra categoría.
            </Texto>
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
  },
  encabezadoLista: {
    marginBottom: 4,
  },
  separador: {
    height: 12,
  },
  buscador: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
  categorias: {
    marginTop: 12,
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
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 18,
    paddingBottom: 6,
  },
  iconoEncabezado: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tarjeta: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  contenedorImagen: {
    height: 170,
  },
  imagen: {
    width: "100%",
    height: "100%",
  },
  imagenVacia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  etiquetaCategoria: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  contenidoTarjeta: {
    padding: 16,
    gap: 10,
  },
  filaInferior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 12,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  filaDireccion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  circuloEstado: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  vacio: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 12,
  },
});
