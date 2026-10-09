import * as SecureStore from "expo-secure-store";
import Storage from "expo-sqlite/kv-store";

import { Sesion } from "../tipos/sesion";

const CLAVE_TOKEN = "sesion.token";
const CLAVE_EMAIL = "sesion.email";

export async function guardarSesion(sesion: Sesion): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token);
  await Storage.setItem(CLAVE_EMAIL, sesion.email);
}

export async function leerSesion(): Promise<Sesion | null> {
  const [token, email] = await Promise.all([
    SecureStore.getItemAsync(CLAVE_TOKEN),
    Storage.getItem(CLAVE_EMAIL),
  ]);

  if (token === null || email === null) {
    return null;
  }

  return { email, token };
}

export async function borrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await Storage.removeItem(CLAVE_EMAIL);
}
