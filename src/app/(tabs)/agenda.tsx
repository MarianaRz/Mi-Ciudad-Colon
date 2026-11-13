import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useConectividad } from "../../hooks/useConectividad";
import { sincronizarEventosGuardados } from "../../servicios/eventosGuardados";

import { SectionList, StyleSheet, View } from "react-native";

import { obtenerEventosApi } from "../../api/eventos";
import { obtenerLugaresApi } from "../../api/lugares";
import { TarjetaEvento } from "../../components/TarjetaEvento";
import Boton from "../../components/ui/Boton";
import PantallaCarga from "../../components/ui/PantallaCarga";
import Texto from "../../components/ui/Texto";
import { useSesion } from "../../contextos/SesionContext";
import { comprobarCambiosAgenda } from "../../servicios/seguimientoAgenda";
import { useTema } from "../../tema/TemaContext";
import { armarSecciones, SeccionAgenda } from "../../utils/agenda";

type EstadoAgenda =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | { fase: "listo"; secciones: SeccionAgenda[] };

export default function AgendaScreen() {
  const { colores } = useTema();
  const { sesion, cargando: cargandoSesion, bloqueada } = useSesion();

  const [estado, setEstado] = useState<EstadoAgenda>({
    fase: "cargando",
  });

  const [intento, setIntento] = useState(0);

  const conectividad = useConectividad();

  useEffect(() => {
    if (
      conectividad !== "conectado" ||
      cargandoSesion ||
      !sesion ||
      bloqueada
    ) {
      return;
    }

    void sincronizarEventosGuardados(sesion.email).catch(() => {});
  }, [conectividad, cargandoSesion, sesion?.email, bloqueada]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      async function cargarAgenda() {
        setEstado({ fase: "cargando" });

        try {
          const [respuestaEventos, respuestaLugares] = await Promise.all([
            obtenerEventosApi(),
            obtenerLugaresApi(),
          ]);

          if (!activo) {
            return;
          }

          // Mostrar los eventos aunque falle la comprobación
          // de notificaciones o seguimiento.
          setEstado({
            fase: "listo",
            secciones: armarSecciones(
              respuestaEventos.datos,
              respuestaLugares.datos,
            ),
          });

          // Los eventos son públicos, pero el seguimiento
          // corresponde a los eventos guardados por cada usuario.
          if (!cargandoSesion && sesion) {
            if (!bloqueada) {
              try {
                await sincronizarEventosGuardados(sesion.email);
              } catch {}
            }

            try {
              await comprobarCambiosAgenda(
                sesion.email,
                respuestaEventos.datos,
              );
            } catch (error) {
              console.error("ERROR AL COMPROBAR CAMBIOS DE AGENDA:", error);
            }
          }
        } catch (error) {
          if (!activo) {
            return;
          }

          const mensaje =
            error instanceof Error
              ? error.message
              : "Ocurrió un error al cargar la agenda.";

          setEstado({
            fase: "error",
            mensaje,
          });
        }
      }

      void cargarAgenda();

      return () => {
        activo = false;
      };
    }, [intento, sesion?.email, cargandoSesion, bloqueada]),
  );

  if (estado.fase === "cargando") {
    return <PantallaCarga titulo="Cargando agenda..." />;
  }

  if (estado.fase === "error") {
    return (
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
          No pudimos cargar la agenda
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
            accessibilityLabel="Reintentar cargar la agenda"
          />
        </View>
      </View>
    );
  }

  return (
    <SectionList
      sections={estado.secciones}
      keyExtractor={(item) => item.evento.id}
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={estilos.lista}
      stickySectionHeadersEnabled
      ListHeaderComponent={
        conectividad === "sin-conexion" ? (
          <View
            style={[
              estilos.tarjetaConexion,
              { backgroundColor: colores.advertenciaSuave },
            ]}
          >
            <View
              style={[
                estilos.circuloConexion,
                { backgroundColor: colores.superficie },
              ]}
            >
              <Ionicons
                name="cloud-offline"
                size={22}
                color={colores.advertencia}
              />
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <Texto
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: colores.advertencia,
                }}
              >
                Sin conexión
              </Texto>

              <Texto style={{ fontSize: 13, color: colores.textoSecundario }}>
                Te mostramos la última agenda guardada en este teléfono.
              </Texto>
            </View>
          </View>
        ) : null
      }
      renderSectionHeader={({ section }) => (
        <View
          style={[estilos.encabezado, { backgroundColor: colores.fondo }]}
          accessibilityRole="header"
        >
          <View
            style={[
              estilos.iconoEncabezado,
              { backgroundColor: colores.primarioSuave },
            ]}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={colores.primarioFuerte}
            />
          </View>

          <Texto style={{ fontSize: 17, fontWeight: "700" }}>
            {section.title}
          </Texto>
        </View>
      )}
      renderItem={({ item }) => (
        <TarjetaEvento evento={item.evento} ubicacion={item.ubicacion} />
      )}
      SectionSeparatorComponent={() => <View style={estilos.separador} />}
      ItemSeparatorComponent={() => <View style={estilos.separador} />}
      ListEmptyComponent={
        <View style={estilos.centro}>
          <View
            style={[
              estilos.circuloEstado,
              { backgroundColor: colores.primarioSuave },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={32}
              color={colores.primarioFuerte}
            />
          </View>

          <Texto
            style={{ fontSize: 18, fontWeight: "700", textAlign: "center" }}
          >
            No hay eventos próximos
          </Texto>

          <Texto
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: colores.textoSecundario,
              textAlign: "center",
            }}
          >
            Volvé a mirar más adelante: se van sumando actividades.
          </Texto>
        </View>
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    flexGrow: 1,
    padding: 16,
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
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

  circuloEstado: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  tarjetaConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },

  circuloConexion: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
