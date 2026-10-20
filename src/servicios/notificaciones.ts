import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Evento } from "../tipos/evento";

const CANAL_EVENTOS = "recordatorios-eventos";
const CANAL_CAMBIOS = "cambios-eventos";

const MINUTOS_ANTICIPACION = 30;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --------------------------------------------------
// Configurar canales de Android
// --------------------------------------------------

async function configurarCanales(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(CANAL_EVENTOS, {
    name: "Recordatorios de eventos",
    description: "Avisos de los eventos turísticos que guardaste.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync(CANAL_CAMBIOS, {
    name: "Cambios en eventos",
    description: "Avisos cuando un evento guardado se suspende o cancela.",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

// --------------------------------------------------
// Permisos
// --------------------------------------------------

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  await configurarCanales();

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

// --------------------------------------------------
// Consultar notificaciones pendientes
// --------------------------------------------------

export async function obtenerRecordatoriosPendientes() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// --------------------------------------------------
// Buscar recordatorios de un evento
// --------------------------------------------------

async function buscarRecordatoriosEvento(
  usuarioEmail: string,
  eventoId: string,
) {
  const pendientes = await obtenerRecordatoriosPendientes();

  return pendientes.filter((notificacion) => {
    const datos = notificacion.content.data;

    return (
      datos?.eventoId === eventoId &&
      datos?.usuarioEmail === usuarioEmail.toLowerCase() &&
      (datos?.tipo === "recordatorio" || datos?.tipo === undefined)
    );
  });
}

// --------------------------------------------------
// Programar recordatorio 30 minutos antes
// --------------------------------------------------

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

  const existentes = await buscarRecordatoriosEvento(usuarioEmail, evento.id);

  // No duplicar recordatorios existentes.
  if (existentes.length > 0) {
    for (const duplicado of existentes.slice(1)) {
      await Notifications.cancelScheduledNotificationAsync(
        duplicado.identifier,
      );
    }

    return existentes[0].identifier;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "¡Tu evento está por comenzar!",
      body: `${evento.titulo} empieza en 30 minutos.`,
      data: {
        ruta: `/eventos/${evento.id}`,
        eventoId: evento.id,
        usuarioEmail: usuarioEmail.toLowerCase(),
        tipo: "recordatorio",
      },
      sound: "default",
    },

    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: momentoAviso,
      ...(Platform.OS === "android" ? { channelId: CANAL_EVENTOS } : {}),
    },
  });
}

// --------------------------------------------------
// Cancelar recordatorio por ID
// --------------------------------------------------

export async function cancelarRecordatorio(
  identificador: string,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identificador);
}

// --------------------------------------------------
// Cancelar recordatorios de un evento
// --------------------------------------------------

export async function cancelarRecordatoriosEvento(
  usuarioEmail: string,
  eventoId: string,
): Promise<void> {
  const existentes = await buscarRecordatoriosEvento(usuarioEmail, eventoId);

  for (const notificacion of existentes) {
    await cancelarRecordatorio(notificacion.identifier);
  }
}

// --------------------------------------------------
// Reprogramar un recordatorio
// --------------------------------------------------

export async function reprogramarRecordatorioEvento(
  evento: Evento,
  usuarioEmail: string,
  identificadorAnterior: string | null,
): Promise<string | null> {
  // Cancelar el recordatorio guardado en SQLite.
  if (identificadorAnterior) {
    await cancelarRecordatorio(identificadorAnterior);
  }

  // Cancelar otros recordatorios pendientes del evento.
  await cancelarRecordatoriosEvento(usuarioEmail, evento.id);

  // Programar según la fecha y el estado actualizados.
  return programarRecordatorioEvento(evento, usuarioEmail);
}

// --------------------------------------------------
// Avisar cambios de estado
// --------------------------------------------------

export async function notificarCambioEstadoEvento(
  evento: Evento,
  usuarioEmail: string,
): Promise<boolean> {
  if (evento.estado !== "suspendido" && evento.estado !== "cancelado") {
    return false;
  }

  // Consultamos permisos existentes sin abrir un diálogo
  // cada vez que se actualiza la Agenda.
  await configurarCanales();

  const permisos = await Notifications.getPermissionsAsync();

  if (!permisos.granted) {
    return false;
  }

  const suspendido = evento.estado === "suspendido";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: suspendido ? "Evento suspendido" : "Evento cancelado",

      body: suspendido
        ? `${evento.titulo} fue suspendido. Consultá los detalles en la Agenda.`
        : `${evento.titulo} fue cancelado. Consultá los detalles en la Agenda.`,

      data: {
        ruta: `/eventos/${evento.id}`,
        eventoId: evento.id,
        usuarioEmail: usuarioEmail.toLowerCase(),
        tipo: "cambio-estado",
      },

      sound: "default",
      ...(Platform.OS === "android" ? { channelId: CANAL_CAMBIOS } : {}),
    },

    // Notificación local inmediata.
    trigger: null,
  });

  return true;
}
