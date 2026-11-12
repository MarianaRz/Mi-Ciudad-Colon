import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";

import { Pressable, StyleSheet, View } from "react-native";

import { useTema } from "../tema/TemaContext";
import { EstadoEvento, Evento } from "../tipos/evento";
import { formatearHora } from "../utils/fechas";
import Texto from "./ui/Texto";

interface TarjetaEventoProps {
  evento: Evento;
  ubicacion: string;
}

type NombreIcono = React.ComponentProps<typeof Ionicons>["name"];

const ETIQUETAS_ESTADO: Record<EstadoEvento, string> = {
  programado: "Programado",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

const ICONOS_ESTADO: Record<EstadoEvento, NombreIcono> = {
  programado: "checkmark-circle",
  suspendido: "pause-circle",
  cancelado: "close-circle",
  finalizado: "checkmark-done-circle",
};

function textoPrecio(precio: number | null): string {
  if (precio === null) return "Precio a confirmar";
  if (precio === 0) return "Gratis";

  return `$${precio.toLocaleString("es-AR")}`;
}

export function TarjetaEvento({ evento, ubicacion }: TarjetaEventoProps) {
  const { colores } = useTema();
  const [imagenFallida, setImagenFallida] = useState(false);

  const inicio = new Date(evento.inicio);

  const fin = evento.fin === null ? null : new Date(evento.fin);

  const horario =
    fin === null
      ? formatearHora(inicio)
      : `${formatearHora(inicio)} – ${formatearHora(fin)}`;

  const noProgramado = evento.estado !== "programado";

  const coloresEstado = {
    programado: { fondo: colores.primarioSuave, texto: colores.primarioFuerte },
    suspendido: { fondo: colores.advertenciaSuave, texto: colores.advertencia },
    cancelado: { fondo: colores.errorSuave, texto: colores.error },
    finalizado: { fondo: colores.borde, texto: colores.textoSecundario },
  }[evento.estado];

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
          estilos.tarjeta,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.borde,
          },
          noProgramado && estilos.atenuada,
        ])}
        accessibilityRole="button"
        accessibilityLabel={`${evento.titulo}. ${horario}. ${ubicacion}. ${textoPrecio(evento.precio)}. ${ETIQUETAS_ESTADO[evento.estado]}`}
      >
        <View
          style={[
            estilos.contenedorImagen,
            { backgroundColor: colores.primarioSuave },
          ]}
        >
          {mostrarImagen ? (
            <Image
              source={{ uri: evento.imagenUrl! }}
              style={estilos.imagen}
              contentFit="cover"
              transition={200}
              onError={() => setImagenFallida(true)}
            />
          ) : (
            <View style={estilos.placeholder}>
              <Ionicons
                name="calendar-outline"
                size={42}
                color={colores.primarioFuerte}
              />

              <Texto style={{ fontSize: 14, color: colores.textoSecundario }}>
                Imagen no disponible
              </Texto>
            </View>
          )}

          {noProgramado && (
            <View
              style={[estilos.estado, { backgroundColor: coloresEstado.fondo }]}
            >
              <Ionicons
                name={ICONOS_ESTADO[evento.estado]}
                size={16}
                color={coloresEstado.texto}
              />

              <Texto
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: coloresEstado.texto,
                }}
              >
                {ETIQUETAS_ESTADO[evento.estado]}
              </Texto>
            </View>
          )}
        </View>

        <View style={estilos.contenido}>
          <View
            style={[
              estilos.pastillaHorario,
              { backgroundColor: colores.primarioSuave },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={colores.primarioFuerte}
            />

            <Texto
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: colores.primarioFuerte,
              }}
            >
              {horario}
            </Texto>
          </View>

          <Texto
            numberOfLines={2}
            style={{ fontSize: 19, lineHeight: 26, fontWeight: "700" }}
          >
            {evento.titulo}
          </Texto>

          <View style={estilos.fila}>
            <Ionicons
              name="location-outline"
              size={18}
              color={colores.textoSecundario}
            />

            <Texto
              numberOfLines={2}
              style={{
                flex: 1,
                fontSize: 14,
                lineHeight: 20,
                color: colores.textoSecundario,
              }}
            >
              {ubicacion}
            </Texto>
          </View>

          <View
            style={[estilos.filaInferior, { borderTopColor: colores.borde }]}
          >
            <View style={estilos.fila}>
              <Ionicons
                name="ticket-outline"
                size={18}
                color={colores.primarioFuerte}
              />

              <Texto style={{ fontSize: 15, fontWeight: "700" }}>
                {textoPrecio(evento.precio)}
              </Texto>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color={colores.textoSecundario}
            />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,

    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  atenuada: {
    opacity: 0.85,
  },

  contenedorImagen: {
    height: 170,
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
  },

  estado: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  contenido: {
    padding: 16,
    gap: 12,
  },

  pastillaHorario: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filaInferior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
