import { clienteApi } from "./cliente";
import type { Sesion } from "../tipos/sesion";

interface RespuestaIngreso {
  datos: {
    token: string;
    usuario: {
      id: string;
      nombre: string;
      email: string;
    };
  };
  meta: null;
}

export async function ingresarApi(
  email: string,
  contraseña: string,
): Promise<Sesion> {
  const respuesta = await clienteApi.post<RespuestaIngreso>("/auth/ingreso", {
    email: email.trim().toLowerCase(),
    contrasena: contraseña,
  });

  const { token, usuario } = respuesta.data.datos;

  return {
    token,
    email: usuario.email,
    nombre: usuario.nombre,
  };
}

export async function registrarUsuarioApi(
  email: string,
  contraseña: string,
  nombre: string,
): Promise<Sesion> {
  const respuesta = await clienteApi.post<RespuestaIngreso>("/auth/registro", {
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    contrasena: contraseña,
  });

  const { token, usuario } = respuesta.data.datos;

  return {
    token,
    email: usuario.email,
    nombre: usuario.nombre,
  };
}