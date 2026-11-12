import { createContext, use, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { coloresClaro, coloresOscuro, type PaletaColores } from "./colores";

export const MODO_OSCURO_ACTIVO = false;

interface Tema {
  esOscuro: boolean;
  colores: PaletaColores;
}

const TemaContext = createContext<Tema>({
  esOscuro: false,
  colores: coloresClaro,
});

export function TemaProvider({ children }: { children: ReactNode }) {
  const esquema = useColorScheme();
  const esOscuro = MODO_OSCURO_ACTIVO && esquema === "dark";

  const valor = useMemo(
    () => ({ esOscuro, colores: esOscuro ? coloresOscuro : coloresClaro }),
    [esOscuro],
  );

  return <TemaContext value={valor}>{children}</TemaContext>;
}

export function useTema(): Tema {
  return use(TemaContext);
}
