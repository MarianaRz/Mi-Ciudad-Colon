import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import Ionicons from "@react-native-vector-icons/ionicons";

import { EstadoEvento, Evento } from "../tipos/evento";
import { formatearHora } from "../utils/fechas";

interface TarjetaEventoProps {
  evento: Evento;
  ubicacion: string;
}

const ETIQUETAS_ESTADO: Record<EstadoEvento, string> = {
  programado: "Programado",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

const COLORES_ESTADO: Record<EstadoEvento, { fondo: string; texto: string }> = {
  programado: {
    fondo: "#E0F2FE",
    texto: "#075985",
  },
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

function textoPrecio(precio: number | null): string {
  if (precio === null) return "Precio a confirmar";
  if (precio === 0) return "Gratis";

  return `$${precio.toLocaleString("es-AR")}`;
}

export function TarjetaEvento({ evento, ubicacion }: TarjetaEventoProps) {
  const [imagenFallida, setImagenFallida] = useState(false);

  const inicio = new Date(evento.inicio);

  const fin = evento.fin === null ? null : new Date(evento.fin);

  const horario =
    fin === null
      ? formatearHora(inicio)
      : `${formatearHora(inicio)} – ${formatearHora(fin)}`;

  const noProgramado = evento.estado !== "programado";

  const colores = COLORES_ESTADO[evento.estado];

  const mostrarImagen = evento.imagenUrl !== null && !imagenFallida;

  return (
    <Link
      href={{
        pathname: "/eventos/[id]",
        params: { id: evento.id },
      }}
      asChild
    >
      <Pressable
        style={StyleSheet.flatten([
          styles.tarjeta,
          noProgramado && styles.atenuada,
        ])}
        accessibilityRole="button"
        accessibilityLabel={`${evento.titulo}. ${horario}. ${ubicacion}. ${textoPrecio(evento.precio)}. ${ETIQUETAS_ESTADO[evento.estado]}`}
      >
        <View style={styles.contenedorImagen}>
          {mostrarImagen ? (
            <Image
              source={{ uri: evento.imagenUrl! }}
              style={styles.imagen}
              contentFit="cover"
              transition={200}
              onError={() => setImagenFallida(true)}
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="calendar-outline" size={42} color="#075985" />

              <Text style={styles.textoPlaceholder}>Imagen no disponible</Text>
            </View>
          )}

          {noProgramado && (
            <View style={[styles.estado, { backgroundColor: colores.fondo }]}>
              <Text style={[styles.textoEstado, { color: colores.texto }]}>
                {ETIQUETAS_ESTADO[evento.estado]}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contenido}>
          <View style={styles.fila}>
            <Ionicons name="time-outline" size={18} color="#075985" />

            <Text style={styles.horario}>{horario}</Text>
          </View>

          <Text style={styles.titulo} numberOfLines={2}>
            {evento.titulo}
          </Text>

          <View style={styles.fila}>
            <Ionicons name="location-outline" size={18} color="#64748B" />

            <Text style={styles.ubicacion} numberOfLines={2}>
              {ubicacion}
            </Text>
          </View>

          <View style={styles.filaInferior}>
            <View style={styles.fila}>
              <Ionicons name="ticket-outline" size={18} color="#075985" />

              <Text style={styles.precio}>{textoPrecio(evento.precio)}</Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color="#64748B" />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  atenuada: {
    opacity: 0.8,
  },

  contenedorImagen: {
    height: 170,
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
    gap: 8,
    backgroundColor: "#E8EEF4",
  },

  textoPlaceholder: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },

  estado: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  textoEstado: {
    fontSize: 13,
    fontWeight: "700",
  },

  contenido: {
    padding: 16,
    gap: 12,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  horario: {
    fontSize: 15,
    fontWeight: "700",
    color: "#075985",
  },

  titulo: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 26,
    color: "#17202A",
  },

  ubicacion: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },

  filaInferior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  precio: {
    fontSize: 15,
    fontWeight: "700",
    color: "#17202A",
  },
});
