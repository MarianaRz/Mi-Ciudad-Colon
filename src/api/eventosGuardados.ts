import type { RespuestaLista } from "../tipos/api";
import type { Evento } from "../tipos/evento";
import { clienteApi } from "./cliente";

interface RespuestaEventoGuardadoApi {
  datos: Evento;
  meta: null;
}

export async function obtenerEventosGuardadosApi(): Promise<Evento[]> {
  const porPagina = 50;
  let pagina = 1;
  const eventos: Evento[] = [];

  while (true) {
    const respuesta = await clienteApi.get<RespuestaLista<Evento>>(
      "/yo/eventos-guardados",
      {
        params: { pagina, porPagina },
      },
    );

    eventos.push(...respuesta.data.datos);

    if (
      eventos.length >= respuesta.data.meta.total ||
      respuesta.data.datos.length === 0
    ) {
      return eventos;
    }

    pagina += 1;
  }
}

export async function guardarEventoApi(eventoId: string): Promise<Evento> {
  const respuesta = await clienteApi.put<RespuestaEventoGuardadoApi>(
    `/yo/eventos-guardados/${encodeURIComponent(eventoId)}`,
  );

  return respuesta.data.datos;
}

export async function quitarEventoGuardadoApi(eventoId: string): Promise<void> {
  await clienteApi.delete(
    `/yo/eventos-guardados/${encodeURIComponent(eventoId)}`,
  );
}
