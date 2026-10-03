import { Lugar } from "../tipos/lugar";

export const lugaresMock: Lugar[] = [
  {
    id: "lug-004",
    nombre: "Molino Forclaz",
    categoriaId: "cat-museos",
    descripcionCorta: "Molino de viento de 1888 levantado por colonos suizos.",
    descripcion:
      "Construido en 1888 por Juan Bautista Forclaz. Es uno de los sitios históricos más representativos de la zona.",
    coordenadas: {
      latitud: -32.1904,
      longitud: -58.1932,
    },
    direccion: "Colonia San José, Ruta Provincial 26",
    imagenes: [
      "https://i0.wp.com/molinoforclaz.com/wp-content/uploads/2016/10/DSC_0062_result.jpg?ssl=1",
    ],
    horarios: [
      { dia: 2, abre: "09:00", cierra: "19:00" },
      { dia: 6, abre: "10:00", cierra: "20:00" },
    ],
    telefono: "345-4421234",
    sitioWeb: null,
    precioEntrada: 1500,
    audioguia: {
      url: "https://api.colon.tur.ar/audio/molino-es.m4a",
      duracionSegundos: 252,
      idioma: "es",
    },
    codigoQr: "COLON:lug-004",
    accesible: false,
    activo: true,
    actualizadoEn: "2026-08-01T10:30:00-03:00",
  },

  {
    id: "lug-005",
    nombre: "Playa Norte",
    categoriaId: "cat-playas",
    descripcionCorta: "Playa sobre el río Uruguay cercana al centro.",
    descripcion:
      "Espacio de playa y recreación sobre la costa del río Uruguay.",
    coordenadas: {
      latitud: -32.214,
      longitud: -58.137,
    },
    direccion: "Costanera Norte, Colón",
    imagenes: [],
    horarios: [],
    telefono: null,
    sitioWeb: null,
    precioEntrada: 0,
    audioguia: null,
    codigoQr: null,
    accesible: true,
    activo: true,
    actualizadoEn: "2026-09-01T12:00:00-03:00",
  },

  {
    id: "lug-006",
    nombre: "Museo Casa de la Cultura",
    categoriaId: "cat-museos",
    descripcionCorta: "Espacio cultural e histórico de la ciudad de Colón.",
    descripcion:
      "Museo dedicado a conservar y difundir parte de la historia y cultura local.",
    coordenadas: {
      latitud: -32.223,
      longitud: -58.143,
    },
    direccion: "Colón, Entre Ríos",
    imagenes: [],
    horarios: [
      { dia: 1, abre: "09:00", cierra: "13:00" },
      { dia: 2, abre: "09:00", cierra: "13:00" },
    ],
    telefono: null,
    sitioWeb: null,
    precioEntrada: null,
    audioguia: null,
    codigoQr: "COLON:lug-006",
    accesible: true,
    activo: true,
    actualizadoEn: "2026-09-10T09:00:00-03:00",
  },
];
