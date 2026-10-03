import { createContext, ReactNode, useContext, useState } from "react";

import { Sesion } from "../tipos/sesion";

interface SesionContexto {
  sesion: Sesion | null;
  iniciarSesion: (email: string) => void;
  cerrarSesion: () => void;
}

const SesionContext = createContext<SesionContexto | undefined>(undefined);

interface SesionProviderProps {
  children: ReactNode;
}

export function SesionProvider({ children }: SesionProviderProps) {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  function iniciarSesion(email: string) {
    setSesion({ email });
  }

  function cerrarSesion() {
    setSesion(null);
  }

  return (
    <SesionContext.Provider
      value={{
        sesion,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(SesionContext);

  if (!contexto) {
    throw new Error("useSesion debe utilizarse dentro de SesionProvider");
  }

  return contexto;
}
