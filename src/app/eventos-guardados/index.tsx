import Ionicons from "@react-native-vector-icons/ionicons";
import { Link, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { comprobarCambiosAgenda } from "../../servicios/seguimientoAgenda";

import { obtenerEventosApi } from "../../api/eventos";
import { obtenerEventosGuardadosApi } from "../../api/eventosGuardados";
import { obtenerLugaresApi } from "../../api/lugares";
import { BloqueoSesion } from "../../components/BloqueoSesion";
import { TarjetaEvento } from "../../components/TarjetaEvento";
import { useSesion } from "../../contextos/SesionContext";
import {
  obtenerEventosGuardados,
  sincronizarEventosGuardados,
} from "../../servicios/eventosGuardados";
import type { Evento } from "../../tipos/evento";
import type { Lugar } from "../../tipos/lugar";
import {
  armarSecciones,
  SeccionAgenda,
  textoUbicacion,
} from "../../utils/agenda";
import { claveDia, tituloDia } from "../../utils/fechas";

const AZUL = "#075985";

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

          <Text style={styles.tituloVacio}>
            Tus eventos guardados son personales
          </Text>

          <Text style={styles.textoSecundario}>
            Iniciá sesión para guardar eventos y recibir recordatorios.
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
        <SectionList
          sections={secciones}
          keyExtractor={(item) => item.evento.id}
          contentContainerStyle={styles.lista}
          stickySectionHeadersEnabled
          refreshing={cargando}
          onRefresh={() => void cargarGuardados()}
          renderSectionHeader={({ section }) => (
            <Text style={styles.encabezadoDia} accessibilityRole="header">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <TarjetaEvento evento={item.evento} ubicacion={item.ubicacion} />
          )}
          SectionSeparatorComponent={() => <View style={styles.separador} />}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListEmptyComponent={
            cargando ? (
              <View style={styles.estado}>
                <ActivityIndicator size="large" color={AZUL} />
                <Text style={styles.textoSecundario}>
                  Cargando eventos guardados...
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
                  No pudimos cargar tus eventos guardados
                </Text>

                <Text style={styles.textoSecundario}>{error}</Text>

                <Pressable
                  style={styles.botonPrincipal}
                  onPress={() => void cargarGuardados()}
                  accessibilityRole="button"
                  accessibilityLabel="Reintentar cargar los eventos guardados"
                >
                  <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.estado}>
                <Ionicons name="heart-outline" size={64} color="#94A3B8" />

                <Text style={styles.tituloVacio}>
                  Todavía no guardaste eventos
                </Text>

                <Text style={styles.textoSecundario}>
                  Mirá la agenda y guardá los eventos a los que quieras ir.
                </Text>

                <Link href="/agenda" asChild>
                  <Pressable
                    style={styles.botonPrincipal}
                    accessibilityRole="button"
                    accessibilityLabel="Ver la agenda"
                  >
                    <Text style={styles.textoBotonPrincipal}>
                      Ver la agenda
                    </Text>
                  </Pressable>
                </Link>
              </View>
            )
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  lista: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#F8FAFC",
  },
  encabezadoDia: {
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#17202A",
    backgroundColor: "#F8FAFC",
  },
  separador: {
    height: 10,
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
