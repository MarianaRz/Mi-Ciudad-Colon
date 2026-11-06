import { clienteApi } from "./cliente";
import type { RespuestaLista } from "../tipos/api";

export interface FavoritoApi {
  id: string;
  usuarioId: string;
  lugarId: string;
  creadoEn: string;
}

interface RespuestaFavoritoApi {
  datos: FavoritoApi;
  meta: null;
}

export async function obtenerFavoritosApi(): Promise<FavoritoApi[]> {
  const porPagina = 50;
  let pagina = 1;
  const favoritos: FavoritoApi[] = [];

  while (true) {
    const respuesta = await clienteApi.get<RespuestaLista<FavoritoApi>>(
      "/yo/favoritos",
      {
        params: { pagina, porPagina },
      },
    );

    favoritos.push(...respuesta.data.datos);

    if (
      favoritos.length >= respuesta.data.meta.total ||
      respuesta.data.datos.length === 0
    ) {
      return favoritos;
    }

    pagina += 1;
  }
}

export async function guardarFavoritoApi(
  lugarId: string,
): Promise<FavoritoApi> {
  const respuesta = await clienteApi.put<RespuestaFavoritoApi>(
    `/yo/favoritos/${encodeURIComponent(lugarId)}`,
  );

  return respuesta.data.datos;
}

export async function quitarFavoritoApi(lugarId: string): Promise<void> {
  await clienteApi.delete(`/yo/favoritos/${encodeURIComponent(lugarId)}`);
}
