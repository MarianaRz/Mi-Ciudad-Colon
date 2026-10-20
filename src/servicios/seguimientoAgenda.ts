import {
  actualizarNotificacionGuardada,
  actualizarSeguimientoEvento,
  obtenerSeguimientoEventosGuardados,
} from "./eventosGuardados";

import {
  notificarCambioEstadoEvento,
  reprogramarRecordatorioEvento,
} from "./notificaciones";

import { Evento } from "../tipos/evento";

/**
 * Compara los eventos guardados con sus datos actuales.
 *
 * - Detecta cambios de estado.
 * - Reprograma recordatorios si cambia la fecha.
 * - Cancela recordatorios de eventos suspendidos,
 *   cancelados o finalizados.
 * - Evita avisos duplicados.
 */
export async function comprobarCambiosAgenda(
  usuarioEmail: string,
  eventos: Evento[],
): Promise<void> {
  const guardados = await obtenerSeguimientoEventosGuardados(usuarioEmail);

  for (const guardado of guardados) {
    const evento = eventos.find((item) => item.id === guardado.eventoId);

    // Si el evento no vino en la respuesta, no asumimos
    // que fue eliminado ni modificamos su información.
    if (!evento) {
      continue;
    }

    const primeraConsulta =
      guardado.ultimoEstado === null || guardado.ultimoInicio === null;

    const cambioEstado =
      !primeraConsulta && guardado.ultimoEstado !== evento.estado;

    const cambioInicio =
      !primeraConsulta && guardado.ultimoInicio !== evento.inicio;

    // Primera consulta: guardar los valores iniciales.
    // No enviar avisos retroactivos.
    if (primeraConsulta) {
      await actualizarSeguimientoEvento(
        usuarioEmail,
        evento.id,
        evento.estado,
        evento.inicio,
      );

      continue;
    }

    // Si no hubo cambios, no hacemos nada.
    if (!cambioEstado && !cambioInicio) {
      continue;
    }

    // Si cambió el estado o el horario,
    // cancelar el recordatorio anterior y actualizarlo.
    const nuevoIdentificador = await reprogramarRecordatorioEvento(
      evento,
      usuarioEmail,
      guardado.notificacionId,
    );
    
    await actualizarNotificacionGuardada(
      usuarioEmail,
      evento.id,
      nuevoIdentificador,
    );

    // Avisar solamente cuando el estado realmente cambió
    // y el nuevo estado sea suspendido o cancelado.
    if (
      cambioEstado &&
      (evento.estado === "suspendido" || evento.estado === "cancelado")
    ) {
      await notificarCambioEstadoEvento(evento, usuarioEmail);
    }

    // Guardar los valores nuevos para evitar
    // repetir el aviso en próximas consultas.
    await actualizarSeguimientoEvento(
      usuarioEmail,
      evento.id,
      evento.estado,
      evento.inicio,
    );
  }
}
