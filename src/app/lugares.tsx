import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { obtenerCategorias } from "../servicios/categorias";
import { obtenerLugares } from "../servicios/lugares";
import { Categoria } from "../tipos/categoria";
import { Lugar } from "../tipos/lugar";

export default function LugaresScreen() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function cargarLugares() {
      const [respuestaLugares, respuestaCategorias] = await Promise.all([
        obtenerLugares(),
        obtenerCategorias(),
      ]);

      setLugares(respuestaLugares.datos);
      setCategorias(respuestaCategorias.datos);
      setCargando(false);
    }

    cargarLugares();
  }, []);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <Text>Cargando lugares...</Text>
      </View>
    );
  }
  const lugaresFiltrados = lugares.filter((lugar) => {
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
                source={item.imagenes[0]}
                style={styles.imagen}
                contentFit="cover"
                transition={200}
                alt={`Imagen de ${item.nombre}`}
              />
            ) : (
              <View
                style={styles.imagenVacia}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
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
    borderColor: "#075985",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    marginRight: 8,
  },

  chipActivo: {
    backgroundColor: "#075985",
  },

  textoChip: {
    color: "#075985",
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    backgroundColor: "#F8FAFC",
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
