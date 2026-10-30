import { clienteApi } from "./cliente";
import type { RespuestaLista } from "../tipos/api";
import type { Lugar } from "../tipos/lugar";

export async function obtenerLugaresApi(): Promise<RespuestaLista<Lugar>> {
  const respuesta = await clienteApi.get<RespuestaLista<Lugar>>("/lugares", {
    params: {
      pagina: 1,
      porPagina: 50,
    },
  });

  return respuesta.data;
}

export async function obtenerLugarPorIdApi(id: string): Promise<Lugar> {
  const respuesta = await clienteApi.get<{
    datos: Lugar;
    meta: null;
  }>(`/lugares/${encodeURIComponent(id)}`);

  return respuesta.data.datos;
}
