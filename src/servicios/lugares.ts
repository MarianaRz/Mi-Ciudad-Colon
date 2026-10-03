import { lugaresMock } from "../mocks/lugares";
import { ErrorApi, RespuestaLista } from "../tipos/api";
import { Lugar } from "../tipos/lugar";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function obtenerLugares(): Promise<RespuestaLista<Lugar>> {
  await esperar(400);

  const lugaresActivos = lugaresMock.filter((lugar) => lugar.activo);

  return {
    datos: lugaresActivos,
    meta: {
      total: lugaresActivos.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}

export async function obtenerLugarPorId(id: string): Promise<Lugar> {
  await esperar(300);

  const lugar = lugaresMock.find((item) => item.id === id);

  if (!lugar) {
    throw new ErrorApi("LUGAR_NO_ENCONTRADO", "No existe ese lugar.");
  }

  return lugar;
}
