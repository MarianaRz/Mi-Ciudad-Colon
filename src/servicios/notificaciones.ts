import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Evento } from "../tipos/evento";

const CANAL_EVENTOS = "recordatorios-eventos";
const MINUTOS_ANTICIPACION = 30;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Crear el canal de Android.
async function configurarCanal(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(CANAL_EVENTOS, {
    name: "Recordatorios de eventos",
    description: "Avisos de los eventos turísticos que guardaste.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

// Solicitar permisos cuando sean necesarios.
export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  await configurarCanal();

  const permisos = await Notifications.getPermissionsAsync();

  if (permisos.granted) {
    return true;
  }

  if (!permisos.canAskAgain) {
    return false;
  }

  const respuesta = await Notifications.requestPermissionsAsync();

  return respuesta.granted;
}

// Consultar notificaciones pendientes.
export async function obtenerRecordatoriosPendientes() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// Buscar recordatorios de un evento para una cuenta específica.
async function buscarRecordatoriosEvento(
  usuarioEmail: string,
  eventoId: string,
) {
  const pendientes = await obtenerRecordatoriosPendientes();

  return pendientes.filter((notificacion) => {
    const datos = notificacion.content.data;

    return (
      datos?.eventoId === eventoId &&
      datos?.usuarioEmail === usuarioEmail.toLowerCase()
    );
  });
}

// Programar un recordatorio evitando duplicados.
export async function programarRecordatorioEvento(
  evento: Evento,
  usuarioEmail: string,
): Promise<string | null> {
  if (evento.estado !== "programado") {
    return null;
  }

  const inicio = new Date(evento.inicio);

  const momentoAviso = new Date(
    inicio.getTime() - MINUTOS_ANTICIPACION * 60 * 1000,
  );

  // No programar recordatorios vencidos.
  if (
    !Number.isFinite(momentoAviso.getTime()) ||
    momentoAviso.getTime() <= Date.now()
  ) {
    return null;
  }

  const permitido = await solicitarPermisoNotificaciones();

  if (!permitido) {
    return null;
  }

  // Si ya existe un recordatorio pendiente para este
  // evento y usuario, reutilizamos su identificador.
  const existentes = await buscarRecordatoriosEvento(usuarioEmail, evento.id);

  if (existentes.length > 0) {
    // Si hubiera duplicados anteriores, conservar uno.
    for (const duplicado of existentes.slice(1)) {
      await Notifications.cancelScheduledNotificationAsync(
        duplicado.identifier,
      );
    }

    return existentes[0].identifier;
  }

  const identificador = await Notifications.scheduleNotificationAsync({
    content: {
      title: "¡Tu evento está por comenzar!",
      body: `${evento.titulo} empieza en 30 minutos.`,
      data: {
        ruta: `/eventos/${evento.id}`,
        eventoId: evento.id,
        usuarioEmail: usuarioEmail.toLowerCase(),
      },
      sound: "default",
    },

    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: momentoAviso,
      ...(Platform.OS === "android" ? { channelId: CANAL_EVENTOS } : {}),
    },
  });

  return identificador;
}

// Cancelar un recordatorio mediante su identificador.
export async function cancelarRecordatorio(
  identificador: string,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identificador);
}

// Cancelar todos los recordatorios pendientes
// de un evento perteneciente a una cuenta.
export async function cancelarRecordatoriosEvento(
  usuarioEmail: string,
  eventoId: string,
): Promise<void> {
  const existentes = await buscarRecordatoriosEvento(usuarioEmail, eventoId);

  for (const notificacion of existentes) {
    await cancelarRecordatorio(notificacion.identifier);
  }
}


