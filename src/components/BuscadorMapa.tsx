// src/components/BuscadorMapa.tsx
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Lugar } from "../tipos/lugar";
import { obtenerInfoCategoria } from "../utils/categorias";

interface BuscadorMapaProps {
  lugares: Lugar[];
  onSeleccionarLugar: (lugar: Lugar) => void;
  onCambiarEstadoBusqueda: (estaBuscando: boolean) => void;
}

export function BuscadorMapa({
  lugares,
  onSeleccionarLugar,
  onCambiarEstadoBusqueda,
}: BuscadorMapaProps) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");

  const textoLimpio = busqueda.trim().toLowerCase();

  const lugaresFiltrados = lugares.filter((lugar) =>
    lugar.nombre.toLowerCase().includes(textoLimpio)
  );

  const manejarCambioTexto = (texto: string) => {
    setBusqueda(texto);
    // Avisamos al mapa si hay texto para ocultar "Cerca tuyo"
    onCambiarEstadoBusqueda(texto.trim().length > 0);
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    onCambiarEstadoBusqueda(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.contenedor}>
      {/* Fila principal: Input + Botón Todos */}
      <View style={styles.filaSuperior}>
        <View style={styles.cajaInput}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.input}
            placeholder="Buscar lugares en Colón..."
            placeholderTextColor="#64748B"
            value={busqueda}
            onChangeText={manejarCambioTexto}
            onFocus={() => onCambiarEstadoBusqueda(true)}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={limpiarBusqueda}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.botonTodos}
          onPress={() => router.push("/lugares" as any)}
        >
          <Text style={styles.textoTodos}>Todos</Text>
        </TouchableOpacity>
      </View>

      {/* Lista desplegable con coincidencias */}
      {textoLimpio.length > 0 && (
        <View style={styles.listaSugerencias}>
          {lugaresFiltrados.length === 0 ? (
            <Text style={styles.textoVacio}>
              No se encontraron lugares con "{busqueda}"
            </Text>
          ) : (
            lugaresFiltrados.slice(0, 5).map((lugar) => {
              const { icono, color } = obtenerInfoCategoria(lugar.categoriaId);
              return (
                <TouchableOpacity
                  key={lugar.id}
                  style={styles.itemSugerencia}
                  onPress={() => {
                    setBusqueda("");
                    onCambiarEstadoBusqueda(false);
                    Keyboard.dismiss();
                    onSeleccionarLugar(lugar);
                  }}
                >
                  <Ionicons name={icono} size={18} color={color} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.nombreLugar} numberOfLines={1}>
                      {lugar.nombre}
                    </Text>
                    <Text style={styles.descLugar} numberOfLines={1}>
                      {lugar.descripcionCorta}
                    </Text>
                  </View>
                  <Ionicons name="navigate-outline" size={16} color="#075985" />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  filaSuperior: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cajaInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },
  botonTodos: {
    backgroundColor: "#075985",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    elevation: 4,
  },
  textoTodos: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  listaSugerencias: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginTop: 8,
    paddingVertical: 4,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  itemSugerencia: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
  },
  nombreLugar: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  descLugar: {
    fontSize: 12,
    color: "#64748B",
  },
  textoVacio: {
    padding: 14,
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },
});
