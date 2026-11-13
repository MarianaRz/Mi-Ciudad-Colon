export const fuentes = {
  regular: "PlusJakartaSans_400Regular",
  media: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  negrita: "PlusJakartaSans_700Bold",
} as const;

export const tipografia = {
  tituloPantalla: { fontFamily: fuentes.negrita, fontSize: 26, lineHeight: 32 },
  tituloSeccion: { fontFamily: fuentes.negrita, fontSize: 20, lineHeight: 26 },
  cuerpo: { fontFamily: fuentes.regular, fontSize: 16, lineHeight: 24 },
  secundario: { fontFamily: fuentes.regular, fontSize: 14, lineHeight: 20 },
} as const;
