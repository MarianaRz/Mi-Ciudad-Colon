import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { Link, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BloqueoSesion } from "../../components/BloqueoSesion";
import { useSesion } from "../../contextos/SesionContext";
import { obtenerFavoritos, quitarFavorito } from "../../servicios/favoritos";
import { obtenerLugares } from "../../servicios/lugares";
import type { Lugar } from "../../tipos/lugar";

const AZUL = "#075985";

export default function FavoritosScreen() {
  const { sesion, cargando: cargandoSesion, bloqueada } = useSesion();

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarFavoritos = useCallback(async () => {
    if (!sesion || bloqueada) {
      setLugares([]);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const [favoritos, respuesta] = await Promise.all([
        obtenerFavoritos(sesion.email),
        obtenerLugares(),
      ]);

      const idsFavoritos = new Set(
        favoritos.map((favorito) => favorito.lugarId),
      );

      setLugares(respuesta.datos.filter((lugar) => idsFavoritos.has(lugar.id)));
    } catch {
      setError("No pudimos cargar tus favoritos. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  }, [sesion?.email, bloqueada]);

  useFocusEffect(
    useCallback(() => {
      void cargarFavoritos();
    }, [cargarFavoritos]),
  );

  function confirmarQuitar(lugar: Lugar) {
    if (!sesion || bloqueada) return;

    Alert.alert(
      "Quitar de favoritos",
      `¿Querés quitar "${lugar.nombre}" de tus favoritos?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: async () => {
            try {
              await quitarFavorito(sesion.email, lugar.id);

              setLugares((actuales) =>
                actuales.filter((item) => item.id !== lugar.id),
              );
            } catch {
              Alert.alert(
                "Error",
                "No pudimos quitar este lugar de tus favoritos.",
              );
            }
          },
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Mis favoritos",
          headerStyle: { backgroundColor: AZUL },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      />

      {cargandoSesion ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={AZUL} />
          <Text style={styles.textoSecundario}>Cargando tu sesión...</Text>
        </View>
      ) : sesion && bloqueada ? (
        <BloqueoSesion email={sesion.email} />
      ) : !sesion ? (
        <View style={styles.centrado}>
          <Ionicons name="heart-outline" size={62} color={AZUL} />

          <Text style={styles.tituloVacio}>Tus favoritos son personales</Text>

          <Text style={styles.textoSecundario}>
            Iniciá sesión para guardar y consultar tus lugares favoritos.
          </Text>

          <Link href="/login" asChild>
            <Pressable
              style={styles.botonPrincipal}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión"
            >
              <Text style={styles.textoBotonPrincipal}>Iniciar sesión</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <View style={styles.container}>
          <FlatList
            data={lugares}
            keyExtractor={(lugar) => lugar.id}
            contentContainerStyle={styles.lista}
            refreshing={cargando}
            onRefresh={() => void cargarFavoritos()}
            ListHeaderComponent={
              <View style={styles.encabezado}>
                <Text style={styles.titulo}>Tus lugares guardados</Text>
                <Text style={styles.subtitulo}>
                  Tené a mano los rincones de Colón que más te gustan.
                </Text>
              </View>
            }
            ListEmptyComponent={
              cargando ? (
                <View style={styles.estado}>
                  <ActivityIndicator size="large" color={AZUL} />
                  <Text style={styles.textoSecundario}>
                    Cargando favoritos...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.estado}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={54}
                    color="#B42318"
                  />
                  <Text style={styles.tituloVacio}>
                    No pudimos cargar tus favoritos
                  </Text>
                  <Text style={styles.textoSecundario}>{error}</Text>

                  <Pressable
                    style={styles.botonPrincipal}
                    onPress={() => void cargarFavoritos()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.estado}>
                  <Ionicons name="heart-outline" size={64} color="#94A3B8" />

                  <Text style={styles.tituloVacio}>
                    Todavía no tenés favoritos
                  </Text>

                  <Text style={styles.textoSecundario}>
                    Explorá Colón y guardá los lugares que quieras visitar.
                  </Text>

                  <Link href="/" asChild>
                    <Pressable
                      style={styles.botonPrincipal}
                      accessibilityRole="button"
                    >
                      <Text style={styles.textoBotonPrincipal}>
                        Explorar lugares
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              )
            }
            renderItem={({ item }) => {
              const imagen = item.imagenes[0];

              return (
                <View style={styles.tarjeta}>
                  <Link
                    href={{
                      pathname: "/lugares/[id]",
                      params: { id: item.id },
                    }}
                    asChild
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Ver detalle de ${item.nombre}`}
                    >
                      {imagen ? (
                        <Image
                          source={{ uri: imagen }}
                          style={styles.imagen}
                          contentFit="cover"
                          transition={200}
                          alt={`Imagen de ${item.nombre}`}
                        />
                      ) : (
                        <View style={styles.sinImagen}>
                          <Ionicons
                            name="image-outline"
                            size={36}
                            color="#94A3B8"
                          />
                          <Text style={styles.textoSinImagen}>
                            Sin imagen disponible
                          </Text>
                        </View>
                      )}

                      <View style={styles.contenidoTarjeta}>
                        <Text style={styles.nombre}>{item.nombre}</Text>

                        <View style={styles.filaDireccion}>
                          <Ionicons
                            name="location-outline"
                            size={17}
                            color="#64748B"
                          />

                          <Text style={styles.direccion} numberOfLines={2}>
                            {item.direccion}
                          </Text>
                        </View>

                        <Text style={styles.verDetalle}>
                          Ver detalle
                          {"  "}
                          <Ionicons
                            name="arrow-forward"
                            size={15}
                            color={AZUL}
                          />
                        </Text>
                      </View>
                    </Pressable>
                  </Link>

                  <Pressable
                    style={styles.botonQuitar}
                    onPress={() => confirmarQuitar(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${item.nombre} de favoritos`}
                  >
                    <Ionicons
                      name="heart-dislike-outline"
                      size={20}
                      color="#B42318"
                    />

                    <Text style={styles.textoQuitar}>Quitar de favoritos</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    flexGrow: 1,
  },
  encabezado: {
    paddingTop: 24,
    paddingBottom: 22,
    gap: 8,
  },
  titulo: {
    fontSize: 25,
    fontWeight: "700",
    color: "#17202A",
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
    elevation: 2,
  },
  imagen: {
    width: "100%",
    height: 165,
    backgroundColor: "#E2E8F0",
  },
  sinImagen: {
    height: 165,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E2E8F0",
  },
  textoSinImagen: {
    fontSize: 14,
    color: "#64748B",
  },
  contenidoTarjeta: {
    padding: 16,
    gap: 9,
  },
  nombre: {
    fontSize: 19,
    fontWeight: "700",
    color: "#17202A",
  },
  filaDireccion: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  direccion: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },
  verDetalle: {
    marginTop: 4,
    color: AZUL,
    fontSize: 15,
    fontWeight: "700",
  },
  botonQuitar: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  textoQuitar: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "700",
  },
  centrado: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  estado: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 12,
    gap: 16,
  },
  tituloVacio: {
    fontSize: 20,
    fontWeight: "700",
    color: "#17202A",
    textAlign: "center",
  },
  textoSecundario: {
    fontSize: 15,
    lineHeight: 23,
    color: "#64748B",
    textAlign: "center",
  },
  botonPrincipal: {
    minHeight: 52,
    minWidth: 180,
    backgroundColor: AZUL,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  textoBotonPrincipal: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
