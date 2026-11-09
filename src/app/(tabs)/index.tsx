import { Ionicons } from "@react-native-vector-icons/ionicons"; // <-- Corregido según la guía del PDF
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { obtenerLugaresApi } from "../../api/lugares";

// Función para calcular la distancia en metros (Fórmula Haversine)
function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatearDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}

export default function MapaScreen() {
  const router = useRouter();
  const [ubicacionUsuario, setUbicacionUsuario] = useState<Location.LocationObjectCoords | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);

  // Obtener lugares usando TanStack Query con la clave compartida ["lugares"][cite: 14]
  const { data: respuestaLugares, isLoading, error } = useQuery({
    queryKey: ["lugares"],
    queryFn: obtenerLugaresApi,
  });

  // Solicitar permisos y obtener la ubicación del usuario[cite: 14, 15]
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorUbicacion("Permiso de ubicación denegado.");
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        setUbicacionUsuario(loc.coords);
      } catch (e) {
        setErrorUbicacion("No se pudo obtener la ubicación actual.");
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#075985" />
        <Text style={styles.textoCarga}>Cargando mapa y lugares...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.tituloError}>Error de conexión</Text>
        <Text style={styles.textoError}>No se pudieron cargar los datos de la API.</Text>
      </View>
    );
  }

  const latCentro = ubicacionUsuario?.latitude ?? -32.2250;
  const lonCentro = ubicacionUsuario?.longitude ?? -58.1480;

  // Procesar lugares, calcular distancia y quedarnos con los 3 más cercanos para las ventanas flotantes
  const lugaresConDistancia = respuestaLugares?.datos?.map((lugar) => {
    let distanciaMetros = 0;
    if (lugar.coordenadas) {
      distanciaMetros = calcularDistanciaMetros(
        latCentro,
        lonCentro,
        lugar.coordenadas.latitud,
        lugar.coordenadas.longitud
      );
    }
    return { ...lugar, distanciaMetros };
  }) || [];

  lugaresConDistancia.sort((a, b) => a.distanciaMetros - b.distanciaMetros);
  const lugaresCercanos = lugaresConDistancia.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* 1. MAPA DE FONDO (Ocupa toda la pantalla) */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.mapa}
        initialRegion={{
          latitude: latCentro,
          longitude: lonCentro,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Renderizado de marcadores obtenidos de la API */}
        {respuestaLugares?.datos?.map((lugar) => {
          if (!lugar.coordenadas) return null;
          return (
            <Marker
              key={lugar.id}
              coordinate={{
                latitude: lugar.coordenadas.latitud,
                longitude: lugar.coordenadas.longitud,
              }}
              title={lugar.nombre}
              description={lugar.descripcionCorta}
              onCalloutPress={() => router.push(`/lugares/${lugar.id}` as any)}
            />
          );
        })}
      </MapView>

      {/* 2. BUSCADOR FLOTANTE SUPERIOR */}
      <View style={styles.headerFlotante}>
        <TouchableOpacity 
          style={styles.buscadorContainer}
          onPress={() => router.push("/lugares" as any)}
        >
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <Text style={styles.buscadorTexto}>Buscar lugares en Colón... [ Q ]</Text>
        </TouchableOpacity>
      </View>

      {/* 3. VENTANAS FLOTANTES INFERIORES (3 Lugares cercanos) */}
      <View style={styles.footerFlotante}>
        <Text style={styles.tituloCerca}>Cerca tuyo</Text>
        {lugaresCercanos.map((lugar) => (
          <TouchableOpacity
            key={lugar.id}
            style={styles.cardFlotante}
            onPress={() => router.push(`/lugares/${lugar.id}` as any)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitulo} numberOfLines={1}>{lugar.nombre}</Text>
              <Text style={styles.cardDesc} numberOfLines={1}>{lugar.descripcionCorta}</Text>
            </View>
            <Text style={styles.cardDistancia}>
              {lugar.coordenadas ? formatearDistancia(lugar.distanciaMetros) : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorUbicacion && (
        <View style={styles.bannerError}>
          <Text style={styles.textoErrorBanner}>{errorUbicacion}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapa: {
    ...StyleSheet.absoluteFill, // <-- Corregido de absoluteFillObject a absoluteFill
  },
  headerFlotante: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buscadorTexto: {
    marginLeft: 8,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  footerFlotante: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  tituloCerca: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17202A',
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardFlotante: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17202A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardDistancia: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075985',
    marginLeft: 8,
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  textoCarga: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 16,
  },
  tituloError: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#DC2626",
    marginBottom: 6,
  },
  textoError: {
    color: "#64748B",
    textAlign: "center",
  },
  bannerError: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 20,
  },
  textoErrorBanner: {
    color: "#FFFFFF",
    fontSize: 12,
  },
});