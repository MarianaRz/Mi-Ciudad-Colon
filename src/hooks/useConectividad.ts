import * as Network from "expo-network";
import { useEffect, useState } from "react";

export type EstadoConectividad = "comprobando" | "conectado" | "sin-conexion";

export function useConectividad(): EstadoConectividad {
  const [estado, setEstado] = useState<EstadoConectividad>("comprobando");

  useEffect(() => {
    let activo = true;

    async function actualizarConectividad() {
      try {
        const red = await Network.getNetworkStateAsync();

        if (!activo) {
          return;
        }

        const conectado =
          red.isConnected === true && red.isInternetReachable === true;

        setEstado(conectado ? "conectado" : "sin-conexion");
      } catch {
        if (activo) {
          setEstado("sin-conexion");
        }
      }
    }

    actualizarConectividad();

    const suscripcion = Network.addNetworkStateListener((red) => {
      if (!activo) {
        return;
      }

      const conectado =
        red.isConnected === true && red.isInternetReachable === true;

      setEstado(conectado ? "conectado" : "sin-conexion");
    });

    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, []);

  return estado;
}
