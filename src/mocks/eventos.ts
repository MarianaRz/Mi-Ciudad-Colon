import { Evento } from "../tipos/evento";

// CASO EXTREMO DEL PRD:
// Descripción muy larga para comprobar que la interfaz
// funciona correctamente con textos extensos.
const TEXTO_LARGO =
  "Gran encuentro con música, gastronomía regional y artesanos de toda la costa. ".repeat(
    12,
  );

export const eventosMock: Evento[] = [
  {
    id: "evt-016",
    titulo: "Muestra de fotografía costera",
    descripcion: "Exposición de fotografías del río Uruguay.",
    lugarId: "lug-006",
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-10-03T18:00:00-03:00",
    fin: "2026-10-04T21:00:00-03:00",

    imagenUrl:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900",

    precio: 0,
    estado: "finalizado",
  },

  {
    id: "evt-022",
    titulo: "Taller de cerámica para chicos",
    descripcion: "Taller de cerámica abierto a toda la familia.",
    lugarId: "lug-006",
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-11-14T18:00:00-03:00",
    fin: "2026-11-14T19:30:00-03:00",

    imagenUrl:
      "https://images.unsplash.com/photo-1565193298595-6ba83d49a8b7?w=900",

    precio: 800,
    estado: "programado",
  },

  {
    id: "evt-017",
    titulo: "Peña en el anfiteatro",
    descripcion: "Noche de folclore con artistas de la región.",

    // Ubicación de demostración.
    // Pendiente de confirmar con datos oficiales.
    lugarId: null,
    direccionLibre: "Anfiteatro de Colón (ubicación de demostración)",
    coordenadas: null,

    inicio: "2026-11-14T21:00:00-03:00",
    fin: "2026-11-15T02:00:00-03:00",

    imagenUrl:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900",

    precio: 0,
    estado: "programado",
  },

  {
    id: "evt-018",
    titulo: "Visita guiada al Molino Forclaz",
    descripcion: "Recorrido guiado por la historia del molino.",
    lugarId: "lug-004",
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-10-24T10:00:00-03:00",
    fin: null,

    imagenUrl:
      "https://i0.wp.com/molinoforclaz.com/wp-content/uploads/2016/10/DSC_0062_result.jpg?ssl=1",

    precio: 1500,
    estado: "programado",
  },

  {
    id: "evt-019",
    titulo: "Feria de artesanos en la costanera",
    descripcion: "Feria al aire libre con productos regionales.",
    lugarId: null,
    direccionLibre: "Costanera de Colón, frente al río",
    coordenadas: null,
    inicio: "2026-10-31T16:00:00-03:00",
    fin: null,

    // CASO EXTREMO: evento sin imagen.
    imagenUrl: null,

    precio: null,
    estado: "cancelado",
  },

  {
    id: "evt-020",
    titulo: "Recital de música en vivo",
    descripcion: "El recital fue pospuesto por mal tiempo.",
    lugarId: "lug-005",
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-11-07T20:30:00-03:00",
    fin: "2026-11-07T23:30:00-03:00",

    imagenUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=900",

    precio: 3000,
    estado: "suspendido",
  },

  {
    id: "evt-021",
    titulo:
      "Festival de la costa: música, gastronomía regional y artesanías de todo el litoral",

    // CASO EXTREMO: descripción muy larga.
    descripcion: TEXTO_LARGO,

    lugarId: null,
    direccionLibre: null,
    coordenadas: null,

    inicio: "2026-11-21T12:00:00-03:00",
    fin: null,

    imagenUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900",

    precio: 0,
    estado: "programado",
  },
];
