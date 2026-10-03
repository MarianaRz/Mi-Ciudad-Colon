import { categoriasMock } from "../mocks/categorias";
import { RespuestaLista } from "../tipos/api";
import { Categoria } from "../tipos/categoria";

export async function obtenerCategorias(): Promise<RespuestaLista<Categoria>> {
  const categorias = [...categoriasMock].sort((a, b) => a.orden - b.orden);

  return {
    datos: categorias,
    meta: {
      total: categorias.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}
