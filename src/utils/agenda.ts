import { Evento } from "../tipos/evento";
import { Lugar } from "../tipos/lugar";
import { claveDia, tituloDia } from "./fechas";

export interface ItemAgenda {
  evento: Evento;
  ubicacion: string;
}

export interface SeccionAgenda {
  clave: string;
  title: string;
  data: ItemAgenda[];
}

export function textoUbicacion(evento: Evento, lugares: Lugar[]): string {
  if (evento.lugarId !== null) {
    const lugar = lugares.find((item) => item.id === evento.lugarId);
    return lugar ? lugar.nombre : "Lugar no disponible";
  }

  return evento.direccionLibre ?? "Ubicación a confirmar";
}

export function armarSecciones(
  eventos: Evento[],
  lugares: Lugar[],
  ahora: Date = new Date(),
): SeccionAgenda[] {
  const claveHoy = claveDia(ahora);

  const ordenados = [...eventos].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime(),
  );

  const secciones: SeccionAgenda[] = [];

  for (const evento of ordenados) {
    const inicio = new Date(evento.inicio);
    const clave = claveDia(inicio);

    if (clave < claveHoy) {
      continue;
    }

    const item: ItemAgenda = {
      evento,
      ubicacion: textoUbicacion(evento, lugares),
    };

    const ultima = secciones[secciones.length - 1];

    if (ultima && ultima.clave === clave) {
      ultima.data.push(item);
    } else {
      secciones.push({ clave, title: tituloDia(inicio, ahora), data: [item] });
    }
  }

  return secciones;
}
