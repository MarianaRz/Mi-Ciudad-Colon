import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { SesionProvider } from "../contextos/SesionContext";
import { queryClient } from "../config/queryClient";

function NavegacionNotificaciones() {
  useEffect(() => {
    let ultimaNotificacion: string | null = null;

    function abrirEvento(respuesta: Notifications.NotificationResponse) {
      const notificacion = respuesta.notification;
      const datos = notificacion.request.content.data;
      const eventoId = datos?.eventoId;

      if (typeof eventoId !== "string" || eventoId.length === 0) {
        return;
      }

      const identificador = notificacion.request.identifier;

      if (ultimaNotificacion === identificador) {
        return;
      }

      ultimaNotificacion = identificador;

      router.push({
        pathname: "/eventos/[id]",
        params: { id: eventoId },
      });
    }

    const suscripcion =
      Notifications.addNotificationResponseReceivedListener(abrirEvento);

    Notifications.getLastNotificationResponseAsync()
      .then((respuesta) => {
        if (respuesta) {
          abrirEvento(respuesta);
        }
      })
      .catch((error) => {
        console.warn("No se pudo recuperar la última notificación:", error);
      });

    return () => {
      suscripcion.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SesionProvider>
        <NavegacionNotificaciones />

        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="lugares"
            options={{
              title: "Lugares",
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

          <Stack.Screen
            name="lugares/[id]"
            options={{
              title: "Detalle del lugar",
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

          <Stack.Screen
            name="eventos/[id]"
            options={{
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

          <Stack.Screen
            name="login"
            options={{
              title: "Iniciar sesión",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="registro"
            options={{
              title: "Crear cuenta",
              headerShown: false,
            }}
          />
        </Stack>
      </SesionProvider>
    </QueryClientProvider>
  );
}
