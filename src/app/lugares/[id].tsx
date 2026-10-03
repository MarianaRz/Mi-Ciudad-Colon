import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { obtenerLugarPorId } from "../../servicios/lugares";
import { Lugar } from "../../tipos/lugar";
import { obtenerEstadoHorario } from "../../utils/horarios";
import { obtenerCategorias } from "../../servicios/categorias";
import { Categoria } from "../../tipos/categoria";

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

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarLugar() {
      try {
        const resultado = await obtenerLugarPorId(id);
        setLugar(resultado);
        const respuestaCategorias = await obtenerCategorias();

        const categoriaEncontrada =
          respuestaCategorias.datos.find(
            (item) => item.id === resultado.categoriaId,
          ) ?? null;

        setCategoria(categoriaEncontrada);
      } catch (error) {
        const mensaje =
          error instanceof Error
            ? error.message
            : "Ocurrió un error al cargar el lugar.";

        setError(mensaje);
      } finally {
        setCargando(false);
      }
    }

    cargarLugar();
  }, [id]);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <Text>Cargando lugar...</Text>
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
      ? "Entrada gratis"
      : lugar.precioEntrada === null
        ? "Precio no informado"
        : `Entrada: $${lugar.precioEntrada}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: lugar.nombre,
          headerStyle: {
            backgroundColor: "#075985",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700",
          },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.contenido}>
          {lugar.imagenes.length > 0 && (
            <Image
              source={lugar.imagenes[0]}
              style={styles.imagen}
              contentFit="cover"
              transition={200}
              alt={`Imagen de ${lugar.nombre}`}
            />
          )}
          <Text style={styles.categoria}>
            {categoria?.nombre ?? "Categoría no disponible"}
          </Text>

          <Text style={styles.titulo}>{lugar.nombre}</Text>

          <Text
            style={[
              styles.estadoHorario,
              estadoHorario.abierto ? styles.abierto : styles.cerrado,
            ]}
          >
            {estadoHorario.texto}
          </Text>

          <Text style={styles.descripcion}>{lugar.descripcion}</Text>

          <View style={styles.seccion}>
            <Text style={styles.etiqueta}>Dirección</Text>
            <Text>{lugar.direccion}</Text>
            <View style={styles.seccion}>
              <Text style={styles.etiqueta}>Horarios</Text>

              {lugar.horarios.length > 0 ? (
                lugar.horarios.map((horario) => (
                  <Text key={`${horario.dia}-${horario.abre}`}>
                    {nombresDias[horario.dia]}: {horario.abre} -{" "}
                    {horario.cierra}
                  </Text>
                ))
              ) : (
                <Text>Horario no informado</Text>
              )}
            </View>
          </View>

          <View style={styles.seccion}>
            <Text style={styles.etiqueta}>Entrada</Text>
            <Text>{textoPrecio}</Text>
          </View>

          <View style={styles.seccion}>
            <Text style={styles.etiqueta}>Accesibilidad</Text>
            <Text>
              {lugar.accesible
                ? "Accesible para silla de ruedas"
                : "No indicado como accesible para silla de ruedas"}
            </Text>
          </View>

          {lugar.telefono && (
            <View style={styles.seccion}>
              <Text style={styles.etiqueta}>Teléfono</Text>
              <Text>{lugar.telefono}</Text>
            </View>
          )}

          {lugar.audioguia && (
            <View style={styles.seccion}>
              <Text style={styles.etiqueta}>Audioguía disponible</Text>
              <Text>
                Duración: {Math.floor(lugar.audioguia.duracionSegundos / 60)}{" "}
                min
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contenido: {
    padding: 20,
    gap: 16,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  categoria: {
    color: "#0B5394",
    fontWeight: "600",
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
  },
  descripcion: {
    fontSize: 16,
    lineHeight: 24,
  },
  seccion: {
    gap: 6,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  etiqueta: {
    fontWeight: "700",
    fontSize: 16,
    color: "#17202A",
  },
  imagen: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  estadoHorario: {
    fontSize: 16,
    fontWeight: "700",
  },

  abierto: {
    color: "#167A3E",
  },

  cerrado: {
    color: "#B42318",
  },
});
