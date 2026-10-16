const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function dosDigitos(numero: number) {
  return String(numero).padStart(2, "0");
}

export function claveDia(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

export function formatearDia(fecha: Date): string {
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

export function formatearHora(fecha: Date): string {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

export function tituloDia(fecha: Date, ahora: Date = new Date()): string {
  const manana = new Date(ahora);
  manana.setDate(ahora.getDate() + 1);

  const dia = formatearDia(fecha);

  if (claveDia(fecha) === claveDia(ahora)) {
    return `Hoy · ${dia}`;
  }

  if (claveDia(fecha) === claveDia(manana)) {
    return `Mañana · ${dia}`;
  }

  return dia.charAt(0).toUpperCase() + dia.slice(1);
}

export function formatearDuracion(inicio: Date, fin: Date | null): string {
  if (fin === null) {
    return "Duración no informada";
  }

  const minutos = Math.round((fin.getTime() - inicio.getTime()) / 60000);

  if (minutos <= 0) {
    return "Duración no informada";
  }

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}
