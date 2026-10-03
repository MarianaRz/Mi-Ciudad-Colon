import { Horario } from "../tipos/lugar";

export interface EstadoHorario {
  abierto: boolean;
  texto: string;
}

export function obtenerEstadoHorario(
  horarios: Horario[],
  ahora = new Date(),
): EstadoHorario {
  if (horarios.length === 0) {
    return {
      abierto: false,
      texto: "Horario no informado",
    };
  }

  const diaActual = ahora.getDay();

  const horarioHoy = horarios.find((horario) => horario.dia === diaActual);

  if (!horarioHoy) {
    return {
      abierto: false,
      texto: "Cerrado hoy",
    };
  }

  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

  const [horaAbre, minutoAbre] = horarioHoy.abre.split(":").map(Number);

  const [horaCierra, minutoCierra] = horarioHoy.cierra.split(":").map(Number);

  const apertura = horaAbre * 60 + minutoAbre;
  const cierre = horaCierra * 60 + minutoCierra;

  const abierto = horaActual >= apertura && horaActual < cierre;

  return {
    abierto,
    texto: abierto
      ? `Abierto ahora · cierra ${horarioHoy.cierra}`
      : `Cerrado · abre ${horarioHoy.abre}`,
  };
}
