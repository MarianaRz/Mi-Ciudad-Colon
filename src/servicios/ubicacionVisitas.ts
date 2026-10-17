import * as Location from "expo-location";

import { Coordenadas } from "../tipos/lugar";

// Radio permitido para registrar una visita mediante GPS.
// Valor provisional hasta consultar al profesor.
export const RADIO_VISITA_GPS_METROS = 100;

// Precisión máxima aceptada.
// Si el margen de error supera los 50 metros,
// no permitimos registrar la visita mediante GPS.
export const PRECISION_MAXIMA_GPS_METROS = 50;

export type ResultadoUbicacionVisita =
  | {
      estado: "dentro";
      distanciaMetros: number;
      precisionMetros: number;
    }
  | {
      estado: "lejos";
      distanciaMetros: number;
      precisionMetros: number;
    }
  | {
      estado: "precision-insuficiente";
      precisionMetros: number | null;
    }
  | {
      estado: "permiso-denegado";
    }
  | {
      estado: "ubicacion-desactivada";
    }
  | {
      estado: "error";
      mensaje: string;
    };

function convertirARadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

// Fórmula de Haversine:
// calcula la distancia entre dos coordenadas geográficas.
export function calcularDistanciaMetros(
  origen: Coordenadas,
  destino: Coordenadas,
): number {
  const radioTierra = 6371000;

  const diferenciaLatitud = convertirARadianes(
    destino.latitud - origen.latitud,
  );

  const diferenciaLongitud = convertirARadianes(
    destino.longitud - origen.longitud,
  );

  const latitudOrigen = convertirARadianes(origen.latitud);
  const latitudDestino = convertirARadianes(destino.latitud);

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(latitudOrigen) *
      Math.cos(latitudDestino) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radioTierra * c;
}

export async function comprobarVisitaGps(
  coordenadasLugar: Coordenadas,
): Promise<ResultadoUbicacionVisita> {
  try {
    // Comprobar que la ubicación del dispositivo esté activa.
    const serviciosActivos = await Location.hasServicesEnabledAsync();

    if (!serviciosActivos) {
      return {
        estado: "ubicacion-desactivada",
      };
    }

    // Consultar permiso existente.
    let permiso = await Location.getForegroundPermissionsAsync();

    // Solicitarlo únicamente si Android permite volver a preguntar.
    if (!permiso.granted && permiso.canAskAgain) {
      permiso = await Location.requestForegroundPermissionsAsync();
    }

    if (!permiso.granted) {
      return {
        estado: "permiso-denegado",
      };
    }

    // Obtener ubicación actual.
    const posicion = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Android puede devolver null si no conoce la precisión.
    const precisionMetros = posicion.coords.accuracy;

    // No registrar visitas con mediciones imprecisas.
    if (
      precisionMetros === null ||
      !Number.isFinite(precisionMetros) ||
      precisionMetros > PRECISION_MAXIMA_GPS_METROS
    ) {
      return {
        estado: "precision-insuficiente",
        precisionMetros,
      };
    }

    const coordenadasUsuario: Coordenadas = {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
    };

    const distanciaMetros = calcularDistanciaMetros(
      coordenadasUsuario,
      coordenadasLugar,
    );

    if (distanciaMetros <= RADIO_VISITA_GPS_METROS) {
      return {
        estado: "dentro",
        distanciaMetros,
        precisionMetros,
      };
    }

    return {
      estado: "lejos",
      distanciaMetros,
      precisionMetros,
    };
  } catch (error) {
    return {
      estado: "error",
      mensaje:
        error instanceof Error
          ? error.message
          : "No pudimos obtener tu ubicación.",
    };
  }
}
