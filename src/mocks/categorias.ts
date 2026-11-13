import { Categoria } from "../tipos/categoria";

export const categoriasMock: Categoria[] = [
  {
    id: "cat-playas",
    nombre: "Playas",
    icono: "sunny-outline",
    color: "#FACC15", // Amarillo sol cálido
    orden: 1,
  },
  {
    id: "cat-termas",
    nombre: "Termas",
    icono: "water-outline", // Cambiado a agua/ondas para las termas
    color: "#38BDF8", // Celeste agua pastel
    orden: 2,
  },
  {
    id: "cat-museos",
    nombre: "Museos y patrimonio",
    icono: "business-outline",
    color: "#A78BFA", // Violeta suave / patrimonio
    orden: 3,
  },
  {
    id: "cat-gastronomia",
    nombre: "Gastronomía",
    icono: "restaurant-outline",
    color: "#FB7185", // Rosa coral pastel (muy cálido para comida)
    orden: 4,
  },
  {
    id: "cat-artesanias",
    nombre: "Artesanías",
    icono: "color-palette-outline",
    color: "#E879F9", // Fucsia/Magenta pastel muy sutil
    orden: 5,
  },
  {
    id: "cat-naturaleza",
    nombre: "Naturaleza",
    icono: "leaf-outline",
    color: "#34D399", // Verde agua / menta suave (nada de flúor)
    orden: 6,
  },
  {
    id: "cat-alojamiento",
    nombre: "Alojamiento",
    icono: "bed-outline",
    color: "#CBD5E1", // Gris perlado / plateado pastel muy legible
    orden: 7,
  },
];
