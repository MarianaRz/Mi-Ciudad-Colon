import { Image } from "expo-image";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ReproductorAudioguia from "../../components/ReproductorAudioguia";
import { useSesion } from "../../contextos/SesionContext";
import {
  esFavorito,
  guardarFavorito,
  quitarFavorito,
} from "../../servicios/favoritos";
import type { Categoria } from "../../tipos/categoria";
import type { Lugar } from "../../tipos/lugar";
import { obtenerEstadoHorario } from "../../utils/horarios";
import { confirmarAccion } from "../../servicios/haptica";
import { obtenerCategoriasApi } from "../../api/categorias";
import { obtenerLugarPorIdApi } from "../../api/lugares";

const AZUL = "#075985";

const nombresDias = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function DetalleLugarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { sesion, cargando: cargandoSesion, bloqueada } = useSesion();

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [favorito, setFavorito] = useState(false);
  const [cargandoFavorito, setCargandoFavorito] = useState(false);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarLugar() {
      try {
        setCargando(true);
        setError(null);

        const resultado = await obtenerLugarPorIdApi(id);
        const respuestaCategorias = await obtenerCategoriasApi();

        if (!activo) return;

        setLugar(resultado);

        setCategoria(
          respuestaCategorias.datos.find(
            (item) => item.id === resultado.categoriaId,
          ) ?? null,
        );
      } catch (error) {
        if (!activo) return;

        setError(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cargar el lugar.",
        );
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargarLugar();

    return () => {
      activo = false;
    };
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      async function consultarFavorito() {
        if (!sesion || bloqueada || !id) {
          setFavorito(false);
          setCargandoFavorito(false);
          return;
        }

        try {
          setCargandoFavorito(true);

          const resultado = await esFavorito(sesion.email, id);

          if (activo) setFavorito(resultado);
        } catch {
          if (activo) {
            Alert.alert("Error", "No pudimos consultar tus favoritos.");
          }
        } finally {
          if (activo) setCargandoFavorito(false);
        }
      }

      void consultarFavorito();

      return () => {
        activo = false;
      };
    }, [sesion?.email, bloqueada, id]),
  );

  async function alternarFavorito() {
    if (!lugar || cargandoSesion || cargandoFavorito || guardandoFavorito) {
      return;
    }

    if (!sesion) {
      Alert.alert(
        "Iniciá sesión",
        "Necesitás iniciar sesión para guardar lugares favoritos.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Iniciar sesión",
            onPress: () => router.push("/login"),
          },
        ],
      );
      return;
    }

    if (bloqueada) {
      Alert.alert(
        "Sesión bloqueada",
        "Desbloqueá tu sesión desde «Yo» para modificar favoritos.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Ir a Yo",
            onPress: () => router.push("/(tabs)/perfil"),
          },
        ],
      );
      return;
    }

    try {
      setGuardandoFavorito(true);

      if (favorito) {
        await quitarFavorito(sesion.email, lugar.id);
        setFavorito(false);
      } else {
        await guardarFavorito(sesion.email, lugar.id);
        setFavorito(true);
      }

      void confirmarAccion();
    } catch {
      Alert.alert(
        "Error",
        "No pudimos actualizar tus favoritos. Intentá nuevamente.",
      );
    } finally {
      setGuardandoFavorito(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={AZUL} />
        <Text style={styles.textoSecundario}>Cargando lugar...</Text>
      </View>
    );
  }

  if (error || !lugar) {
    return (
      <View style={styles.centro}>
        <Text>{error ?? "No se encontró el lugar."}</Text>
      </View>
    );
  }

  const estadoHorario = obtenerEstadoHorario(lugar.horarios);

  const textoPrecio =
    lugar.precioEntrada === 0
      ? "Entrada gratuita"
      : lugar.precioEntrada === null
        ? "Precio no informado"
        : `$${lugar.precioEntrada}`;

  const botonDeshabilitado =
    cargandoSesion || cargandoFavorito || guardandoFavorito;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalle del lugar",
          headerStyle: { backgroundColor: AZUL },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
          {/* Imagen protagonista */}
          <View style={styles.contenedorImagen}>
            {lugar.imagenes.length > 0 ? (
              <Image
                source={{ uri: lugar.imagenes[0] }}
                style={styles.imagen}
                contentFit="cover"
                transition={200}
                alt={`Imagen de ${lugar.nombre}`}
              />
            ) : (
              <View style={styles.sinImagen}>
                <Text style={styles.textoSecundario}>
                  Sin imagen disponible
                </Text>
              </View>
            )}

            {/* Corazón flotante */}
            <Pressable
              style={[
                styles.botonCorazon,
                botonDeshabilitado && styles.botonDeshabilitado,
              ]}
              onPress={() => void alternarFavorito()}
              disabled={botonDeshabilitado}
              accessibilityRole="button"
              accessibilityLabel={
                favorito
                  ? `Quitar ${lugar.nombre} de favoritos`
                  : `Guardar ${lugar.nombre} en favoritos`
              }
              accessibilityState={{
                disabled: botonDeshabilitado,
                busy: botonDeshabilitado,
              }}
            >
              {botonDeshabilitado ? (
                <ActivityIndicator size="small" color={AZUL} />
              ) : (
                <Text
                  style={[styles.corazon, favorito && styles.corazonActivo]}
                >
                  {favorito ? "♥" : "♡"}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Contenido principal */}
          <View style={styles.cuerpo}>
            <Text style={styles.titulo}>{lugar.nombre}</Text>

            <Text style={styles.categoria}>
              {categoria?.nombre ?? "Categoría no disponible"}
            </Text>

            <Text
              style={[
                styles.estadoHorario,
                estadoHorario.abierto ? styles.abierto : styles.cerrado,
              ]}
            >
              {estadoHorario.texto}
            </Text>

            <View style={styles.separador} />

            <Text style={styles.tituloSeccion}>Sobre este lugar</Text>
            <Text style={styles.descripcion}>{lugar.descripcion}</Text>

            <View style={styles.separador} />

            <Text style={styles.tituloSeccion}>Información para tu visita</Text>

            <View style={styles.filaInformacion}>
              <Text style={styles.icono}>📍</Text>
              <View style={styles.detalleInformacion}>
                <Text style={styles.etiqueta}>Ubicación</Text>
                <Text style={styles.valor}>{lugar.direccion}</Text>
              </View>
            </View>

            <View style={styles.separadorSuave} />

            <View style={styles.filaInformacion}>
              <Text style={styles.icono}>🕒</Text>
              <View style={styles.detalleInformacion}>
                <Text style={styles.etiqueta}>Horarios de visita</Text>

                {lugar.horarios.length > 0 ? (
                  lugar.horarios.map((horario) => (
                    <Text
                      key={`${horario.dia}-${horario.abre}-${horario.cierra}`}
                      style={styles.valor}
                    >
                      {nombresDias[horario.dia]} · {horario.abre} a{" "}
                      {horario.cierra}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.valor}>Horario no informado</Text>
                )}
              </View>
            </View>

            <View style={styles.separadorSuave} />

            <View style={styles.filaInformacion}>
              <Text style={styles.icono}>🎟️</Text>
              <View style={styles.detalleInformacion}>
                <Text style={styles.etiqueta}>Entrada</Text>
                <Text style={styles.valor}>{textoPrecio}</Text>
              </View>
            </View>

            <View style={styles.separadorSuave} />

            <View style={styles.filaInformacion}>
              <Text style={styles.icono}>♿</Text>
              <View style={styles.detalleInformacion}>
                <Text style={styles.etiqueta}>Accesibilidad</Text>
                <Text style={styles.valor}>
                  {lugar.accesible
                    ? "Accesible para silla de ruedas"
                    : "No indicado como accesible para silla de ruedas"}
                </Text>
              </View>
            </View>

            {lugar.telefono && (
              <>
                <View style={styles.separadorSuave} />

                <View style={styles.filaInformacion}>
                  <Text style={styles.icono}>📞</Text>
                  <View style={styles.detalleInformacion}>
                    <Text style={styles.etiqueta}>Teléfono</Text>
                    <Text style={styles.valor}>{lugar.telefono}</Text>
                  </View>
                </View>
              </>
            )}

            {/* Audioguía */}
            {lugar.audioguia && (
              <>
                <View style={styles.separador} />

                <ReproductorAudioguia
                  key={lugar.id}
                  lugarId={lugar.id}
                  url={
                    lugar.id === "lug-004"
                      ? require("../../../assets/audio/molino-forclaz.mp3")
                      : lugar.audioguia.url
                  }
                  duracionSegundos={lugar.audioguia.duracionSegundos}
                  idioma={lugar.audioguia.idioma}
                />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contenido: {
    paddingBottom: 36,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#F8FAFC",
  },
  contenedorImagen: {
    width: "100%",
    height: 280,
    backgroundColor: "#E2E8F0",
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
  botonCorazon: {
    position: "absolute",
    right: 20,
    top: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  corazon: {
    fontSize: 30,
    color: "#17202A",
  },
  corazonActivo: {
    color: "#B42318",
  },
  cuerpo: {
    paddingHorizontal: 22,
    paddingTop: 24,
    gap: 12,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#17202A",
  },
  categoria: {
    fontSize: 15,
    color: "#64748B",
  },
  estadoHorario: {
    fontSize: 15,
    fontWeight: "700",
  },
  abierto: {
    color: "#167A3E",
  },
  cerrado: {
    color: "#B42318",
  },
  separador: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  separadorSuave: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  tituloSeccion: {
    fontSize: 20,
    fontWeight: "700",
    color: "#17202A",
  },
  descripcion: {
    fontSize: 16,
    lineHeight: 25,
    color: "#475569",
  },
  filaInformacion: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 16,
  },
  icono: {
    fontSize: 23,
    width: 30,
    textAlign: "center",
  },
  detalleInformacion: {
    flex: 1,
    gap: 5,
  },
  etiqueta: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17202A",
  },
  valor: {
    fontSize: 15,
    lineHeight: 23,
    color: "#64748B",
  },
  textoSecundario: {
    fontSize: 15,
    color: "#64748B",
  },
});
