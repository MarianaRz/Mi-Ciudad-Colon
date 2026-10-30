import { clienteApi } from "./cliente";
import { RespuestaLista } from "../tipos/api";
import { Categoria } from "../tipos/categoria";

export async function obtenerCategoriasApi(): Promise<
  RespuestaLista<Categoria>
> {
  const respuesta =
    await clienteApi.get<RespuestaLista<Categoria>>("/categorias");

  return respuesta.data;
}
