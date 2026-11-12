// src/utils/rutas.ts

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
