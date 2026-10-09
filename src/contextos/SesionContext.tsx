import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  borrarSesion,
  guardarSesion,
  leerSesion,
} from "../servicios/almacenSesion";
import { Sesion } from "../tipos/sesion";

interface SesionContexto {
  sesion: Sesion | null;
  cargando: boolean;
  iniciarSesion: (sesion: Sesion) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const SesionContext = createContext<SesionContexto | undefined>(undefined);

interface SesionProviderProps {
  children: ReactNode;
}

export function SesionProvider({ children }: SesionProviderProps) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function restaurarSesion() {
      try {
        const guardada = await leerSesion();
        if (activo) setSesion(guardada);
      } catch {
        if (activo) setSesion(null);
      } finally {
        if (activo) setCargando(false);
      }
    }

    restaurarSesion();

    return () => {
      activo = false;
    };
  }, []);

  async function iniciarSesion(nueva: Sesion) {
    await guardarSesion(nueva);
    setSesion(nueva);
  }

  async function cerrarSesion() {
    await borrarSesion();
    setSesion(null);
  }

  return (
    <SesionContext value={{ sesion, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </SesionContext>
  );
}

export function useSesion() {
  const contexto = useContext(SesionContext);

  if (!contexto) {
    throw new Error("useSesion debe utilizarse dentro de SesionProvider");
  }

  return contexto;
}
