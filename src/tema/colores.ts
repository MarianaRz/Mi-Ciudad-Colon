export interface PaletaColores {
  primario: string;
  primarioFuerte: string;
  primarioSuave: string;
  sobrePrimario: string;
  fondo: string;
  superficie: string;
  texto: string;
  textoSecundario: string;
  borde: string;
  error: string;
  errorSuave: string;
  exito: string;
  exitoSuave: string;
  advertencia: string;
  advertenciaSuave: string;
}

export const coloresClaro: PaletaColores = {
  primario: "#7D97EE",
  primarioFuerte: "#3F5BD0",
  primarioSuave: "#E8EDFD",
  sobrePrimario: "#141B2D",
  fondo: "#F6F8FE",
  superficie: "#FFFFFF",
  texto: "#141B2D",
  textoSecundario: "#55607A",
  borde: "#E3E8F6",
  error: "#B42318",
  errorSuave: "#FEE4E2",
  exito: "#167A3E",
  exitoSuave: "#DCF5E4",
  advertencia: "#B45309",
  advertenciaSuave: "#FEF0C7",
};

export const coloresOscuro: PaletaColores = {
  primario: "#7D97EE",
  primarioFuerte: "#9DB1F4",
  primarioSuave: "#1E2745",
  sobrePrimario: "#0E1220",
  fondo: "#0E1220",
  superficie: "#171C2E",
  texto: "#EEF1FB",
  textoSecundario: "#A3ACC8",
  borde: "#2A3149",
  error: "#F97066",
  errorSuave: "#3B1C1A",
  exito: "#4ADE80",
  exitoSuave: "#12301F",
  advertencia: "#FBBF24",
  advertenciaSuave: "#3A2D0E",
};

export const colores = coloresClaro;
