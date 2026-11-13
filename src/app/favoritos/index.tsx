import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { obtenerLugaresApi } from "../../api/lugares";
import { BloqueoSesion } from "../../components/BloqueoSesion";
import Boton from "../../components/ui/Boton";
import PantallaCarga from "../../components/ui/PantallaCarga";
import Texto from "../../components/ui/Texto";
import { useSesion } from "../../contextos/SesionContext";
import {
  obtenerFavoritos,
  quitarFavorito,
  sincronizarFavoritos,
} from "../../servicios/favoritos";
import { useTema } from "../../tema/TemaContext";
import { fuentes } from "../../tema/tipografia";
import type { Lugar } from "../../tipos/lugar";

type EstadoFavoritos =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | { fase: "listo"; lugares: Lugar[] };

export default function FavoritosScreen() {
  const { colores } = useTema();
  const { sesion, cargando: cargandoSesion, bloqueada } = useSesion();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<EstadoFavoritos>({
    fase: "cargando",
  });
  const [intento, setIntento] = useState(0);
  const [refrescando, setRefrescando] = useState(false);

  const cargarFavoritos = useCallback(
    async (esRefresco = false) => {
      if (!sesion || bloqueada) {
        setEstado({ fase: "listo", lugares: [] });
        return;
      }

      try {
        if (esRefresco) setRefrescando(true);
        else setEstado({ fase: "cargando" });

        try {
          await sincronizarFavoritos(sesion.email);
        } catch {
          // Seguimos con los datos locales si la API falla
        }

        const [favoritos, respuesta] = await Promise.all([
          obtenerFavoritos(sesion.email),
          obtenerLugaresApi(),
        ]);

        const idsFavoritos = new Set(
          favoritos.map((favorito) => favorito.lugarId),
        );

        setEstado({
          fase: "listo",
          lugares: respuesta.datos.filter((lugar) =>
            idsFavoritos.has(lugar.id),
          ),
        });
      } catch {
        setEstado({
          fase: "error",
          mensaje: "No pudimos cargar tus lugares guardados.",
        });
      } finally {
        if (esRefresco) setRefrescando(false);
      }
    },
    [sesion?.email, bloqueada],
  );

  useFocusEffect(
    useCallback(() => {
      void cargarFavoritos();
    }, [cargarFavoritos, intento]),
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

              setEstado((anterior) =>
                anterior.fase === "listo"
                  ? {
                      ...anterior,
                      lugares: anterior.lugares.filter(
                        (item) => item.id !== lugar.id,
                      ),
                    }
                  : anterior,
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
          headerStyle: { backgroundColor: colores.superficie },
          headerTintColor: colores.texto,
          headerTitleStyle: { fontFamily: fuentes.negrita, fontSize: 18 },
          headerShadowVisible: false,
        }}
      />

      {cargandoSesion ? (
        <PantallaCarga titulo="Cargando tu sesión..." />
      ) : sesion && bloqueada ? (
        <BloqueoSesion email={sesion.email} />
      ) : !sesion ? (
        <View style={[estilos.centro, { backgroundColor: colores.fondo }]}>
          <View
            style={[
              estilos.circuloEstado,
              { backgroundColor: colores.primarioSuave },
            ]}
          >
            <Ionicons
              name="heart-outline"
              size={32}
              color={colores.primarioFuerte}
            />
          </View>

          <Texto
            style={{ fontSize: 18, fontWeight: "700", textAlign: "center" }}
          >
            Tus favoritos son personales
          </Texto>

          <Texto
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: colores.textoSecundario,
              textAlign: "center",
            }}
          >
            Iniciá sesión para guardar y tener siempre a mano los lugares de
            Colón que más te gustan.
          </Texto>

          <View style={{ alignSelf: "stretch", marginTop: 8 }}>
            <Boton
              titulo="Iniciar sesión"
              onPress={() => router.push("/login")}
              accessibilityLabel="Iniciar sesión"
            />
          </View>
        </View>
      ) : estado.fase === "cargando" ? (
        <PantallaCarga titulo="Cargando favoritos..." />
      ) : estado.fase === "error" ? (
        <View style={[estilos.centro, { backgroundColor: colores.fondo }]}>
          <View
            style={[
              estilos.circuloEstado,
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
            No pudimos cargar tus favoritos
          </Texto>

          <Texto
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: colores.textoSecundario,
              textAlign: "center",
            }}
          >
            {estado.mensaje}
          </Texto>

          <View style={{ alignSelf: "stretch", marginTop: 8 }}>
            <Boton
              titulo="Reintentar"
              onPress={() => setIntento((anterior) => anterior + 1)}
              accessibilityLabel="Reintentar cargar favoritos"
            />
          </View>
        </View>
      ) : (
        <View style={[estilos.contenedor, { backgroundColor: colores.fondo }]}>
          <FlatList
            data={estado.lugares}
            keyExtractor={(lugar) => lugar.id}
            contentContainerStyle={[
              estilos.lista,
              { paddingBottom: 16 + insets.bottom },
            ]}
            refreshing={refrescando}
            onRefresh={() => void cargarFavoritos(true)}
            ListHeaderComponent={
              estado.lugares.length > 0 ? (
                <View
                  style={[
                    estilos.encabezado,
                    { backgroundColor: colores.fondo },
                  ]}
                >
                  <View
                    style={[
                      estilos.iconoEncabezado,
                      { backgroundColor: colores.primarioSuave },
                    ]}
                  >
                    <Ionicons
                      name="heart"
                      size={16}
                      color={colores.primarioFuerte}
                    />
                  </View>
                  <Texto style={{ fontSize: 17, fontWeight: "700" }}>
                    Tus lugares guardados
                  </Texto>
                </View>
              ) : null
            }
            ItemSeparatorComponent={() => <View style={estilos.separador} />}
            ListEmptyComponent={
              <View style={estilos.estadoVacio}>
                <View
                  style={[
                    estilos.circuloEstado,
                    { backgroundColor: colores.primarioSuave },
                  ]}
                >
                  <Ionicons
                    name="heart-outline"
                    size={32}
                    color={colores.primarioFuerte}
                  />
                </View>

                <Texto
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  Todavía no tenés favoritos
                </Texto>

                <Texto
                  style={{
                    fontSize: 15,
                    lineHeight: 22,
                    color: colores.textoSecundario,
                    textAlign: "center",
                  }}
                >
                  Explorá Colón y guardá los lugares que quieras visitar para
                  tenerlos listos acá.
                </Texto>

                <View style={{ alignSelf: "stretch", marginTop: 8 }}>
                  <Boton
                    titulo="Explorar lugares"
                    onPress={() => router.push("/")}
                    accessibilityLabel="Explorar lugares"
                  />
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const imagen = item.imagenes[0];

              return (
                <View
                  style={[
                    estilos.tarjeta,
                    {
                      backgroundColor: colores.superficie,
                      borderColor: colores.borde,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/lugares/[id]",
                        params: { id: item.id },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Ver detalle de ${item.nombre}`}
                  >
                    <View
                      style={[
                        estilos.contenedorImagen,
                        { backgroundColor: colores.primarioSuave },
                      ]}
                    >
                      {imagen ? (
                        <Image
                          source={{ uri: imagen }}
                          style={estilos.imagen}
                          contentFit="cover"
                          transition={200}
                          alt={`Imagen de ${item.nombre}`}
                        />
                      ) : (
                        <View style={estilos.sinImagen}>
                          <Ionicons
                            name="image-outline"
                            size={42}
                            color={colores.primarioFuerte}
                          />
                        </View>
                      )}
                    </View>

                    <View style={estilos.contenidoTarjeta}>
                      <Texto
                        style={{
                          fontSize: 19,
                          lineHeight: 26,
                          fontWeight: "700",
                        }}
                      >
                        {item.nombre}
                      </Texto>

                      <View style={estilos.filaDireccion}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color={colores.textoSecundario}
                        />
                        <Texto
                          style={{
                            flex: 1,
                            fontSize: 14,
                            lineHeight: 20,
                            color: colores.textoSecundario,
                          }}
                          numberOfLines={2}
                        >
                          {item.direccion}
                        </Texto>
                      </View>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      estilos.botonQuitar,
                      { backgroundColor: colores.errorSuave },
                    ]}
                    onPress={() => confirmarQuitar(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${item.nombre} de favoritos`}
                  >
                    <Ionicons
                      name="heart-dislike-outline"
                      size={20}
                      color={colores.error}
                    />
                    <Texto
                      style={{
                        color: colores.error,
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      Quitar de favoritos
                    </Texto>
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

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },

  lista: {
    flexGrow: 1,
    padding: 16,
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },

  iconoEncabezado: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  separador: {
    height: 12,
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },

  estadoVacio: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
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

  sinImagen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  contenidoTarjeta: {
    padding: 16,
    gap: 12,
  },

  filaDireccion: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  botonQuitar: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
  },
});
