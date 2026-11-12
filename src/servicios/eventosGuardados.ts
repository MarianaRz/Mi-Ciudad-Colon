import axios from "axios";
import * as SQLite from "expo-sqlite";

import {
  guardarEventoApi,
  obtenerEventosGuardadosApi,
  quitarEventoGuardadoApi,
} from "../api/eventosGuardados";
import { EstadoEvento } from "../tipos/evento";
import { cancelarRecordatoriosEvento } from "./notificaciones";

const dbPromise = SQLite.openDatabaseAsync("mi-ciudad-colon.db");

interface EventoGuardadoFila {
  evento_id: string;
  notificacion_id: string | null;
}

export interface EventoGuardadoSeguimiento {
  eventoId: string;
  notificacionId: string | null;
  ultimoEstado: EstadoEvento | null;
  ultimoInicio: string | null;
}

type AccionPendiente = "guardar" | "quitar";

type FilaAccionPendiente = {
  evento_id: string;
  accion: AccionPendiente;
};

type FilaEstadoSincronizacion = {
  inicializada: number;
};

// Crear la tabla y migrar instalaciones anteriores.
export async function inicializarEventosGuardados(): Promise<void> {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS eventos_guardados (
      usuario_email TEXT NOT NULL,
      evento_id TEXT NOT NULL,
      guardado_en TEXT NOT NULL,
      notificacion_id TEXT,
      ultimo_estado TEXT,
      ultimo_inicio TEXT,
      PRIMARY KEY (usuario_email, evento_id)
    );

    CREATE TABLE IF NOT EXISTS eventos_guardados_pendientes (
      usuario_email TEXT NOT NULL,
      evento_id TEXT NOT NULL,
      accion TEXT NOT NULL CHECK (accion IN ('guardar', 'quitar')),
      creado_en TEXT NOT NULL,
      PRIMARY KEY (usuario_email, evento_id)
    );

    CREATE TABLE IF NOT EXISTS eventos_guardados_sync (
      usuario_email TEXT PRIMARY KEY NOT NULL,
      inicializada INTEGER NOT NULL DEFAULT 0
    );
  `);

  const columnas = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(eventos_guardados)",
  );

  const nombresColumnas = new Set(columnas.map((columna) => columna.name));

  if (!nombresColumnas.has("notificacion_id")) {
    await db.execAsync(
      "ALTER TABLE eventos_guardados ADD COLUMN notificacion_id TEXT",
    );
  }

  if (!nombresColumnas.has("ultimo_estado")) {
    await db.execAsync(
      "ALTER TABLE eventos_guardados ADD COLUMN ultimo_estado TEXT",
    );
  }

  if (!nombresColumnas.has("ultimo_inicio")) {
    await db.execAsync(
      "ALTER TABLE eventos_guardados ADD COLUMN ultimo_inicio TEXT",
    );
  }
}

async function encolarAccion(
  db: SQLite.SQLiteDatabase,
  usuarioEmail: string,
  eventoId: string,
  accion: AccionPendiente,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO eventos_guardados_pendientes
      (usuario_email, evento_id, accion, creado_en)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(usuario_email, evento_id)
     DO UPDATE SET
       accion = excluded.accion,
       creado_en = excluded.creado_en`,
    [usuarioEmail, eventoId, accion, new Date().toISOString()],
  );
}

// Saber si un evento está guardado.
export async function estaEventoGuardado(
  usuarioEmail: string,
  eventoId: string,
): Promise<boolean> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  const resultado = await db.getFirstAsync<{ evento_id: string }>(
    `SELECT evento_id
     FROM eventos_guardados
     WHERE usuario_email = ? AND evento_id = ?`,
    [usuarioEmail, eventoId],
  );

  return resultado !== null;
}

// Guardar un evento.
export async function guardarEvento(
  usuarioEmail: string,
  eventoId: string,
): Promise<void> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR IGNORE INTO eventos_guardados
       (usuario_email, evento_id, guardado_en, notificacion_id,
        ultimo_estado, ultimo_inicio)
       VALUES (?, ?, ?, NULL, NULL, NULL)`,
      [usuarioEmail, eventoId, new Date().toISOString()],
    );

    await encolarAccion(db, usuarioEmail, eventoId, "guardar");
  });
}

// Quitar un evento guardado.
export async function quitarEventoGuardado(
  usuarioEmail: string,
  eventoId: string,
): Promise<void> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM eventos_guardados
       WHERE usuario_email = ? AND evento_id = ?`,
      [usuarioEmail, eventoId],
    );

    await encolarAccion(db, usuarioEmail, eventoId, "quitar");
  });
}

// Obtener los IDs de los eventos guardados.
export async function obtenerEventosGuardados(
  usuarioEmail: string,
): Promise<string[]> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  const resultados = await db.getAllAsync<EventoGuardadoFila>(
    `SELECT evento_id, notificacion_id
     FROM eventos_guardados
     WHERE usuario_email = ?
     ORDER BY guardado_en DESC`,
    [usuarioEmail],
  );

  return resultados.map((resultado) => resultado.evento_id);
}

// Obtener el identificador del recordatorio.
export async function obtenerNotificacionGuardada(
  usuarioEmail: string,
  eventoId: string,
): Promise<string | null> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  const resultado = await db.getFirstAsync<{
    notificacion_id: string | null;
  }>(
    `SELECT notificacion_id
     FROM eventos_guardados
     WHERE usuario_email = ? AND evento_id = ?`,
    [usuarioEmail, eventoId],
  );

  return resultado?.notificacion_id ?? null;
}

// Asociar una notificación a un evento guardado.
export async function actualizarNotificacionGuardada(
  usuarioEmail: string,
  eventoId: string,
  notificacionId: string | null,
): Promise<void> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  await db.runAsync(
    `UPDATE eventos_guardados
     SET notificacion_id = ?
     WHERE usuario_email = ? AND evento_id = ?`,
    [notificacionId, usuarioEmail, eventoId],
  );
}

// Consultar los eventos guardados y sus datos de seguimiento.
export async function obtenerSeguimientoEventosGuardados(
  usuarioEmail: string,
): Promise<EventoGuardadoSeguimiento[]> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  const resultados = await db.getAllAsync<{
    evento_id: string;
    notificacion_id: string | null;
    ultimo_estado: string | null;
    ultimo_inicio: string | null;
  }>(
    `SELECT evento_id, notificacion_id, ultimo_estado, ultimo_inicio
     FROM eventos_guardados
     WHERE usuario_email = ?`,
    [usuarioEmail],
  );

  return resultados.map((fila) => ({
    eventoId: fila.evento_id,
    notificacionId: fila.notificacion_id,
    ultimoEstado: fila.ultimo_estado as EstadoEvento | null,
    ultimoInicio: fila.ultimo_inicio,
  }));
}

// Actualizar el último estado y horario conocidos.
export async function actualizarSeguimientoEvento(
  usuarioEmail: string,
  eventoId: string,
  estado: EstadoEvento,
  inicio: string,
): Promise<void> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  await db.runAsync(
    `UPDATE eventos_guardados
     SET ultimo_estado = ?, ultimo_inicio = ?
     WHERE usuario_email = ? AND evento_id = ?`,
    [estado, inicio, usuarioEmail, eventoId],
  );
}

function esRechazoDefinitivo(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const estado = error.response?.status;

  return estado === 404 || estado === 422;
}

async function prepararPrimeraSincronizacion(
  db: SQLite.SQLiteDatabase,
  usuarioEmail: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const estado = await db.getFirstAsync<FilaEstadoSincronizacion>(
      `SELECT inicializada
       FROM eventos_guardados_sync
       WHERE usuario_email = ?`,
      [usuarioEmail],
    );

    if (estado?.inicializada === 1) {
      return;
    }

    const locales = await db.getAllAsync<{
      evento_id: string;
      guardado_en: string;
    }>(
      `SELECT evento_id, guardado_en
       FROM eventos_guardados
       WHERE usuario_email = ?`,
      [usuarioEmail],
    );

    for (const guardado of locales) {
      await db.runAsync(
        `INSERT OR IGNORE INTO eventos_guardados_pendientes
          (usuario_email, evento_id, accion, creado_en)
         VALUES (?, ?, 'guardar', ?)`,
        [usuarioEmail, guardado.evento_id, guardado.guardado_en],
      );
    }

    await db.runAsync(
      `INSERT INTO eventos_guardados_sync (usuario_email, inicializada)
       VALUES (?, 1)
       ON CONFLICT(usuario_email)
       DO UPDATE SET inicializada = 1`,
      [usuarioEmail],
    );
  });
}

async function sincronizarConServidor(usuarioEmail: string): Promise<void> {
  const claveUsuario = usuarioEmail.trim();

  if (!claveUsuario) {
    return;
  }

  const db = await dbPromise;

  await inicializarEventosGuardados();
  await prepararPrimeraSincronizacion(db, claveUsuario);

  const accionesPendientes = await db.getAllAsync<FilaAccionPendiente>(
    `SELECT evento_id, accion
     FROM eventos_guardados_pendientes
     WHERE usuario_email = ?
     ORDER BY creado_en ASC`,
    [claveUsuario],
  );

  for (const pendiente of accionesPendientes) {
    try {
      if (pendiente.accion === "guardar") {
        await guardarEventoApi(pendiente.evento_id);
      } else {
        await quitarEventoGuardadoApi(pendiente.evento_id);
      }
    } catch (error) {
      if (!esRechazoDefinitivo(error)) {
        throw error;
      }
    }

    await db.runAsync(
      `DELETE FROM eventos_guardados_pendientes
       WHERE usuario_email = ? AND evento_id = ? AND accion = ?`,
      [claveUsuario, pendiente.evento_id, pendiente.accion],
    );
  }

  const eventosRemotos = await obtenerEventosGuardadosApi();
  const idsRemotos = new Set(eventosRemotos.map((evento) => evento.id));
  const eventosQuitados: string[] = [];

  await db.withTransactionAsync(async () => {
    const pendientesActuales = await db.getAllAsync<FilaAccionPendiente>(
      `SELECT evento_id, accion
       FROM eventos_guardados_pendientes
       WHERE usuario_email = ?`,
      [claveUsuario],
    );

    const accionPorEvento = new Map(
      pendientesActuales.map((pendiente) => [
        pendiente.evento_id,
        pendiente.accion,
      ]),
    );

    const locales = await db.getAllAsync<{ evento_id: string }>(
      `SELECT evento_id
       FROM eventos_guardados
       WHERE usuario_email = ?`,
      [claveUsuario],
    );

    for (const local of locales) {
      const accionPendiente = accionPorEvento.get(local.evento_id);

      if (!idsRemotos.has(local.evento_id) && accionPendiente !== "guardar") {
        await db.runAsync(
          `DELETE FROM eventos_guardados
           WHERE usuario_email = ? AND evento_id = ?`,
          [claveUsuario, local.evento_id],
        );

        eventosQuitados.push(local.evento_id);
      }
    }

    for (const remoto of eventosRemotos) {
      if (accionPorEvento.get(remoto.id) === "quitar") {
        continue;
      }

      await db.runAsync(
        `INSERT OR IGNORE INTO eventos_guardados
         (usuario_email, evento_id, guardado_en, notificacion_id,
          ultimo_estado, ultimo_inicio)
         VALUES (?, ?, ?, NULL, ?, ?)`,
        [
          claveUsuario,
          remoto.id,
          new Date().toISOString(),
          remoto.estado,
          remoto.inicio,
        ],
      );
    }
  });

  for (const eventoId of eventosQuitados) {
    try {
      await cancelarRecordatoriosEvento(claveUsuario, eventoId);
    } catch {}
  }
}

let sincronizacionEnCurso: Promise<void> | null = null;

export function sincronizarEventosGuardados(
  usuarioEmail: string,
): Promise<void> {
  if (!sincronizacionEnCurso) {
    sincronizacionEnCurso = sincronizarConServidor(usuarioEmail).finally(() => {
      sincronizacionEnCurso = null;
    });
  }

  return sincronizacionEnCurso;
}
