import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { TarjetaEvento } from "../../components/TarjetaEvento";
import { obtenerEventos } from "../../servicios/eventos";
import { obtenerLugares } from "../../servicios/lugares";
import { armarSecciones, SeccionAgenda } from "../../utils/agenda";

type EstadoAgenda =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | { fase: "listo"; secciones: SeccionAgenda[] };

export default function AgendaScreen() {
  const [estado, setEstado] = useState<EstadoAgenda>({ fase: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargarAgenda() {
      setEstado({ fase: "cargando" });

      try {
        const [respuestaEventos, respuestaLugares] = await Promise.all([
          obtenerEventos(),
          obtenerLugares(),
        ]);

        if (!activo) return;

        setEstado({
          fase: "listo",
          secciones: armarSecciones(
            respuestaEventos.datos,
            respuestaLugares.datos,
          ),
        });
      } catch (error) {
        if (!activo) return;

        const mensaje =
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cargar la agenda.";

        setEstado({ fase: "error", mensaje });
      }
    }

    cargarAgenda();

    return () => {
      activo = false;
    };
  }, [intento]);

  if (estado.fase === "cargando") {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#075985" />
        <Text style={styles.textoCentro}>Cargando agenda...</Text>
      </View>
    );
  }

  if (estado.fase === "error") {
    return (
      <View style={styles.centro}>
        <Text style={styles.tituloCentro}>No pudimos cargar la agenda</Text>
        <Text style={styles.textoCentro}>{estado.mensaje}</Text>

        <Pressable
          style={styles.botonReintentar}
          onPress={() => setIntento((anterior) => anterior + 1)}
          role="button"
          accessibilityLabel="Reintentar cargar la agenda"
        >
          <Text style={styles.textoBotonReintentar}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SectionList
      sections={estado.secciones}
      keyExtractor={(item) => item.evento.id}
      contentContainerStyle={styles.lista}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) => (
        <Text style={styles.encabezado} role="heading">
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <TarjetaEvento evento={item.evento} ubicacion={item.ubicacion} />
      )}
      SectionSeparatorComponent={() => <View style={styles.separador} />}
      ItemSeparatorComponent={() => <View style={styles.separador} />}
      ListEmptyComponent={
        <View style={styles.centro}>
          <Text style={styles.tituloCentro}>No hay eventos próximos</Text>
          <Text style={styles.textoCentro}>
            Volvé a mirar más adelante: se van sumando actividades.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#F8FAFC",
  },
  encabezado: {
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#17202A",
    backgroundColor: "#F8FAFC",
  },
  separador: {
    height: 10,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#F8FAFC",
  },
  tituloCentro: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
    textAlign: "center",
  },
  textoCentro: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5F6B76",
    textAlign: "center",
  },
  botonReintentar: {
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#075985",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonReintentar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
