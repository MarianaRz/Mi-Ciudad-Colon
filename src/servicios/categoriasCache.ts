import * as SQLite from "expo-sqlite";

import type { RespuestaLista } from "../tipos/api";
import type { Categoria } from "../tipos/categoria";

const NOMBRE_BASE = "mi-ciudad-colon.db";
const CLAVE_CACHE = "todas";

const dbPromise = SQLite.openDatabaseAsync(NOMBRE_BASE);

type FilaCache = {
  respuesta_json: string;
};

async function obtenerBase() {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categorias_cache (
      clave TEXT PRIMARY KEY NOT NULL,
      respuesta_json TEXT NOT NULL,
      actualizado_en TEXT NOT NULL
    );
  `);

  return db;
}

export async function guardarCategoriasCache(
  respuesta: RespuestaLista<Categoria>,
): Promise<void> {
  const db = await obtenerBase();

  await db.runAsync(
    `INSERT INTO categorias_cache
      (clave, respuesta_json, actualizado_en)
     VALUES (?, ?, ?)
     ON CONFLICT(clave)
     DO UPDATE SET
       respuesta_json = excluded.respuesta_json,
       actualizado_en = excluded.actualizado_en`,
    CLAVE_CACHE,
    JSON.stringify(respuesta),
    new Date().toISOString(),
  );
}

export async function obtenerCategoriasCache(): Promise<RespuestaLista<Categoria> | null> {
  const db = await obtenerBase();

  const fila = await db.getFirstAsync<FilaCache>(
    `SELECT respuesta_json
     FROM categorias_cache
     WHERE clave = ?`,
    CLAVE_CACHE,
  );

  if (!fila) return null;

  try {
    const respuesta = JSON.parse(
      fila.respuesta_json,
    ) as RespuestaLista<Categoria>;

    return Array.isArray(respuesta.datos) ? respuesta : null;
  } catch {
    return null;
  }
}
