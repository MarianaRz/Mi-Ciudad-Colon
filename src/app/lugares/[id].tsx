import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { obtenerCategoriasApi } from "../../api/categorias";
import { obtenerLugarPorIdApi } from "../../api/lugares";
import ReproductorAudioguia from "../../components/ReproductorAudioguia";
import Texto from "../../components/ui/Texto";
import { useSesion } from "../../contextos/SesionContext";
import {
  esFavorito,
  guardarFavorito,
  quitarFavorito,
  sincronizarFavoritos,
} from "../../servicios/favoritos";
import { confirmarAccion } from "../../servicios/haptica";
import { useTema } from "../../tema/TemaContext";
import { fuentes } from "../../tema/tipografia";
import type { Categoria } from "../../tipos/categoria";
import type { Lugar } from "../../tipos/lugar";
import { obtenerInfoCategoria } from "../../utils/categorias";
import { obtenerEstadoHorario } from "../../utils/horarios";

const nombresDias = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type NombreIcono = React.ComponentProps<typeof Ionicons>["name"];

export default function DetalleLugarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colores } = useTema();

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

          const resultadoLocal = await esFavorito(sesion.email, id);

          if (!activo) return;
          setFavorito(resultadoLocal);
        } catch {
          if (activo) {
            Alert.alert("Error", "No pudimos consultar tus favoritos.");
          }
          return;
        } finally {
          if (activo) setCargandoFavorito(false);
        }

        if (!activo) return;

        try {
          await sincronizarFavoritos(sesion.email);

          const resultadoActualizado = await esFavorito(sesion.email, id);

          if (activo) setFavorito(resultadoActualizado);
        } catch {
          // Si la API no está disponible, conservamos el estado local.
          // La sincronización podrá reintentarse cuando vuelvas al detalle.
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

  const opcionesHeader = (
    <Stack.Screen
      options={{
        title: "Detalle del lugar",
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.texto,
        headerTitleStyle: { fontFamily: fuentes.negrita, fontSize: 18 },
        headerShadowVisible: false,
      }}
    />
  );

  if (cargando) {
    return (
      <>
        {opcionesHeader}
        <View style={[estilos.centro, { backgroundColor: colores.fondo }]}>
          <ActivityIndicator size="large" color={colores.primarioFuerte} />
          <Texto style={{ fontSize: 15, color: colores.textoSecundario }}>
            Cargando lugar...
          </Texto>
        </View>
      </>
    );
  }

  if (error || !lugar) {
    return (
      <>
        {opcionesHeader}
        <View style={[estilos.centro, { backgroundColor: colores.fondo }]}>
          <View
            style={[
              estilos.circuloEstado,
              { backgroundColor: colores.errorSuave },
            ]}
          >
            <Ionicons name="alert-circle" size={32} color={colores.error} />
          </View>
          <Texto
            style={{
              fontSize: 16,
              color: colores.textoSecundario,
              textAlign: "center",
            }}
          >
            {error ?? "No se encontró el lugar."}
          </Texto>
        </View>
      </>
    );
  }

  const estadoHorario = obtenerEstadoHorario(lugar.horarios);
  const infoCategoria = obtenerInfoCategoria(lugar.categoriaId);

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
      {opcionesHeader}

      <SafeAreaView
        style={[estilos.safeArea, { backgroundColor: colores.superficie }]}
        edges={["bottom"]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={estilos.contenido}
        >
          {/* Imagen protagonista */}
          <View
            style={[
              estilos.contenedorImagen,
              { backgroundColor: colores.primarioSuave },
            ]}
          >
            {lugar.imagenes.length > 0 ? (
              <Image
                source={{ uri: lugar.imagenes[0] }}
                style={estilos.imagen}
                contentFit="cover"
                transition={200}
                alt={`Imagen de ${lugar.nombre}`}
              />
            ) : (
              <View style={estilos.sinImagen}>
                <Ionicons
                  name="image-outline"
                  size={40}
                  color={colores.primarioFuerte}
                />
                <Texto style={{ fontSize: 15, color: colores.textoSecundario }}>
                  Sin imagen disponible
                </Texto>
              </View>
            )}

            {/* Botón de favorito */}
            <Pressable
              style={[
                estilos.botonCorazon,
                { backgroundColor: colores.superficie },
                botonDeshabilitado && estilos.botonDeshabilitado,
              ]}
              onPress={() => void alternarFavorito()}
              disabled={botonDeshabilitado}
              role="button"
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
                <ActivityIndicator
                  size="small"
                  color={colores.primarioFuerte}
                />
              ) : (
                <Ionicons
                  name={favorito ? "heart" : "heart-outline"}
                  size={26}
                  color={favorito ? colores.error : colores.texto}
                />
              )}
            </Pressable>
          </View>

          {/* Contenido principal */}
          <View style={estilos.cuerpo}>
            <Texto style={{ fontSize: 28, lineHeight: 34, fontWeight: "700" }}>
              {lugar.nombre}
            </Texto>

            <View style={estilos.filaEtiquetas}>
              <View
                style={[
                  estilos.etiqueta,
                  { backgroundColor: `${infoCategoria.color}20` },
                ]}
              >
                <Ionicons
                  name={infoCategoria.icono}
                  size={16}
                  color={infoCategoria.color}
                />
                <Texto style={{ fontSize: 13, fontWeight: "600" }}>
                  {categoria?.nombre ?? "Categoría no disponible"}
                </Texto>
              </View>

              <View
                style={[
                  estilos.etiqueta,
                  {
                    backgroundColor: estadoHorario.abierto
                      ? colores.exitoSuave
                      : colores.errorSuave,
                  },
                ]}
              >
                <Ionicons
                  name={
                    estadoHorario.abierto ? "checkmark-circle" : "close-circle"
                  }
                  size={16}
                  color={estadoHorario.abierto ? colores.exito : colores.error}
                />
                <Texto
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: estadoHorario.abierto
                      ? colores.exito
                      : colores.error,
                  }}
                >
                  {estadoHorario.texto}
                </Texto>
              </View>
            </View>

            <View
              style={[estilos.separador, { backgroundColor: colores.borde }]}
            />

            <Texto style={{ fontSize: 20, fontWeight: "700" }}>
              Sobre este lugar
            </Texto>
            <Texto
              style={{
                fontSize: 16,
                lineHeight: 25,
                color: colores.textoSecundario,
              }}
            >
              {lugar.descripcion}
            </Texto>

            <View
              style={[estilos.separador, { backgroundColor: colores.borde }]}
            />

            <Texto style={{ fontSize: 20, fontWeight: "700" }}>
              Información para tu visita
            </Texto>

            <FilaInformacion icono="location" etiqueta="Ubicación">
              <Texto style={estilos.valor}>{lugar.direccion}</Texto>
            </FilaInformacion>

            <Divisor />

            <FilaInformacion icono="time" etiqueta="Horarios de visita">
              {lugar.horarios.length > 0 ? (
                lugar.horarios.map((horario) => (
                  <Texto
                    key={`${horario.dia}-${horario.abre}-${horario.cierra}`}
                    style={[estilos.valor, { color: colores.textoSecundario }]}
                  >
                    {nombresDias[horario.dia]} · {horario.abre} a{" "}
                    {horario.cierra}
                  </Texto>
                ))
              ) : (
                <Texto
                  style={[estilos.valor, { color: colores.textoSecundario }]}
                >
                  Horario no informado
                </Texto>
              )}
            </FilaInformacion>

            <Divisor />

            <FilaInformacion icono="ticket" etiqueta="Entrada">
              <Texto
                style={[estilos.valor, { color: colores.textoSecundario }]}
              >
                {textoPrecio}
              </Texto>
            </FilaInformacion>

            <Divisor />

            <FilaInformacion icono="accessibility" etiqueta="Accesibilidad">
              <Texto
                style={[estilos.valor, { color: colores.textoSecundario }]}
              >
                {lugar.accesible
                  ? "Accesible para silla de ruedas"
                  : "No indicado como accesible para silla de ruedas"}
              </Texto>
            </FilaInformacion>

            {lugar.telefono && (
              <>
                <Divisor />

                <FilaInformacion icono="call" etiqueta="Teléfono">
                  <Texto
                    style={[estilos.valor, { color: colores.textoSecundario }]}
                  >
                    {lugar.telefono}
                  </Texto>
                </FilaInformacion>
              </>
            )}

            {/* Audioguía */}
            {lugar.audioguia && (
              <>
                <View
                  style={[
                    estilos.separador,
                    { backgroundColor: colores.borde },
                  ]}
                />

                <ReproductorAudioguia
                  key={lugar.id}
                  lugarId={lugar.id}
                  url={
                    lugar.id === "lug-004"
                      ? require("../../../assets/audio/molino-forclaz.mp3")
                      : lugar.id === "lug-008"
                        ? require("../../../assets/audio/iglesia-san-martin.mp3")
                        : lugar.id === "lug-007"
                          ? require("../../../assets/audio/puerto-viejo.mp3")
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

interface FilaInformacionProps {
  icono: NombreIcono;
  etiqueta: string;
  children: ReactNode;
}

function FilaInformacion({ icono, etiqueta, children }: FilaInformacionProps) {
  const { colores } = useTema();

  return (
    <View style={estilos.filaInformacion}>
      <View
        style={[
          estilos.circuloIcono,
          { backgroundColor: colores.primarioSuave },
        ]}
      >
        <Ionicons name={icono} size={20} color={colores.primarioFuerte} />
      </View>

      <View style={estilos.detalleInformacion}>
        <Texto style={{ fontSize: 16, fontWeight: "700" }}>{etiqueta}</Texto>
        {children}
      </View>
    </View>
  );
}

function Divisor() {
  const { colores } = useTema();

  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colores.borde,
      }}
    />
  );
}

const estilos = StyleSheet.create({
  safeArea: { flex: 1 },
  contenido: { paddingBottom: 36 },
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
  },
  contenedorImagen: {
    width: "100%",
    height: 280,
  },
  imagen: {
    width: "100%",
    height: "100%",
  },
  sinImagen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botonCorazon: {
    position: "absolute",
    right: 20,
    top: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  botonDeshabilitado: { opacity: 0.6 },
  cuerpo: {
    paddingHorizontal: 22,
    paddingTop: 24,
    gap: 12,
  },
  filaEtiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  etiqueta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  separador: {
    height: 1,
    marginVertical: 12,
  },
  filaInformacion: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 14,
  },
  circuloIcono: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  detalleInformacion: {
    flex: 1,
    gap: 4,
  },
  valor: {
    fontSize: 15,
    lineHeight: 23,
  },
});
