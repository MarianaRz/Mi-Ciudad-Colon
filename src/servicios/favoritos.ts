import * as SQLite from "expo-sqlite";

import {
  guardarFavoritoApi,
  obtenerFavoritosApi,
  quitarFavoritoApi,
} from "../api/favoritos";
import type { Favorito } from "../tipos/favorito";

const NOMBRE_BASE = "mi-ciudad-colon.db";

const dbPromise = SQLite.openDatabaseAsync(NOMBRE_BASE);

type FilaFavorito = {
  id: string;
  usuario_id: string;
  lugar_id: string;
  creado_en: string;
};

type AccionPendiente = "guardar" | "quitar";

type FilaAccionPendiente = {
  lugar_id: string;
  accion: AccionPendiente;
};

type FilaEstadoSincronizacion = {
  inicializada: number;
};

function convertirFavorito(fila: FilaFavorito): Favorito {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    lugarId: fila.lugar_id,
    creadoEn: fila.creado_en,
  };
}

async function obtenerBase() {
  const db = await dbPromise;

  // Conservamos la tabla de favoritos que ya existe y sus datos.
  // Las otras dos tablas guardan las operaciones pendientes y el
  // estado de la primera sincronización de cada cuenta.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favoritos (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      lugar_id TEXT NOT NULL,
      creado_en TEXT NOT NULL,
      UNIQUE(usuario_id, lugar_id)
    );

    CREATE TABLE IF NOT EXISTS favoritos_pendientes (
      usuario_id TEXT NOT NULL,
      lugar_id TEXT NOT NULL,
      accion TEXT NOT NULL CHECK (accion IN ('guardar', 'quitar')),
      creado_en TEXT NOT NULL,
      PRIMARY KEY (usuario_id, lugar_id)
    );

    CREATE TABLE IF NOT EXISTS favoritos_sync (
      usuario_id TEXT PRIMARY KEY NOT NULL,
      inicializada INTEGER NOT NULL DEFAULT 0
    );
  `);

  return db;
}

async function encolarAccion(
  db: Awaited<ReturnType<typeof obtenerBase>>,
  usuarioId: string,
  lugarId: string,
  accion: AccionPendiente,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO favoritos_pendientes
      (usuario_id, lugar_id, accion, creado_en)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(usuario_id, lugar_id)
     DO UPDATE SET
       accion = excluded.accion,
       creado_en = excluded.creado_en`,
    usuarioId,
    lugarId,
    accion,
    new Date().toISOString(),
  );
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
  const creadoEn = new Date().toISOString();

  // Primero se guarda localmente. Si no hay conexión, el usuario
  // conserva el favorito y queda pendiente de sincronización.
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR IGNORE INTO favoritos
        (id, usuario_id, lugar_id, creado_en)
       VALUES (?, ?, ?, ?)`,
      `${usuarioId}:${lugarId}`,
      usuarioId,
      lugarId,
      creadoEn,
    );

    await encolarAccion(db, usuarioId, lugarId, "guardar");
  });
}

export async function quitarFavorito(
  usuarioId: string,
  lugarId: string,
): Promise<void> {
  const db = await obtenerBase();

  // La eliminación local y su operación pendiente se guardan juntas.
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM favoritos
       WHERE usuario_id = ? AND lugar_id = ?`,
      usuarioId,
      lugarId,
    );

    await encolarAccion(db, usuarioId, lugarId, "quitar");
  });
}

async function prepararPrimeraSincronizacion(
  db: Awaited<ReturnType<typeof obtenerBase>>,
  usuarioId: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const estado = await db.getFirstAsync<FilaEstadoSincronizacion>(
      `SELECT inicializada
       FROM favoritos_sync
       WHERE usuario_id = ?`,
      usuarioId,
    );

    if (estado?.inicializada === 1) {
      return;
    }

    // Al sincronizar por primera vez, enviamos los favoritos locales
    // que ya existían para no perderlos.
    const locales = await db.getAllAsync<FilaFavorito>(
      `SELECT id, usuario_id, lugar_id, creado_en
       FROM favoritos
       WHERE usuario_id = ?`,
      usuarioId,
    );

    for (const favorito of locales) {
      await db.runAsync(
        `INSERT OR IGNORE INTO favoritos_pendientes
          (usuario_id, lugar_id, accion, creado_en)
         VALUES (?, ?, 'guardar', ?)`,
        usuarioId,
        favorito.lugar_id,
        favorito.creado_en,
      );
    }

    await db.runAsync(
      `INSERT INTO favoritos_sync (usuario_id, inicializada)
       VALUES (?, 1)
       ON CONFLICT(usuario_id)
       DO UPDATE SET inicializada = 1`,
      usuarioId,
    );
  });
}

export async function sincronizarFavoritos(usuarioId: string): Promise<void> {
  const claveUsuario = usuarioId.trim();

  if (!claveUsuario) {
    return;
  }

  const db = await obtenerBase();

  await prepararPrimeraSincronizacion(db, claveUsuario);

  const accionesPendientes = await db.getAllAsync<FilaAccionPendiente>(
    `SELECT lugar_id, accion
     FROM favoritos_pendientes
     WHERE usuario_id = ?
     ORDER BY creado_en ASC`,
    claveUsuario,
  );

  // Enviamos cada cambio al servidor. Solo lo quitamos de la cola
  // después de que el servidor confirma la operación.
  for (const pendiente of accionesPendientes) {
    if (pendiente.accion === "guardar") {
      await guardarFavoritoApi(pendiente.lugar_id);
    } else {
      // La API devuelve 204 sin cuerpo; no esperamos datos JSON.
      await quitarFavoritoApi(pendiente.lugar_id);
    }

    await db.runAsync(
      `DELETE FROM favoritos_pendientes
       WHERE usuario_id = ? AND lugar_id = ? AND accion = ?`,
      claveUsuario,
      pendiente.lugar_id,
      pendiente.accion,
    );
  }

  const favoritosRemotos = await obtenerFavoritosApi();
  const idsRemotos = new Set(
    favoritosRemotos.map((favorito) => favorito.lugarId),
  );

  // Un cambio nuevo pudo quedar en cola mientras esperábamos al servidor.
  // Lo respetamos al actualizar SQLite.
  await db.withTransactionAsync(async () => {
    const pendientesActuales = await db.getAllAsync<FilaAccionPendiente>(
      `SELECT lugar_id, accion
         FROM favoritos_pendientes
         WHERE usuario_id = ?`,
      claveUsuario,
    );

    const accionPorLugar = new Map(
      pendientesActuales.map((pendiente) => [
        pendiente.lugar_id,
        pendiente.accion,
      ]),
    );

    const locales = await db.getAllAsync<FilaFavorito>(
      `SELECT id, usuario_id, lugar_id, creado_en
       FROM favoritos
       WHERE usuario_id = ?`,
      claveUsuario,
    );

    // Si otro dispositivo quitó un favorito, reflejamos ese cambio
    // localmente, salvo que exista un guardado pendiente en este teléfono.
    for (const local of locales) {
      const accionPendiente = accionPorLugar.get(local.lugar_id);

      if (!idsRemotos.has(local.lugar_id) && accionPendiente !== "guardar") {
        await db.runAsync(
          `DELETE FROM favoritos
           WHERE usuario_id = ? AND lugar_id = ?`,
          claveUsuario,
          local.lugar_id,
        );
      }
    }

    // Importamos los favoritos del servidor. Si este teléfono tiene
    // pendiente quitarlos, no los volvemos a agregar a la base local.
    for (const remoto of favoritosRemotos) {
      if (accionPorLugar.get(remoto.lugarId) === "quitar") {
        continue;
      }

      await db.runAsync(
        `INSERT OR IGNORE INTO favoritos
          (id, usuario_id, lugar_id, creado_en)
         VALUES (?, ?, ?, ?)`,
        `${claveUsuario}:${remoto.lugarId}`,
        claveUsuario,
        remoto.lugarId,
        remoto.creadoEn,
      );
    }
  });
}
