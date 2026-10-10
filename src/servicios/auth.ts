import { Sesion } from "../tipos/sesion";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// MOCK: se reemplaza por la API de la cátedra cuando esté disponible.
async function simularRespuesta(email: string): Promise<Sesion> {
  await esperar(400);

  return { email, token: `token-mock-${Date.now()}` };
}

export function iniciarSesionApi(
  email: string,
  _contraseña: string,
): Promise<Sesion> {
  return simularRespuesta(email);
}

export function registrarseApi(
  email: string,
  _contraseña: string,
): Promise<Sesion> {
  return simularRespuesta(email);
}
