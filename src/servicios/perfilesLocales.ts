import * as SQLite from "expo-sqlite";

const dbPromise = SQLite.openDatabaseAsync("mi-ciudad-colon.db");

interface FilaPerfil {
  nombre: string;
}

async function obtenerBase() {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS perfiles_locales (
      email TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL
    );
  `);

  return db;
}

export async function guardarPerfilLocal(
  email: string,
  nombre: string,
): Promise<void> {
  const db = await obtenerBase();

  await db.runAsync(
    `INSERT INTO perfiles_locales (email, nombre)
     VALUES (?, ?)
     ON CONFLICT(email)
     DO UPDATE SET nombre = excluded.nombre`,
    email.trim().toLowerCase(),
    nombre.trim(),
  );
}

export async function obtenerNombreLocal(
  email: string,
): Promise<string | null> {
  const db = await obtenerBase();

  const fila = await db.getFirstAsync<FilaPerfil>(
    `SELECT nombre FROM perfiles_locales WHERE email = ?`,
    email.trim().toLowerCase(),
  );

  return fila?.nombre ?? null;
}
