import * as SQLite from "expo-sqlite";
import type { Favorito } from "../tipos/favorito";

const NOMBRE_BASE = "mi-ciudad-colon.db";

const dbPromise = SQLite.openDatabaseAsync(NOMBRE_BASE);

type FilaFavorito = {
  id: string;
  usuario_id: string;
  lugar_id: string;
  creado_en: string;
};

async function obtenerBase() {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favoritos (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      lugar_id TEXT NOT NULL,
      creado_en TEXT NOT NULL,
      UNIQUE(usuario_id, lugar_id)
    );
  `);

  return db;
}

function convertirFavorito(fila: FilaFavorito): Favorito {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    lugarId: fila.lugar_id,
    creadoEn: fila.creado_en,
  };
}

export async function obtenerFavoritos(usuarioId: string): Promise<Favorito[]> {
  const db = await obtenerBase();

  const filas = await db.getAllAsync<FilaFavorito>(
    `SELECT id, usuario_id, lugar_id, creado_en
     FROM favoritos
     WHERE usuario_id = ?
     ORDER BY creado_en DESC`,
    usuarioId,
  );

  return filas.map(convertirFavorito);
}

export async function esFavorito(
  usuarioId: string,
  lugarId: string,
): Promise<boolean> {
  const db = await obtenerBase();

  const fila = await db.getFirstAsync<{ id: string }>(
    `SELECT id
     FROM favoritos
     WHERE usuario_id = ? AND lugar_id = ?`,
    usuarioId,
    lugarId,
  );

  return fila !== null;
}

export async function guardarFavorito(
  usuarioId: string,
  lugarId: string,
): Promise<void> {
  const db = await obtenerBase();

  await db.runAsync(
    `INSERT OR IGNORE INTO favoritos
      (id, usuario_id, lugar_id, creado_en)
     VALUES (?, ?, ?, ?)`,
    `${usuarioId}:${lugarId}`,
    usuarioId,
    lugarId,
    new Date().toISOString(),
  );
}

export async function quitarFavorito(
  usuarioId: string,
  lugarId: string,
): Promise<void> {
  const db = await obtenerBase();

  await db.runAsync(
    `DELETE FROM favoritos
     WHERE usuario_id = ? AND lugar_id = ?`,
    usuarioId,
    lugarId,
  );
}
