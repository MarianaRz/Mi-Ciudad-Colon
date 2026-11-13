import { Linking, Platform } from "react-native";

export interface PuntoMapa {
  latitude: number;
  longitude: number;
}

export interface ResultadoRuta {
  puntos: PuntoMapa[];
  distanciaMetros: number;
  duracionMinutos: number;
}

export async function obtenerRutaPorCalles(
  origenLat: number,
  origenLon: number,
  destinoLat: number,
  destinoLon: number
): Promise<ResultadoRuta | null> {
  try {
    const dominio = "router.project-osrm.org";
    const rutaApi = "/route/v1/driving/";
    const base = "https://" + dominio + rutaApi;
    const coords = origenLon + "," + origenLat + ";" + destinoLon + "," + destinoLat;
    const url = base + coords + "?overview=full&geometries=geojson";

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    if (data.code !== "Ok" || !data.routes?.length) {
      return null;
    }

    const ruta = data.routes[0];
    const puntos: PuntoMapa[] = ruta.geometry.coordinates.map(
      ([lon, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lon,
      })
    );

    return {
      puntos,
      distanciaMetros: ruta.distance,
      duracionMinutos: Math.round(ruta.duration / 60),
    };
  } catch (error) {
    console.error("Error al obtener ruta OSRM:", error);
    return null;
  }
}

//desde aca pegue
export async function abrirNavegacionExterna(
  latitud: number,
  longitud: number,
  nombreLugar?: string
) {
  const etiqueta = encodeURIComponent(nombreLugar || "Destino");

  // En iOS abre Apple Maps con navegación; en Android abre Google Maps
  const url = Platform.select({
    ios: `maps://app?daddr=${latitud},${longitud}&q=${etiqueta}`,
    android: `google.navigation:q=${latitud},${longitud}`,
  });

  // Respaldo web universal por si el dispositivo no tiene la app nativa
  const urlWeb = `https://google.com{latitud},${longitud}`;

  try {
    if (url && (await Linking.canOpenURL(url))) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(urlWeb);
    }
  } catch (error) {
    console.error("No se pudo abrir la app de mapas:", error);
    await Linking.openURL(urlWeb);
  }
}