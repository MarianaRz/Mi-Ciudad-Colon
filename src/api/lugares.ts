import axios from "axios";

import {
  guardarLugaresCache,
  obtenerLugaresCache,
} from "../servicios/lugaresCache";
import type { RespuestaLista } from "../tipos/api";
import type { Lugar } from "../tipos/lugar";
import { clienteApi } from "./cliente";

export async function obtenerLugaresApi(): Promise<RespuestaLista<Lugar>> {
  try {
    const respuesta = await clienteApi.get<RespuestaLista<Lugar>>("/lugares", {
      params: {
        pagina: 1,
        porPagina: 50,
      },
    });

    try {
      await guardarLugaresCache(respuesta.data);
    } catch {
      // Un problema con la caché no impide mostrar los lugares online
    }

    return respuesta.data;
  } catch (error) {
    try {
      const cache = await obtenerLugaresCache();

      if (cache) return cache;
    } catch {
      // Si la caché tampoco está disponible, conservamos el error de la API
    }

    throw error;
  }
}

export async function obtenerLugarPorIdApi(id: string): Promise<Lugar> {
  try {
    const respuesta = await clienteApi.get<{
      datos: Lugar;
      meta: null;
    }>(`/lugares/${encodeURIComponent(id)}`);

    return respuesta.data.datos;
  } catch (error) {
    try {
      const cache = await obtenerLugaresCache();
      const lugarEnCache = cache?.datos.find((lugar) => lugar.id === id);

      if (lugarEnCache) return lugarEnCache;
    } catch {
      // Si la caché no está disponible, conservamos el error de la API
    }

    throw error;
  }
}

export async function obtenerLugarPorQrApi(
  texto: string,
): Promise<Lugar | null> {
  const codigo = texto.trim();

  if (!codigo) return null;

  try {
    const respuesta = await clienteApi.get<{
      datos: Lugar;
      meta: null;
    }>(`/lugares/qr/${encodeURIComponent(codigo)}`);

    return respuesta.data.datos;
  } catch (error) {
    // El servidor respondio 404 es QR_NO_RECONOCIDO
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) return null;

      throw error;
    }

    // No hubo respuesta (sin señal), usamos el catalogo guardado
    let cache: RespuestaLista<Lugar> | null = null;

    try {
      cache = await obtenerLugaresCache();
    } catch {
      cache = null;
    }

    if (!cache) throw error;

    return (
      cache.datos.find((lugar) => lugar.activo && lugar.codigoQr === codigo) ??
      null
    );
  }
}
