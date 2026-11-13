import axios from "axios";

import { clienteApi } from "./cliente";
import { ErrorApi, type RespuestaLista } from "../tipos/api";
import type { Evento } from "../tipos/evento";
import {
  guardarEventosCache,
  obtenerEventosCache,
} from "../servicios/eventosCache";

const POR_PAGINA = 100;

function aErrorApi(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) return error;

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const cuerpo = error.response.data as
        | { error?: { codigo?: string; mensaje?: string } }
        | undefined;

      return new ErrorApi(
        cuerpo?.error?.codigo ?? `HTTP_${error.response.status}`,
        cuerpo?.error?.mensaje ??
          "El servidor no pudo responder. Probá de nuevo en un rato.",
      );
    }

    if (error.request) {
      return new ErrorApi("RED", "No pudimos conectarnos. Revisá tu conexión.");
    }
  }

  return new ErrorApi("DESCONOCIDO", "Ocurrió un error al cargar la agenda.");
}

async function pedirTodosLosEventos(): Promise<RespuestaLista<Evento>> {
  const eventos: Evento[] = [];
  let pagina = 1;
  let total = 0;

  do {
    const respuesta = await clienteApi.get<RespuestaLista<Evento>>("/eventos", {
      params: { pagina, porPagina: POR_PAGINA },
    });

    eventos.push(...respuesta.data.datos);
    total = respuesta.data.meta.total;

    if (respuesta.data.datos.length === 0) break;

    pagina += 1;
  } while (eventos.length < total);

  return {
    datos: eventos,
    meta: { total, pagina: 1, porPagina: eventos.length },
  };
}

export async function obtenerEventosApi(): Promise<RespuestaLista<Evento>> {
  try {
    const respuesta = await pedirTodosLosEventos();

    try {
      await guardarEventosCache(respuesta);
    } catch {}

    return respuesta;
  } catch (error) {
    try {
      const cache = await obtenerEventosCache();

      if (cache) return cache;
    } catch {}

    throw aErrorApi(error);
  }
}

export async function obtenerEventoPorIdApi(id: string): Promise<Evento> {
  try {
    const respuesta = await clienteApi.get<{
      datos: Evento;
      meta: null;
    }>(`/eventos/${encodeURIComponent(id)}`);

    return respuesta.data.datos;
  } catch (error) {
    const sinRespuesta = !(axios.isAxiosError(error) && error.response);

    if (sinRespuesta) {
      try {
        const cache = await obtenerEventosCache();
        const eventoEnCache = cache?.datos.find((evento) => evento.id === id);

        if (eventoEnCache) return eventoEnCache;
      } catch {}
    }

    throw aErrorApi(error);
  }
}
