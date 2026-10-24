import type { Sesion } from "../tipos/sesion";
import { esperar } from "../utils/esperar";
import { guardarPerfilLocal, obtenerNombreLocal } from "./perfilesLocales";

// MOCK: se reemplazará por la API de autenticación de la cátedra.
async function simularRespuesta(
  email: string,
  nombre?: string,
): Promise<Sesion> {
  await esperar(400);

  const emailNormalizado = email.trim().toLowerCase();

  return {
    email: emailNormalizado,
    token: `token-mock-${Date.now()}`,
    ...(nombre ? { nombre } : {}),
  };
}

export async function iniciarSesionApi(
  email: string,
  _contraseña: string,
): Promise<Sesion> {
  const emailNormalizado = email.trim().toLowerCase();
  const nombre = await obtenerNombreLocal(emailNormalizado);

  return simularRespuesta(emailNormalizado, nombre ?? undefined);
}

export async function registrarseApi(
  email: string,
  _contraseña: string,
  nombre: string,
): Promise<Sesion> {
  const emailNormalizado = email.trim().toLowerCase();
  const nombreNormalizado = nombre.trim();

  await guardarPerfilLocal(emailNormalizado, nombreNormalizado);

  return simularRespuesta(emailNormalizado, nombreNormalizado);
}
