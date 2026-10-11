import { eventosMock } from "../mocks/eventos";
import { simulacion } from "../mocks/simulacion";
import { ErrorApi, RespuestaLista } from "../tipos/api";
import { Evento } from "../tipos/evento";
import { esperar } from "../utils/esperar";

export async function obtenerEventos(): Promise<RespuestaLista<Evento>> {
  await esperar(400);

  if (simulacion.errorDeRed) {
    throw new ErrorApi("RED", "No pudimos conectarnos. Revisá tu conexión.");
  }

  const eventos = simulacion.listasVacias
    ? []
    : [...eventosMock].sort(
        (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
      );

  return {
    datos: eventos,
    meta: {
      total: eventos.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}

export async function obtenerEventoPorId(id: string): Promise<Evento> {
  await esperar(300);

  if (simulacion.errorDeRed) {
    throw new ErrorApi("RED", "No pudimos conectarnos. Revisá tu conexión.");
  }

  const evento = eventosMock.find((item) => item.id === id);

  if (!evento) {
    throw new ErrorApi("EVENTO_NO_ENCONTRADO", "No existe ese evento.");
  }

  return evento;
}
