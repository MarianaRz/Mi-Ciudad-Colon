import { createContext, use, type ReactNode } from "react";

import { coloresClaro, type PaletaColores } from "./colores";

interface Tema {
  colores: PaletaColores;
}

const TemaContext = createContext<Tema>({
  colores: coloresClaro,
});

const valor: Tema = { colores: coloresClaro };

export function TemaProvider({ children }: { children: ReactNode }) {
  return <TemaContext value={valor}>{children}</TemaContext>;
}

export function useTema(): Tema {
  return use(TemaContext);
}
