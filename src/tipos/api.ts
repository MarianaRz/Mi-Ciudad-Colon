export interface MetaLista {
  total: number;
  pagina: number;
  porPagina: number;
}

export interface RespuestaLista<T> {
  datos: T[];
  meta: MetaLista;
}

export class ErrorApi extends Error {
  codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
    this.codigo = codigo;
  }
}
