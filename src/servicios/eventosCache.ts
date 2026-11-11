import * as SQLite from "expo-sqlite";

import type { RespuestaLista } from "../tipos/api";
import type { Evento } from "../tipos/evento";

const NOMBRE_BASE = "mi-ciudad-colon.db";
const CLAVE_LISTADO = "todos";

const dbPromise = SQLite.openDatabaseAsync(NOMBRE_BASE);

type FilaCache = {
  respuesta_json: string;
};

async function obtenerBase() {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS eventos_cache (
      clave TEXT PRIMARY KEY NOT NULL,
      respuesta_json TEXT NOT NULL,
      actualizado_en TEXT NOT NULL
    );
  `);

  return db;
}

export async function guardarEventosCache(
  respuesta: RespuestaLista<Evento>,
): Promise<void> {
  const db = await obtenerBase();

  await db.runAsync(
    `INSERT INTO eventos_cache
      (clave, respuesta_json, actualizado_en)
     VALUES (?, ?, ?)
     ON CONFLICT(clave)
     DO UPDATE SET
       respuesta_json = excluded.respuesta_json,
       actualizado_en = excluded.actualizado_en`,
    CLAVE_LISTADO,
    JSON.stringify(respuesta),
    new Date().toISOString(),
  );
}

export async function obtenerEventosCache(): Promise<RespuestaLista<Evento> | null> {
  const db = await obtenerBase();

  const fila = await db.getFirstAsync<FilaCache>(
    `SELECT respuesta_json
     FROM eventos_cache
     WHERE clave = ?`,
    CLAVE_LISTADO,
  );

  if (!fila) return null;

  try {
    const respuesta = JSON.parse(fila.respuesta_json) as RespuestaLista<Evento>;

    return Array.isArray(respuesta.datos) ? respuesta : null;
  } catch {
    return null;
  }
}
