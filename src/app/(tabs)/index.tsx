import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import PantallaCarga from "../../components/ui/PantallaCarga";

import { obtenerLugaresApi } from "../../api/lugares";
import { useUbicacion } from "../../hooks/useUbicacion";
import { Lugar } from "../../tipos/lugar";
import { obtenerInfoCategoria } from "../../utils/categorias";
import { calcularDistanciaMetros } from "../../utils/distancias";
import { obtenerRutaPorCalles, ResultadoRuta } from "../../utils/rutas";

import { BuscadorMapa } from "../../components/BuscadorMapa";
import { FiltroCategorias } from "../../components/FiltroCategorias";
import { ListaCercaTuyo } from "../../components/ListaCercaTuyo";
import { TarjetaRuta } from "../../components/TarjetaRuta";

export default function MapaScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { ubicacionUsuario, errorUbicacion } = useUbicacion();

  const [buscando, setBuscando] = useState(false);
  const [lugarDestino, setLugarDestino] = useState<Lugar | null>(null);
  const [rutaActiva, setRutaActiva] = useState<ResultadoRuta | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);

  const {
    data: respuestaLugares,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["lugares"],
    queryFn: obtenerLugaresApi,
  });

  if (isLoading) {
    return <PantallaCarga titulo="Cargando mapa y lugares..." />;
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.tituloError}>Error de conexión</Text>
        <Text style={styles.textoError}>
          No se pudieron cargar los datos de la API.
        </Text>
      </View>
    );
  }

  const latCentro = ubicacionUsuario?.latitude ?? -32.225;
  const lonCentro = ubicacionUsuario?.longitude ?? -58.148;

  // Filtrar lugares según la categoría
  const lugaresVisibles =
    respuestaLugares?.datos?.filter((lugar) =>
      categoriaActiva ? lugar.categoriaId === categoriaActiva : true,
    ) || [];

  // Calcular distancias y ordenar los 3 más cercanos
  const lugaresConDistancia =
    respuestaLugares?.datos?.map((lugar) => {
      const distanciaMetros = lugar.coordenadas
        ? calcularDistanciaMetros(
            latCentro,
            lonCentro,
            lugar.coordenadas.latitud,
            lugar.coordenadas.longitud,
          )
        : 0;
      return { ...lugar, distanciaMetros };
    }) || [];

  lugaresConDistancia.sort((a, b) => a.distanciaMetros - b.distanciaMetros);
  const lugaresCercanos = lugaresConDistancia.slice(0, 3);

  // Funciones para manejar la ruta
  const manejarSeleccionDestino = async (lugar: Lugar) => {
    if (!lugar.coordenadas) return;

    setBuscando(false);
    setLugarDestino(lugar);

    const resultado = await obtenerRutaPorCalles(
      latCentro,
      lonCentro,
      lugar.coordenadas.latitud,
      lugar.coordenadas.longitud,
    );

    if (resultado) {
      setRutaActiva(resultado);
      mapRef.current?.fitToCoordinates(resultado.puntos, {
        edgePadding: { top: 150, right: 50, bottom: 180, left: 50 },
        animated: true,
      });
    }
  };

  const cerrarRuta = () => {
    setLugarDestino(null);
    setRutaActiva(null);
    mapRef.current?.animateToRegion(
      {
        latitude: latCentro,
        longitude: lonCentro,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500,
    );
  };

  const centrarEnMiUbicacion = () => {
    if (ubicacionUsuario) {
      mapRef.current?.animateToRegion(
        {
          latitude: ubicacionUsuario.latitude,
          longitude: ubicacionUsuario.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        500,
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. MAPA PRINCIPAL */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.mapa}
        initialRegion={{
          latitude: latCentro,
          longitude: lonCentro,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        showsScale={false}
      >
        {lugaresVisibles.map((lugar) => {
          if (!lugar.coordenadas) return null;
          const { icono, color } = obtenerInfoCategoria(lugar.categoriaId);

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
              tracksViewChanges={true}
            >
              <View style={[styles.pinMarcador, { backgroundColor: color }]}>
                <Ionicons name={icono} size={18} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}

        {rutaActiva && (
          <Polyline
            coordinates={rutaActiva.puntos}
            strokeColor="#075985"
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* 2. BUSCADOR SUPERIOR */}
      <BuscadorMapa
        lugares={respuestaLugares?.datos || []}
        onSeleccionarLugar={manejarSeleccionDestino}
        onCambiarEstadoBusqueda={setBuscando}
      />

      {/* 2B. FILTRO DE CATEGORÍAS */}
      {!buscando && (
        <FiltroCategorias
          categoriaSeleccionada={categoriaActiva}
          onSeleccionarCategoria={setCategoriaActiva}
        />
      )}

      {/* 3. TARJETA DE RUTA ACTIVA */}
      {lugarDestino && rutaActiva && (
        <TarjetaRuta
          lugar={lugarDestino}
          ruta={rutaActiva}
          onCerrar={cerrarRuta}
        />
      )}

      {/* 4. LISTA CERCA TUYO (Oculta al buscar o navegar) */}
      {!buscando && !lugarDestino && (
        <ListaCercaTuyo lugares={lugaresCercanos} />
      )}

      {/* 5. BANNER DE ERROR GPS */}
      {errorUbicacion && (
        <View style={styles.bannerError}>
          <Text style={styles.textoErrorBanner}>{errorUbicacion}</Text>
        </View>
      )}

      {/* 3B. BOTÓN PERSONALIZADO DE MI UBICACIÓN */}
      {!buscando && !lugarDestino && (
        <View style={styles.contenedorBotonFlotante}>
          <TouchableOpacity
            style={styles.botonUbicacion}
            onPress={centrarEnMiUbicacion}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={24} color="#3F5BD0" />
          </TouchableOpacity>
        </View>
      )}

      {/* 4. LISTA CERCA TUYO (Oculta al buscar o navegar) */}
      {!buscando && !lugarDestino && (
        <ListaCercaTuyo lugares={lugaresCercanos} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapa: { flex: 1 },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  textoCarga: { marginTop: 10, color: "#475569", fontSize: 15 },
  tituloError: { fontSize: 18, fontWeight: "700", color: "#B91C1C" },
  textoError: { marginTop: 6, color: "#64748B", textAlign: "center" },
  pinMarcador: {
    padding: 7,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 4,
  },
  bannerError: {
    position: "absolute",
    top: 165,
    left: 16,
    right: 16,
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 10,
  },
  textoErrorBanner: { color: "#B91C1C", fontSize: 12, textAlign: "center" },

  contenedorBotonFlotante: {
    position: "absolute",
    bottom: 100,
    right: 16,
    zIndex: 10,
  },
  botonUbicacion: {
    backgroundColor: "#FFFFFF",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    // Sombras para iOS y Android
    shadowColor: "#444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
