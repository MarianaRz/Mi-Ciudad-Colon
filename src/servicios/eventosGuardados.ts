import * as SQLite from "expo-sqlite";

import { EstadoEvento } from "../tipos/evento";

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

  await db.runAsync(
    `INSERT OR IGNORE INTO eventos_guardados
     (usuario_email, evento_id, guardado_en, notificacion_id,
      ultimo_estado, ultimo_inicio)
     VALUES (?, ?, ?, NULL, NULL, NULL)`,
    [usuarioEmail, eventoId, new Date().toISOString()],
  );
}

// Quitar un evento guardado.
export async function quitarEventoGuardado(
  usuarioEmail: string,
  eventoId: string,
): Promise<void> {
  const db = await dbPromise;

  await inicializarEventosGuardados();

  await db.runAsync(
    `DELETE FROM eventos_guardados
     WHERE usuario_email = ? AND evento_id = ?`,
    [usuarioEmail, eventoId],
  );
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
