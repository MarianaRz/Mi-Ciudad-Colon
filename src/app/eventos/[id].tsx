import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

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

import { useSesion } from "../../contextos/SesionContext";

import { obtenerEventoPorId } from "../../servicios/eventos";

import {
  actualizarNotificacionGuardada,
  actualizarSeguimientoEvento,
  estaEventoGuardado,
  guardarEvento,
  obtenerNotificacionGuardada,
  quitarEventoGuardado,
} from "../../servicios/eventosGuardados";
import { obtenerLugarPorId } from "../../servicios/lugares";
import {
  cancelarRecordatorio,
  cancelarRecordatoriosEvento,
  programarRecordatorioEvento,
} from "../../servicios/notificaciones";
import { Evento } from "../../tipos/evento";

import {
  formatearDia,
  formatearDuracion,
  formatearHora,
} from "../../utils/fechas";

type EstadoDetalle =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | { fase: "listo"; evento: Evento; ubicacion: string };

const AVISOS_ESTADO: Partial<Record<Evento["estado"], string>> = {
  suspendido: "Este evento fue suspendido.",
  cancelado: "Este evento fue cancelado.",
  finalizado: "Este evento ya finalizó.",
};

const COLORES_ESTADO = {
  suspendido: {
    fondo: "#FEF0C7",
    texto: "#93370D",
  },
  cancelado: {
    fondo: "#FEE4E2",
    texto: "#B42318",
  },
  finalizado: {
    fondo: "#F2F4F7",
    texto: "#475467",
  },
};

function formatearPrecio(precio: number | null): string {
  if (precio === null) return "Precio a confirmar";
  if (precio === 0) return "Entrada gratuita";

  return `$${precio.toLocaleString("es-AR")}`;
}

export default function DetalleEventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { sesion, cargando: cargandoSesion } = useSesion();

  const [estado, setEstado] = useState<EstadoDetalle>({
    fase: "cargando",
  });

  const [imagenFallida, setImagenFallida] = useState(false);

  const [descripcionExpandida, setDescripcionExpandida] = useState(false);

  const [guardado, setGuardado] = useState(false);

  const [consultandoGuardado, setConsultandoGuardado] = useState(true);

  const [guardando, setGuardando] = useState(false);

  // Cargar los datos del evento
  useEffect(() => {
    let activo = true;

    async function cargarEvento() {
      setEstado({ fase: "cargando" });
      setImagenFallida(false);
      setDescripcionExpandida(false);

      try {
        const evento = await obtenerEventoPorId(id);

        let ubicacion = evento.direccionLibre ?? "Ubicación a confirmar";

        if (evento.lugarId !== null) {
          try {
            const lugar = await obtenerLugarPorId(evento.lugarId);
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

        setEstado({
          fase: "error",
          mensaje,
        });
      }
    }

    cargarEvento();

    return () => {
      activo = false;
    };
  }, [id]);

  // Consultar si el evento está guardado en SQLite
  useEffect(() => {
    let activo = true;

    async function consultarGuardado() {
      setConsultandoGuardado(true);
      setGuardado(false);

      if (cargandoSesion) {
        return;
      }

      if (!sesion || !id) {
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
    }

    consultarGuardado();

    return () => {
      activo = false;
    };
  }, [id, sesion?.email, cargandoSesion]);

  const evento = estado.fase === "listo" ? estado.evento : null;

  // Guardar o quitar un evento
  async function alternarGuardado() {
    if (!evento || guardando || consultandoGuardado) {
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
      } else {
        // 1. Guardar el evento en SQLite.
        await guardarEvento(sesion.email, evento.id);

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
  }

  const mostrarImagen = evento?.imagenUrl != null && !imagenFallida;

  const descripcionLarga = (evento?.descripcion.length ?? 0) > 250;

  return (
    <>
      <Stack.Screen options={{ title: "Evento" }} />

      {/* Cargando */}
      {estado.fase === "cargando" && (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#075985" />

          <Text style={styles.textoCentro}>Cargando evento...</Text>
        </View>
      )}

      {/* Error */}
      {estado.fase === "error" && (
        <View style={styles.centro}>
          <Ionicons name="alert-circle-outline" size={42} color="#B42318" />

          <Text style={styles.textoCentro}>{estado.mensaje}</Text>
        </View>
      )}

      {/* Detalle */}
      {estado.fase === "listo" && (
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          <ScrollView
            contentContainerStyle={styles.contenido}
            showsVerticalScrollIndicator={false}
          >
            {/* Imagen */}
            <View style={styles.contenedorImagen}>
              {mostrarImagen ? (
                <Image
                  source={{ uri: estado.evento.imagenUrl! }}
                  style={styles.imagen}
                  contentFit="cover"
                  transition={200}
                  onError={() => setImagenFallida(true)}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="calendar-outline" size={38} color="#075985" />

                  <Text style={styles.textoPlaceholder}>
                    Imagen no disponible
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.informacion}>
              {/* Título */}
              <Text style={styles.titulo}>{estado.evento.titulo}</Text>

              {/* Estado del evento */}
              {estado.evento.estado !== "programado" && (
                <View
                  style={[
                    styles.aviso,
                    {
                      backgroundColor:
                        COLORES_ESTADO[estado.evento.estado].fondo,
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={COLORES_ESTADO[estado.evento.estado].texto}
                  />

                  <Text
                    style={[
                      styles.textoAviso,
                      {
                        color: COLORES_ESTADO[estado.evento.estado].texto,
                      },
                    ]}
                  >
                    {AVISOS_ESTADO[estado.evento.estado]}
                  </Text>
                </View>
              )}

              {/* Descripción */}
              <View style={styles.descripcionContenedor}>
                <Text
                  style={styles.descripcion}
                  numberOfLines={descripcionExpandida ? undefined : 5}
                >
                  {estado.evento.descripcion}
                </Text>

                {descripcionLarga && (
                  <Pressable
                    onPress={() =>
                      setDescripcionExpandida(!descripcionExpandida)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      descripcionExpandida
                        ? "Leer menos descripción"
                        : "Leer descripción completa"
                    }
                  >
                    <Text style={styles.leerMas}>
                      {descripcionExpandida ? "Leer menos" : "Leer más"}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Información del evento */}
              <View style={styles.tarjetaDatos}>
                {/* Fecha */}
                <View style={styles.filaDato}>
                  <View style={styles.icono}>
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color="#075985"
                    />
                  </View>

                  <View style={styles.textosDato}>
                    <Text style={styles.etiqueta}>Fecha</Text>

                    <Text style={styles.valor}>
                      {formatearDia(new Date(estado.evento.inicio))}
                    </Text>
                  </View>
                </View>

                <View style={styles.divisor} />

                {/* Horario */}
                <View style={styles.filaDato}>
                  <View style={styles.icono}>
                    <Ionicons name="time-outline" size={22} color="#075985" />
                  </View>

                  <View style={styles.textosDato}>
                    <Text style={styles.etiqueta}>Horario y duración</Text>

                    <Text style={styles.valor}>
                      {formatearHora(new Date(estado.evento.inicio))}
                      {estado.evento.fin !== null &&
                        ` a ${formatearHora(new Date(estado.evento.fin))}`}
                    </Text>

                    <Text style={styles.detalle}>
                      {formatearDuracion(
                        new Date(estado.evento.inicio),
                        estado.evento.fin === null
                          ? null
                          : new Date(estado.evento.fin),
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.divisor} />

                {/* Ubicación */}
                <View style={styles.filaDato}>
                  <View style={styles.icono}>
                    <Ionicons
                      name="location-outline"
                      size={22}
                      color="#075985"
                    />
                  </View>

                  <View style={styles.textosDato}>
                    <Text style={styles.etiqueta}>Ubicación</Text>

                    <Text style={styles.valor}>{estado.ubicacion}</Text>
                  </View>
                </View>

                <View style={styles.divisor} />

                {/* Precio */}
                <View style={styles.filaDato}>
                  <View style={styles.icono}>
                    <Ionicons name="ticket-outline" size={22} color="#075985" />
                  </View>

                  <View style={styles.textosDato}>
                    <Text style={styles.etiqueta}>Entrada</Text>

                    <Text style={styles.valor}>
                      {formatearPrecio(estado.evento.precio)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Guardar evento */}
              <Pressable
                style={[
                  styles.botonGuardar,
                  guardado && styles.botonGuardado,
                  (guardando || consultandoGuardado) &&
                    styles.botonDeshabilitado,
                ]}
                onPress={alternarGuardado}
                disabled={guardando || consultandoGuardado}
                accessibilityRole="button"
                accessibilityLabel={
                  guardado ? "Quitar evento guardado" : "Guardar evento"
                }
                accessibilityState={{
                  disabled: guardando || consultandoGuardado,
                }}
              >
                <Ionicons
                  name={guardado ? "heart" : "heart-outline"}
                  size={22}
                  color={guardado ? "#075985" : "#FFFFFF"}
                />

                <Text
                  style={[
                    styles.textoBotonGuardar,
                    guardado && styles.textoBotonGuardado,
                  ]}
                >
                  {consultandoGuardado
                    ? "Comprobando..."
                    : guardando
                      ? "Guardando..."
                      : guardado
                        ? "Evento guardado"
                        : "Guardar evento"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  contenido: {
    paddingBottom: 32,
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#F8FAFC",
  },

  textoCentro: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },

  contenedorImagen: {
    height: 180,
    backgroundColor: "#E8EEF4",
  },

  imagen: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#E8EEF4",
  },

  textoPlaceholder: {
    fontSize: 14,
    color: "#64748B",
  },

  informacion: {
    padding: 20,
    gap: 20,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 31,
    color: "#17202A",
  },

  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },

  textoAviso: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },

  descripcionContenedor: {
    gap: 8,
  },

  descripcion: {
    fontSize: 16,
    lineHeight: 25,
    color: "#334155",
  },

  leerMas: {
    fontSize: 15,
    fontWeight: "700",
    color: "#075985",
  },

  tarjetaDatos: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 16,
  },

  filaDato: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  icono: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  textosDato: {
    flex: 1,
    gap: 4,
  },

  etiqueta: {
    fontSize: 14,
    color: "#64748B",
  },

  valor: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17202A",
  },

  detalle: {
    fontSize: 14,
    color: "#64748B",
  },

  divisor: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },

  botonGuardar: {
    minHeight: 56,
    backgroundColor: "#075985",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  botonGuardado: {
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#075985",
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  textoBotonGuardar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  textoBotonGuardado: {
    color: "#075985",
  },
});
