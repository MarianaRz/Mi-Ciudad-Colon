import * as Location from "expo-location";
import { useEffect, useState } from "react";

export function useUbicacion() {
  const [ubicacionUsuario, setUbicacionUsuario] =
    useState<Location.LocationObjectCoords | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorUbicacion("Permiso de ubicación denegado.");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setUbicacionUsuario(loc.coords);
      } catch (e) {
        setErrorUbicacion("No se pudo obtener la ubicación actual.");
      }
    })();
  }, []);

  return { ubicacionUsuario, errorUbicacion };
}
