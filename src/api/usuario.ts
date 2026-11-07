import { clienteApi } from "./cliente";

export interface UsuarioApi {
  id: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
  creadoEn: string;
}

interface RespuestaUsuario {
  datos: UsuarioApi;
  meta: null;
}

export async function obtenerMiUsuarioApi(): Promise<UsuarioApi> {
  const respuesta = await clienteApi.get<RespuestaUsuario>("/yo");

  return respuesta.data.datos;
}
