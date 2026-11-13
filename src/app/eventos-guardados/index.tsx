import Ionicons from "@react-native-vector-icons/ionicons";
import { Link, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import { comprobarCambiosAgenda } from "../../servicios/seguimientoAgenda";

import { obtenerEventosApi } from "../../api/eventos";
import { obtenerEventosGuardadosApi } from "../../api/eventosGuardados";
import { obtenerLugaresApi } from "../../api/lugares";
import { BloqueoSesion } from "../../components/BloqueoSesion";
import { TarjetaEvento } from "../../components/TarjetaEvento";
import Boton from "../../components/ui/Boton";
import PantallaCarga from "../../components/ui/PantallaCarga";
import Texto from "../../components/ui/Texto";
import { useSesion } from "../../contextos/SesionContext";
import {
  obtenerEventosGuardados,
  sincronizarEventosGuardados,
} from "../../servicios/eventosGuardados";
import { useTema } from "../../tema/TemaContext";
import { fuentes } from "../../tema/tipografia";
import type { Evento } from "../../tipos/evento";
import type { Lugar } from "../../tipos/lugar";
import {
  armarSecciones,
  SeccionAgenda,
  textoUbicacion,
} from "../../utils/agenda";
import { claveDia, tituloDia } from "../../utils/fechas";

function armarSeccionesAnteriores(
  eventos: Evento[],
  lugares: Lugar[],
  ahora: Date = new Date(),
): SeccionAgenda[] {
  const claveHoy = claveDia(ahora);

  const anteriores = eventos
    .filter((evento) => claveDia(new Date(evento.inicio)) < claveHoy)
    .sort(
      (a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime(),
    );

  const secciones: SeccionAgenda[] = [];

  for (const evento of anteriores) {
    const inicio = new Date(evento.inicio);
    const clave = `anterior-${claveDia(inicio)}`;

    const item = {
      evento,
      ubicacion: textoUbicacion(evento, lugares),
    };

    const ultima = secciones[secciones.length - 1];

    if (ultima && ultima.clave === clave) {
      ultima.data.push(item);
    } else {
      secciones.push({
        clave,
        title: `Días anteriores · ${tituloDia(inicio, ahora)}`,
        data: [item],
      });
    }
  }

  return secciones;
}

export default function EventosGuardadosScreen() {
  const { colores } = useTema();
  const { sesion, cargando: cargandoSesion, bloqueada } = useSesion();

  const [secciones, setSecciones] = useState<SeccionAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarGuardados = useCallback(async () => {
    if (!sesion || bloqueada) {
      setSecciones([]);

      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      try {
        await sincronizarEventosGuardados(sesion.email);
      } catch {}

      const [idsGuardados, respuestaEventos, respuestaLugares] =
        await Promise.all([
          obtenerEventosGuardados(sesion.email),
          obtenerEventosApi(),
          obtenerLugaresApi(),
        ]);

      const eventosPorId = new Map<string, Evento>();

      for (const evento of respuestaEventos.datos) {
        eventosPorId.set(evento.id, evento);
      }

      try {
        const eventosRemotos = await obtenerEventosGuardadosApi();

        for (const evento of eventosRemotos) {
          eventosPorId.set(evento.id, evento);
        }
      } catch {}

      const guardados = new Set(idsGuardados);

      const eventosGuardados = [...eventosPorId.values()].filter((evento) =>
        guardados.has(evento.id),
      );

      setSecciones([
        ...armarSecciones(eventosGuardados, respuestaLugares.datos),
        ...armarSeccionesAnteriores(eventosGuardados, respuestaLugares.datos),
      ]);
      try {
        await comprobarCambiosAgenda(sesion.email, respuestaEventos.datos);
      } catch (error) {
        console.error("ERROR AL COMPROBAR CAMBIOS DE AGENDA:", error);
      }
    } catch {
      setError("No pudimos cargar tus eventos guardados. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  }, [sesion?.email, bloqueada]);

  useFocusEffect(
    useCallback(() => {
      void cargarGuardados();
    }, [cargarGuardados]),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Mis eventos",
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
        <View style={[estilos.centrado, { backgroundColor: colores.fondo }]}>
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

          <Texto style={estilos.titulo}>
            Tus eventos guardados son personales
          </Texto>

          <Texto style={[estilos.texto, { color: colores.textoSecundario }]}>
            Iniciá sesión para guardar eventos y recibir recordatorios.
          </Texto>

          <View style={estilos.accion}>
            <Link href="/login" asChild>
              <Boton
                titulo="Iniciar sesión"
                accessibilityLabel="Iniciar sesión"
              />
            </Link>
          </View>
        </View>
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(item) => item.evento.id}
          style={{ backgroundColor: colores.fondo }}
          contentContainerStyle={estilos.lista}
          stickySectionHeadersEnabled
          refreshing={cargando}
          onRefresh={() => void cargarGuardados()}
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
                  name={
                    section.clave.startsWith("anterior-") ? "time" : "calendar"
                  }
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
            cargando ? (
              <PantallaCarga titulo="Cargando eventos guardados..." />
            ) : error ? (
              <View style={estilos.centrado}>
                <View
                  style={[
                    estilos.circuloEstado,
                    { backgroundColor: colores.errorSuave },
                  ]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={32}
                    color={colores.error}
                  />
                </View>

                <Texto style={[estilos.titulo, { color: colores.error }]}>
                  No pudimos cargar tus eventos guardados
                </Texto>

                <Texto
                  style={[estilos.texto, { color: colores.textoSecundario }]}
                >
                  {error}
                </Texto>

                <View style={estilos.accion}>
                  <Boton
                    titulo="Reintentar"
                    onPress={() => void cargarGuardados()}
                    accessibilityLabel="Reintentar cargar los eventos guardados"
                  />
                </View>
              </View>
            ) : (
              <View style={estilos.centrado}>
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

                <Texto style={estilos.titulo}>
                  Todavía no guardaste eventos
                </Texto>

                <Texto
                  style={[estilos.texto, { color: colores.textoSecundario }]}
                >
                  Mirá la agenda y guardá los eventos a los que quieras ir.
                </Texto>

                <View style={estilos.accion}>
                  <Link href="/agenda" asChild>
                    <Boton
                      titulo="Ver la agenda"
                      accessibilityLabel="Ver la agenda"
                    />
                  </Link>
                </View>
              </View>
            )
          }
        />
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  lista: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
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
  centrado: {
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
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  accion: {
    alignSelf: "stretch",
    marginTop: 8,
  },
});
