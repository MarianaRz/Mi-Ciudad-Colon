import { Sesion } from "../tipos/sesion";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// MOCK: se reemplaza por la API de la cátedra cuando esté disponible.
export async function iniciarSesionApi(
  email: string,
  _clave: string,
): Promise<Sesion> {
  await esperar(400);

  return { email, token: `token-mock-${Date.now()}` };
}
