// src/utils/categorias.ts
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { ComponentProps } from "react";
import { categoriasMock } from "../mocks/categorias";

// Extraemos el tipo exacto de la propiedad "name" de tu componente Ionicons
type NombreIcono = ComponentProps<typeof Ionicons>["name"];

export function obtenerInfoCategoria(categoriaId?: string) {
  const encontrada = categoriasMock.find((cat) => cat.id === categoriaId);

  return {
    nombre: encontrada?.nombre ?? "Lugar de interés",
    icono: (encontrada?.icono ?? "location-outline") as NombreIcono,
    color: encontrada?.color ?? "#64748B",
  };
}
