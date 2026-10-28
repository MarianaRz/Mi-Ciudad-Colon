import Ionicons from "@react-native-vector-icons/ionicons";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  descargarAudioguia,
  obtenerAudioguiaDescargada,
} from "../servicios/audioguias";

interface Props {
  lugarId: string;
  url: string | number;
  duracionSegundos: number;
  idioma: "es" | "en" | "pt";
}

const AZUL = "#075985";

function formatearTiempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  const segundosRestantes = total % 60;

  return `${minutos}:${String(segundosRestantes).padStart(2, "0")}`;
}

export default function ReproductorAudioguia({
  lugarId,
  url,
  duracionSegundos,
  idioma,
}: Props) {
  const audioIncluido = typeof url === "number";

  const [archivoDescargado, setArchivoDescargado] = useState<string | null>(
    () => (audioIncluido ? null : obtenerAudioguiaDescargada(lugarId)),
  );

  const fuenteAudio = audioIncluido ? url : (archivoDescargado ?? url);

  return (
    <ReproductorInterno
      key={`${lugarId}-${archivoDescargado ?? "original"}`}
      lugarId={lugarId}
      urlOriginal={url}
      fuenteAudio={fuenteAudio}
      duracionSegundos={duracionSegundos}
      idioma={idioma}
      archivoDescargado={archivoDescargado}
      onDescargado={setArchivoDescargado}
    />
  );
}

interface PropsInternas {
  lugarId: string;
  urlOriginal: string | number;
  fuenteAudio: string | number;
  duracionSegundos: number;
  idioma: "es" | "en" | "pt";
  archivoDescargado: string | null;
  onDescargado: (archivo: string) => void;
}

function ReproductorInterno({
  lugarId,
  urlOriginal,
  fuenteAudio,
  duracionSegundos,
  idioma,
  archivoDescargado,
  onDescargado,
}: PropsInternas) {
  const player = useAudioPlayer(fuenteAudio);
  const estado = useAudioPlayerStatus(player);

  const [descargando, setDescargando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const disponibleOffline =
    typeof urlOriginal === "number" || archivoDescargado !== null;

  useEffect(() => {
    async function configurarAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });
      } catch {
        Alert.alert(
          "Error de audio",
          "No se pudo configurar la reproducción en segundo plano.",
        );
      }
    }

    void configurarAudio();
  }, []);

  useEffect(() => {
    if (!estado.isLoaded) return;

    player.setActiveForLockScreen(true, {
      title: "Audioguía",
      artist: "Mi Ciudad Colón",
    });
  }, [player, estado.isLoaded]);

  const reproduciendo = estado.playing;
  const cargando = !estado.isLoaded;

  async function alternarReproduccion() {
    if (procesando || cargando) return;

    try {
      setProcesando(true);

      if (reproduciendo) {
        player.pause();
      } else {
        if (estado.didJustFinish) {
          await player.seekTo(0);
        }

        player.play();
      }
    } catch {
      Alert.alert(
        "Error de reproducción",
        "No pudimos reproducir esta audioguía. Comprobá tu conexión e intentá nuevamente.",
      );
    } finally {
      setProcesando(false);
    }
  }

  async function descargar() {
    if (typeof urlOriginal !== "string" || descargando || disponibleOffline) {
      return;
    }

    try {
      setDescargando(true);

      const archivo = await descargarAudioguia(lugarId, urlOriginal);

      if (estado.playing) {
        player.pause();
      }

      onDescargado(archivo);

      Alert.alert(
        "Descarga completada",
        "La audioguía ya está disponible para escuchar sin conexión.",
      );
    } catch (error) {
      Alert.alert(
        "Error de descarga",
        error instanceof Error
          ? error.message
          : "No pudimos descargar esta audioguía.",
      );
    } finally {
      setDescargando(false);
    }
  }

  const duracion = estado.duration > 0 ? estado.duration : duracionSegundos;

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <View style={styles.iconoContenedor}>
          <Ionicons name="headset-outline" size={26} color={AZUL} />
        </View>

        <View style={styles.informacion}>
          <Text style={styles.titulo}>Audioguía</Text>
          <Text style={styles.descripcion}>
            Idioma: {idioma.toUpperCase()} · {formatearTiempo(duracion)}
          </Text>
        </View>
      </View>

      <View style={styles.controles}>
        <Pressable
          style={[
            styles.boton,
            (cargando || procesando) && styles.botonDeshabilitado,
          ]}
          onPress={() => void alternarReproduccion()}
          disabled={cargando || procesando}
          accessibilityRole="button"
          accessibilityLabel={
            reproduciendo ? "Pausar audioguía" : "Reproducir audioguía"
          }
        >
          {cargando || procesando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons
              name={reproduciendo ? "pause" : "play"}
              size={24}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.textoBoton}>
            {cargando ? "Cargando..." : reproduciendo ? "Pausar" : "Reproducir"}
          </Text>
        </Pressable>

        <Text style={styles.tiempo}>
          {formatearTiempo(estado.currentTime)} / {formatearTiempo(duracion)}
        </Text>
      </View>

      {disponibleOffline ? (
        <View style={styles.estadoOffline}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#167A3E" />
          <Text style={styles.textoOffline}>Disponible sin conexión</Text>
        </View>
      ) : (
        <Pressable
          style={[
            styles.botonDescarga,
            descargando && styles.botonDeshabilitado,
          ]}
          onPress={() => void descargar()}
          disabled={descargando}
          accessibilityRole="button"
          accessibilityLabel="Descargar audioguía para escuchar sin conexión"
        >
          {descargando ? (
            <ActivityIndicator color={AZUL} />
          ) : (
            <Ionicons name="download-outline" size={20} color={AZUL} />
          )}

          <Text style={styles.textoDescarga}>
            {descargando
              ? "Descargando audioguía..."
              : "Descargar para escuchar sin conexión"}
          </Text>
        </Pressable>
      )}

      {estado.error && (
        <Text style={styles.error}>No se pudo cargar la audioguía.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 18,
    gap: 18,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconoContenedor: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  informacion: {
    flex: 1,
    gap: 5,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
  },
  descripcion: {
    fontSize: 14,
    color: "#64748B",
  },
  controles: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: AZUL,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  tiempo: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  estadoOffline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textoOffline: {
    color: "#167A3E",
    fontSize: 14,
    fontWeight: "600",
  },
  botonDescarga: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  textoDescarga: {
    color: AZUL,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  error: {
    color: "#B42318",
    fontSize: 14,
  },
});
