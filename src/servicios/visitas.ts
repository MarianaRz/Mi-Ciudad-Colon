import * as SQLite from "expo-sqlite";

import { OrigenVisita, Visita } from "../tipos/visita";

const dbPromise = SQLite.openDatabaseAsync("mi-ciudad-colon.db");

interface VisitaFila {
  id: string;
  usuario_id: string;
  lugar_id: string;
  fecha_hora: string;
  origen: OrigenVisita;
  foto_uri: string | null;
  nota: string | null;
  sincronizada: number;
}

// Inicializar la tabla de visitas.
export async function inicializarVisitas(): Promise<void> {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS visitas (
      id TEXT PRIMARY KEY NOT NULL,
      usuario_id TEXT NOT NULL,
      lugar_id TEXT NOT NULL,
      fecha_hora TEXT NOT NULL,
      origen TEXT NOT NULL,
      foto_uri TEXT,
      nota TEXT,
      sincronizada INTEGER NOT NULL DEFAULT 0
    );
  `);
}

// Convertir los datos de SQLite al tipo oficial.
function convertirVisita(fila: VisitaFila): Visita {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    lugarId: fila.lugar_id,
    fechaHora: fila.fecha_hora,
    origen: fila.origen,
    fotoUri: fila.foto_uri,
    nota: fila.nota,
    sincronizada: fila.sincronizada === 1,
  };
}

// Registrar una visita localmente.
export async function registrarVisita(
  usuarioId: string,
  lugarId: string,
  origen: OrigenVisita,
  nota: string | null = null,
  fotoUri: string | null = null,
): Promise<Visita> {
  const db = await dbPromise;

  await inicializarVisitas();

  const visita: Visita = {
    id: `vis-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    usuarioId,
    lugarId,
    fechaHora: new Date().toISOString(),
    origen,
    fotoUri,
    nota,
    sincronizada: false,
  };

  await db.runAsync(
    `INSERT INTO visitas (
      id,
      usuario_id,
      lugar_id,
      fecha_hora,
      origen,
      foto_uri,
      nota,
      sincronizada
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      visita.id,
      visita.usuarioId,
      visita.lugarId,
      visita.fechaHora,
      visita.origen,
      visita.fotoUri,
      visita.nota,
      visita.sincronizada ? 1 : 0,
    ],
  );

  return visita;
}

// Obtener el historial de un usuario.
export async function obtenerVisitas(usuarioId: string): Promise<Visita[]> {
  const db = await dbPromise;

  await inicializarVisitas();

  const filas = await db.getAllAsync<VisitaFila>(
    `SELECT *
     FROM visitas
     WHERE usuario_id = ?
     ORDER BY fecha_hora DESC`,
    [usuarioId],
  );

  return filas.map(convertirVisita);
}
