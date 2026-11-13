import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import Boton from "../../components/ui/Boton";
import Texto from "../../components/ui/Texto";
import { useSesion } from "../../contextos/SesionContext";

import { obtenerEventoPorIdApi } from "../../api/eventos";

import { obtenerLugarPorIdApi } from "../../api/lugares";
import {
  actualizarNotificacionGuardada,
  actualizarSeguimientoEvento,
  estaEventoGuardado,
  guardarEvento,
  obtenerNotificacionGuardada,
  quitarEventoGuardado,
  sincronizarEventosGuardados,
} from "../../servicios/eventosGuardados";
import {
  cancelarRecordatorio,
  cancelarRecordatoriosEvento,
  programarRecordatorioEvento,
} from "../../servicios/notificaciones";
import { useTema } from "../../tema/TemaContext";
import { fuentes } from "../../tema/tipografia";
import { ErrorApi } from "../../tipos/api";
import { Evento } from "../../tipos/evento";

import { confirmarAccion } from "../../servicios/haptica";
import {
  formatearDia,
  formatearDuracion,
  formatearHora,
} from "../../utils/fechas";

type EstadoDetalle =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string; reintentable: boolean }
  | { fase: "listo"; evento: Evento; ubicacion: string };

type NombreIcono = React.ComponentProps<typeof Ionicons>["name"];

const AVISOS_ESTADO: Partial<Record<Evento["estado"], string>> = {
  suspendido: "Este evento fue suspendido.",
  cancelado: "Este evento fue cancelado.",
  finalizado: "Este evento ya finalizó.",
};

const ICONOS_ESTADO: Partial<Record<Evento["estado"], NombreIcono>> = {
  suspendido: "pause-circle",
  cancelado: "close-circle",
  finalizado: "checkmark-done-circle",
};

function formatearPrecio(precio: number | null): string {
  if (precio === null) return "Precio a confirmar";
  if (precio === 0) return "Entrada gratuita";

  return `$${precio.toLocaleString("es-AR")}`;
}

export default function DetalleEventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colores } = useTema();

  const { sesion, cargando: cargandoSesion, bloqueada } = useSesion();

  const [estado, setEstado] = useState<EstadoDetalle>({
    fase: "cargando",
  });

  const [imagenFallida, setImagenFallida] = useState(false);

  const [descripcionExpandida, setDescripcionExpandida] = useState(false);

  const [guardado, setGuardado] = useState(false);

  const [consultandoGuardado, setConsultandoGuardado] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [intento, setIntento] = useState(0);

  // Cargar los datos del evento
  useEffect(() => {
    let activo = true;

    async function cargarEvento() {
      setEstado({ fase: "cargando" });
      setImagenFallida(false);
      setDescripcionExpandida(false);

      try {
        const evento = await obtenerEventoPorIdApi(id);

        let ubicacion = evento.direccionLibre ?? "Ubicación a confirmar";

        if (evento.lugarId !== null) {
          try {
            const lugar = await obtenerLugarPorIdApi(evento.lugarId);
            ubicacion = lugar.nombre;
          } catch {
            ubicacion = "Lugar no disponible";
          }
        }

        if (activo) {
          setEstado({
            fase: "listo",
            evento,
            ubicacion,
          });
        }
      } catch (error) {
        if (!activo) return;

        const mensaje =
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cargar el evento.";

        const reintentable = !(
          error instanceof ErrorApi && error.codigo === "EVENTO_NO_ENCONTRADO"
        );

        setEstado({
          fase: "error",
          mensaje,
          reintentable,
        });
      }
    }

    cargarEvento();

    return () => {
      activo = false;
    };
  }, [id, intento]);

  // Consultar si el evento está guardado en SQLite
  useEffect(() => {
    let activo = true;

    async function consultarGuardado() {
      setConsultandoGuardado(true);
      setGuardado(false);

      if (cargandoSesion) {
        return;
      }

      if (!sesion || bloqueada || !id) {
        if (activo) {
          setConsultandoGuardado(false);
        }
        return;
      }

      try {
        const existe = await estaEventoGuardado(sesion.email, id);

        if (activo) {
          setGuardado(existe);
        }
      } catch {
        if (activo) {
          Alert.alert("Error", "No pudimos consultar tus eventos guardados.");
        }
      } finally {
        if (activo) {
          setConsultandoGuardado(false);
        }
      }

      if (!activo) {
        return;
      }

      try {
        await sincronizarEventosGuardados(sesion.email);

        const existeActualizado = await estaEventoGuardado(sesion.email, id);

        if (activo) {
          setGuardado(existeActualizado);
        }
      } catch {}
    }

    consultarGuardado();

    return () => {
      activo = false;
    };
  }, [id, sesion?.email, cargandoSesion, bloqueada]);

  const evento = estado.fase === "listo" ? estado.evento : null;

  const sePuedeGuardar =
    evento?.estado === "programado" || evento?.estado === "suspendido";

  const botonGuardarDeshabilitado =
    guardando || consultandoGuardado || (!guardado && !sePuedeGuardar);

  // Guardar o quitar un evento
  async function alternarGuardado() {
    if (!evento || botonGuardarDeshabilitado) {
      return;
    }

    if (!sesion) {
      Alert.alert(
        "Iniciá sesión",
        "Necesitás una cuenta para guardar eventos.",
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
        "Desbloqueá tu sesión desde «Yo» para modificar tus eventos guardados.",
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

    setGuardando(true);

    try {
      if (guardado) {
        // Recuperar el identificador guardado en SQLite.
        const notificacionId = await obtenerNotificacionGuardada(
          sesion.email,
          evento.id,
        );

        // Cancelar también recordatorios antiguos,
        // que todavía no incluían el correo del usuario.
        if (notificacionId) {
          await cancelarRecordatorio(notificacionId);
        }

        // Buscar y cancelar cualquier recordatorio pendiente
        // asociado a este evento y esta cuenta.
        await cancelarRecordatoriosEvento(sesion.email, evento.id);

        // Quitar el evento de SQLite.
        await quitarEventoGuardado(sesion.email, evento.id);

        setGuardado(false);
        void confirmarAccion();
      } else {
        // 1. Guardar el evento en SQLite.
        await guardarEvento(sesion.email, evento.id);

        // Confirmación táctil: el evento ya está guardado.
        void confirmarAccion();

        // 2. Guardar el estado y horario iniciales.
        await actualizarSeguimientoEvento(
          sesion.email,
          evento.id,
          evento.estado,
          evento.inicio,
        );

        // 3. Actualizar el botón inmediatamente.
        setGuardado(true);

        // 3. Intentar programar el recordatorio.
        try {
          const notificacionId = await programarRecordatorioEvento(
            evento,
            sesion.email,
          );

          // 4. Asociar el recordatorio con el evento.
          if (notificacionId !== null) {
            await actualizarNotificacionGuardada(
              sesion.email,
              evento.id,
              notificacionId,
            );
          }
        } catch {
          // El evento queda guardado aunque falle
          // la programación del recordatorio.
          Alert.alert(
            "Evento guardado",
            "Guardamos el evento, pero no pudimos activar el recordatorio.",
          );
        }
      }
    } catch {
      Alert.alert(
        "Error",
        "No pudimos actualizar el evento guardado. Intentá nuevamente.",
      );
    } finally {
      setGuardando(false);
    }

    void sincronizarEventosGuardados(sesion.email).catch(() => {});
  }

  const mostrarImagen = evento?.imagenUrl != null && !imagenFallida;

  const descripcionLarga = (evento?.descripcion.length ?? 0) > 250;

  const botonInactivo = guardando || consultandoGuardado;

  const coloresEstado = {
    suspendido: { fondo: colores.advertenciaSuave, texto: colores.advertencia },
    cancelado: { fondo: colores.errorSuave, texto: colores.error },
    finalizado: { fondo: colores.borde, texto: colores.textoSecundario },
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Evento",
          headerStyle: { backgroundColor: colores.superficie },
          headerTintColor: colores.texto,
          headerTitleStyle: { fontFamily: fuentes.negrita, fontSize: 18 },
          headerShadowVisible: false,
        }}
      />

      {/* Cargando */}
      {estado.fase === "cargando" && (
        <View style={[estilos.centro, { backgroundColor: colores.fondo }]}>
          <ActivityIndicator size="large" color={colores.primarioFuerte} />

          <Texto style={{ fontSize: 15, color: colores.textoSecundario }}>
            Cargando evento...
          </Texto>
        </View>
      )}

      {/* Error */}
      {estado.fase === "error" && (
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
            {estado.mensaje}
          </Texto>

          {estado.reintentable && (
            <View style={{ alignSelf: "stretch", marginTop: 8 }}>
              <Boton
                titulo="Reintentar"
                onPress={() => setIntento((anterior) => anterior + 1)}
                accessibilityLabel="Reintentar cargar el evento"
              />
            </View>
          )}
        </View>
      )}

      {/* Detalle */}
      {estado.fase === "listo" && (
        <SafeAreaView
          style={[estilos.safeArea, { backgroundColor: colores.superficie }]}
          edges={["bottom"]}
        >
          <ScrollView
            contentContainerStyle={estilos.contenido}
            showsVerticalScrollIndicator={false}
          >
            {/* Imagen */}
            <View
              style={[
                estilos.contenedorImagen,
                { backgroundColor: colores.primarioSuave },
              ]}
            >
              {mostrarImagen ? (
                <Image
                  source={{ uri: estado.evento.imagenUrl! }}
                  style={estilos.imagen}
                  contentFit="cover"
                  transition={200}
                  onError={() => setImagenFallida(true)}
                />
              ) : (
                <View style={estilos.placeholder}>
                  <Ionicons
                    name="calendar-outline"
                    size={40}
                    color={colores.primarioFuerte}
                  />

                  <Texto
                    style={{ fontSize: 15, color: colores.textoSecundario }}
                  >
                    Imagen no disponible
                  </Texto>
                </View>
              )}
            </View>

            <View style={estilos.informacion}>
              {/* Título */}
              <Texto
                style={{ fontSize: 28, lineHeight: 34, fontWeight: "700" }}
              >
                {estado.evento.titulo}
              </Texto>

              {/* Fecha y horario en píldoras */}
              <View style={estilos.filaEtiquetas}>
                <View
                  style={[
                    estilos.etiqueta,
                    { backgroundColor: colores.primarioSuave },
                  ]}
                >
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={colores.primarioFuerte}
                  />
                  <Texto
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: colores.primarioFuerte,
                    }}
                  >
                    {formatearDia(new Date(estado.evento.inicio))}
                  </Texto>
                </View>

                <View
                  style={[
                    estilos.etiqueta,
                    { backgroundColor: colores.primarioSuave },
                  ]}
                >
                  <Ionicons
                    name="time"
                    size={16}
                    color={colores.primarioFuerte}
                  />
                  <Texto
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: colores.primarioFuerte,
                    }}
                  >
                    {formatearHora(new Date(estado.evento.inicio))}
                    {estado.evento.fin !== null &&
                      ` a ${formatearHora(new Date(estado.evento.fin))}`}
                  </Texto>
                </View>
              </View>

              {/* Estado del evento */}
              {estado.evento.estado !== "programado" && (
                <View
                  style={[
                    estilos.aviso,
                    {
                      backgroundColor:
                        coloresEstado[estado.evento.estado].fondo,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      ICONOS_ESTADO[estado.evento.estado] ??
                      "information-circle"
                    }
                    size={22}
                    color={coloresEstado[estado.evento.estado].texto}
                  />

                  <Texto
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: "700",
                      color: coloresEstado[estado.evento.estado].texto,
                    }}
                  >
                    {AVISOS_ESTADO[estado.evento.estado]}
                  </Texto>
                </View>
              )}

              <View
                style={[estilos.separador, { backgroundColor: colores.borde }]}
              />

              {/* Descripción */}
              <Texto style={{ fontSize: 20, fontWeight: "700" }}>
                Sobre este evento
              </Texto>

              <View style={{ gap: 8 }}>
                <Texto
                  numberOfLines={descripcionExpandida ? undefined : 5}
                  style={{
                    fontSize: 16,
                    lineHeight: 25,
                    color: colores.textoSecundario,
                  }}
                >
                  {estado.evento.descripcion}
                </Texto>

                {descripcionLarga && (
                  <Pressable
                    onPress={() =>
                      setDescripcionExpandida(!descripcionExpandida)
                    }
                    hitSlop={8}
                    role="button"
                    accessibilityLabel={
                      descripcionExpandida
                        ? "Leer menos descripción"
                        : "Leer descripción completa"
                    }
                    style={estilos.leerMas}
                  >
                    <Texto
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: colores.primarioFuerte,
                      }}
                    >
                      {descripcionExpandida ? "Leer menos" : "Leer más"}
                    </Texto>
                    <Ionicons
                      name={
                        descripcionExpandida ? "chevron-up" : "chevron-down"
                      }
                      size={16}
                      color={colores.primarioFuerte}
                    />
                  </Pressable>
                )}
              </View>

              <View
                style={[estilos.separador, { backgroundColor: colores.borde }]}
              />

              {/* Información del evento */}
              <Texto style={{ fontSize: 20, fontWeight: "700" }}>
                Información del evento
              </Texto>

              <FilaInformacion icono="calendar" etiqueta="Fecha">
                <Texto
                  style={[estilos.valor, { color: colores.textoSecundario }]}
                >
                  {formatearDia(new Date(estado.evento.inicio))}
                </Texto>
              </FilaInformacion>

              <Divisor />

              <FilaInformacion icono="time" etiqueta="Horario y duración">
                <Texto
                  style={[estilos.valor, { color: colores.textoSecundario }]}
                >
                  {formatearHora(new Date(estado.evento.inicio))}
                  {estado.evento.fin !== null &&
                    ` a ${formatearHora(new Date(estado.evento.fin))}`}
                </Texto>

                <Texto
                  style={[estilos.valor, { color: colores.textoSecundario }]}
                >
                  {formatearDuracion(
                    new Date(estado.evento.inicio),
                    estado.evento.fin === null
                      ? null
                      : new Date(estado.evento.fin),
                  )}
                </Texto>
              </FilaInformacion>

              <Divisor />

              <FilaInformacion icono="location" etiqueta="Ubicación">
                <Texto
                  style={[estilos.valor, { color: colores.textoSecundario }]}
                >
                  {estado.ubicacion}
                </Texto>
              </FilaInformacion>

              <Divisor />

              <FilaInformacion icono="ticket" etiqueta="Entrada">
                <Texto
                  style={[estilos.valor, { color: colores.textoSecundario }]}
                >
                  {formatearPrecio(estado.evento.precio)}
                </Texto>
              </FilaInformacion>

              {/* Guardar evento */}
              <Pressable
                style={[
                  estilos.botonGuardar,
                  guardado
                    ? {
                        backgroundColor: colores.primarioSuave,
                        borderWidth: 1.5,
                        borderColor: colores.primarioFuerte,
                      }
                    : { backgroundColor: colores.primario },
                  botonGuardarDeshabilitado && estilos.botonDeshabilitado,
                ]}
                onPress={alternarGuardado}
                disabled={botonGuardarDeshabilitado}
                role="button"
                accessibilityLabel={
                  guardado
                    ? "Quitar evento guardado"
                    : sePuedeGuardar
                      ? "Guardar evento"
                      : "Este evento no se puede guardar"
                }
                accessibilityState={{
                  disabled: botonGuardarDeshabilitado,
                  busy: botonInactivo,
                }}
              >
                {botonInactivo ? (
                  <ActivityIndicator
                    size="small"
                    color={colores.primarioFuerte}
                  />
                ) : (
                  <Ionicons
                    name={guardado ? "heart" : "heart-outline"}
                    size={22}
                    color={
                      guardado ? colores.primarioFuerte : colores.sobrePrimario
                    }
                  />
                )}

                <Texto
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: guardado
                      ? colores.primarioFuerte
                      : colores.sobrePrimario,
                  }}
                >
                  {consultandoGuardado
                    ? "Comprobando..."
                    : guardando
                      ? "Guardando..."
                      : guardado
                        ? "Evento guardado"
                        : sePuedeGuardar
                          ? "Guardar evento"
                          : "No se puede guardar"}
                </Texto>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
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

  contenido: { paddingBottom: 32 },

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

  contenedorImagen: { height: 240 },

  imagen: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  informacion: {
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

  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
  },

  separador: {
    height: 1,
    marginVertical: 12,
  },

  leerMas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
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

  botonGuardar: {
    minHeight: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 16,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },
});
