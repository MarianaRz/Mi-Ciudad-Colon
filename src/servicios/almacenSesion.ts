import * as SecureStore from "expo-secure-store";
import Storage from "expo-sqlite/kv-store";

import type { Sesion } from "../tipos/sesion";

const CLAVE_TOKEN = "sesion.token";
const CLAVE_EMAIL = "sesion.email";
const CLAVE_NOMBRE = "sesion.nombre";

export async function guardarSesion(sesion: Sesion): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token);
  await Storage.setItem(CLAVE_EMAIL, sesion.email);

  if (sesion.nombre) {
    await Storage.setItem(CLAVE_NOMBRE, sesion.nombre);
  } else {
    await Storage.removeItem(CLAVE_NOMBRE);
  }
}

export async function leerSesion(): Promise<Sesion | null> {
  const [token, email, nombre] = await Promise.all([
    SecureStore.getItemAsync(CLAVE_TOKEN),
    Storage.getItem(CLAVE_EMAIL),
    Storage.getItem(CLAVE_NOMBRE),
  ]);

  if (token === null || email === null) {
    return null;
  }

  return {
    email,
    token,
    ...(nombre ? { nombre } : {}),
  };
}

export async function borrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await Storage.removeItem(CLAVE_EMAIL);
  await Storage.removeItem(CLAVE_NOMBRE);
}
