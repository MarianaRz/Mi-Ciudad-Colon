import { clienteApi } from "./cliente";
import type { RespuestaLista } from "../tipos/api";
import type { Categoria } from "../tipos/categoria";
import {
  guardarCategoriasCache,
  obtenerCategoriasCache,
} from "../servicios/categoriasCache";

export async function obtenerCategoriasApi(): Promise<
  RespuestaLista<Categoria>
> {
  try {
    const respuesta =
      await clienteApi.get<RespuestaLista<Categoria>>("/categorias");

    try {
      await guardarCategoriasCache(respuesta.data);
    } catch {
      // Un problema con la caché no impide mostrar las categorías online.
    }

    return respuesta.data;
  } catch (error) {
    try {
      const cache = await obtenerCategoriasCache();

      if (cache) return cache;
    } catch {
      // Si no hay caché disponible, conservamos el error de la API.
    }

    throw error;
  }
}
