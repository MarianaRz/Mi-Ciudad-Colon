import * as SQLite from "expo-sqlite";

const dbPromise = SQLite.openDatabaseAsync("mi-ciudad-colon.db");

interface EventoGuardadoFila {
  evento_id: string;
  notificacion_id: string | null;
}

// Crear la tabla y actualizarla si ya existía.
export async function inicializarEventosGuardados(): Promise<void> {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS eventos_guardados (
      usuario_email TEXT NOT NULL,
      evento_id TEXT NOT NULL,
      guardado_en TEXT NOT NULL,
      notificacion_id TEXT,
      PRIMARY KEY (usuario_email, evento_id)
    );
  `);

  // Migración para instalaciones anteriores.
  const columnas = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(eventos_guardados)",
  );

  const tieneColumna = columnas.some(
    (columna) => columna.name === "notificacion_id",
  );

  if (!tieneColumna) {
    await db.execAsync(
      "ALTER TABLE eventos_guardados ADD COLUMN notificacion_id TEXT",
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
     (usuario_email, evento_id, guardado_en, notificacion_id)
     VALUES (?, ?, ?, NULL)`,
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

// Obtener el identificador de la notificación.
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
