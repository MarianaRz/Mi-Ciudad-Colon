import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import Aviso from "../../components/ui/Aviso";
import PantallaCarga from "../../components/ui/PantallaCarga";
import Texto from "../../components/ui/Texto";

import { obtenerCategoriasApi } from "../../api/categorias";
import { obtenerLugaresApi } from "../../api/lugares";
import { useUbicacion } from "../../hooks/useUbicacion";
import { useTema } from "../../tema/TemaContext";
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
  const { colores } = useTema();
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

  // Va ANTES de los return condicionales (regla de los hooks)
  const { data: respuestaCategorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: obtenerCategoriasApi,
  });

  if (isLoading) {
    return <PantallaCarga titulo="Cargando mapa y lugares..." />;
  }

  if (error) {
    return (
      <View style={[styles.centrado, { backgroundColor: colores.fondo }]}>
        <View
          style={[
            styles.circuloEstado,
            { backgroundColor: colores.errorSuave },
          ]}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={32}
            color={colores.error}
          />
        </View>

        <Texto
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colores.error,
            textAlign: "center",
          }}
        >
          Error de conexión
        </Texto>

        <Texto
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: colores.textoSecundario,
            textAlign: "center",
          }}
        >
          No se pudieron cargar los datos de la API.
        </Texto>
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
      {/* MAPA PRINCIPAL */}
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
              <View
                style={[
                  styles.pinMarcador,
                  { backgroundColor: color, borderColor: colores.superficie },
                ]}
              >
                <Ionicons name={icono} size={18} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}

        {rutaActiva && (
          <Polyline
            coordinates={rutaActiva.puntos}
            strokeColor={colores.primarioFuerte}
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* BUSCADOR SUPERIOR */}
      <BuscadorMapa
        lugares={respuestaLugares?.datos || []}
        onSeleccionarLugar={manejarSeleccionDestino}
        onCambiarEstadoBusqueda={setBuscando}
      />

      {/* FILTRO DE CATEGORÍAS */}
      {!buscando && (
        <FiltroCategorias
          categorias={respuestaCategorias?.datos ?? []}
          categoriaSeleccionada={categoriaActiva}
          onSeleccionarCategoria={setCategoriaActiva}
        />
      )}

      {/* TARJETA DE RUTA ACTIVA */}
      {lugarDestino && rutaActiva && (
        <TarjetaRuta
          lugar={lugarDestino}
          ruta={rutaActiva}
          onCerrar={cerrarRuta}
        />
      )}

      {/* BANNER DE ERROR GPS */}
      {errorUbicacion && (
        <View style={styles.bannerError}>
          <Aviso mensaje={errorUbicacion} />
        </View>
      )}

      {/* BOTÓN PERSONALIZADO DE MI UBICACIÓN */}
      {!buscando && !lugarDestino && (
        <View style={styles.contenedorBotonFlotante}>
          <TouchableOpacity
            style={[
              styles.botonUbicacion,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
              },
            ]}
            onPress={centrarEnMiUbicacion}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Centrar el mapa en mi ubicación"
          >
            <Ionicons name="locate" size={24} color={colores.primarioFuerte} />
          </TouchableOpacity>
        </View>
      )}

      {/* LISTA CERCA TUYO (Oculta al buscar o navegar) */}
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
    padding: 24,
    gap: 12,
  },
  circuloEstado: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pinMarcador: {
    padding: 7,
    borderRadius: 20,
    borderWidth: 2,
    elevation: 4,
  },
  bannerError: {
    position: "absolute",
    top: 165,
    left: 16,
    right: 16,
  },
  contenedorBotonFlotante: {
    position: "absolute",
    bottom: 100,
    right: 16,
    zIndex: 10,
  },
  botonUbicacion: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});
