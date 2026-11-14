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
  View,
} from "react-native";

import {
  descargarAudioguia,
  obtenerAudioguiaDescargada,
} from "../servicios/audioguias";
import { useTema } from "../tema/TemaContext";
import Aviso from "./ui/Aviso";
import Texto from "./ui/Texto";

interface Props {
  lugarId: string;
  url: string | number;
  duracionSegundos: number;
  idioma: "es" | "en" | "pt";
}

const SALTO_SEGUNDOS = 15;

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
  const { colores } = useTema();
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

  const faltan = Math.max(0, duracion - estado.currentTime);

  async function saltar(segundos: number) {
    if (cargando || procesando) return;

    const destino = Math.min(
      Math.max(0, estado.currentTime + segundos),
      duracion,
    );

    try {
      await player.seekTo(destino);
    } catch {
      Alert.alert(
        "Error de reproducción",
        "No pudimos mover la audioguía. Intentá nuevamente.",
      );
    }
  }

  const progreso =
    duracion > 0 ? Math.min(1, Math.max(0, estado.currentTime / duracion)) : 0;

  const botonPrincipalInactivo = cargando || procesando;

  return (
    <View
      style={[
        styles.contenedor,
        { backgroundColor: colores.superficie, borderColor: colores.borde },
      ]}
    >
      <View style={styles.encabezado}>
        <View
          style={[
            styles.iconoContenedor,
            { backgroundColor: colores.primarioSuave },
          ]}
        >
          <Ionicons
            name="headset-outline"
            size={26}
            color={colores.primarioFuerte}
          />
        </View>

        <View style={styles.informacion}>
          <Texto style={{ fontSize: 18, fontWeight: "700" }}>Audioguía</Texto>

          <View style={styles.filaMeta}>
            <View
              style={[
                styles.pastilla,
                { backgroundColor: colores.primarioSuave },
              ]}
            >
              <Ionicons
                name="language-outline"
                size={14}
                color={colores.primarioFuerte}
              />
              <Texto
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colores.primarioFuerte,
                }}
              >
                {idioma.toUpperCase()}
              </Texto>
            </View>

            <View
              style={[
                styles.pastilla,
                { backgroundColor: colores.primarioSuave },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={colores.primarioFuerte}
              />
              <Texto
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colores.primarioFuerte,
                }}
              >
                {formatearTiempo(duracion)}
              </Texto>
            </View>
          </View>
        </View>
      </View>

      {/* Progreso */}
      <View style={styles.bloqueProgreso}>
        <View
          style={[styles.barra, { backgroundColor: colores.primarioSuave }]}
          accessibilityRole="progressbar"
          accessibilityLabel="Progreso de la audioguía"
        >
          <View
            style={[
              styles.barraRelleno,
              {
                width: `${progreso * 100}%`,
                backgroundColor: colores.primarioFuerte,
              },
            ]}
          />
        </View>

        <View style={styles.filaTiempos}>
          <Texto
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colores.textoSecundario,
            }}
          >
            {formatearTiempo(estado.currentTime)}
          </Texto>

          <Texto style={{ fontSize: 13, color: colores.textoSecundario }}>
            Faltan {formatearTiempo(faltan)}
          </Texto>
        </View>
      </View>

      {/* Controles */}
      <View style={styles.controles}>
        <Pressable
          style={({ pressed }) => [
            styles.botonSalto,
            {
              backgroundColor: colores.primarioSuave,
              opacity: cargando ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => void saltar(-SALTO_SEGUNDOS)}
          disabled={cargando}
          accessibilityRole="button"
          accessibilityLabel={`Retroceder ${SALTO_SEGUNDOS} segundos`}
          accessibilityState={{ disabled: cargando }}
        >
          <Ionicons name="play-back" size={20} color={colores.primarioFuerte} />
          <Texto
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colores.primarioFuerte,
            }}
          >
            {SALTO_SEGUNDOS}
          </Texto>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.boton,
            {
              backgroundColor: colores.primario,
              opacity: botonPrincipalInactivo ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => void alternarReproduccion()}
          disabled={cargando || procesando}
          accessibilityRole="button"
          accessibilityLabel={
            reproduciendo ? "Pausar audioguía" : "Reproducir audioguía"
          }
        >
          {cargando || procesando ? (
            <ActivityIndicator color={colores.sobrePrimario} />
          ) : (
            <Ionicons
              name={reproduciendo ? "pause" : "play"}
              size={24}
              color={colores.sobrePrimario}
            />
          )}

          <Texto
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colores.sobrePrimario,
            }}
          >
            {cargando ? "Cargando..." : reproduciendo ? "Pausar" : "Reproducir"}
          </Texto>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.botonSalto,
            {
              backgroundColor: colores.primarioSuave,
              opacity: cargando ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => void saltar(SALTO_SEGUNDOS)}
          disabled={cargando}
          accessibilityRole="button"
          accessibilityLabel={`Adelantar ${SALTO_SEGUNDOS} segundos`}
          accessibilityState={{ disabled: cargando }}
        >
          <Ionicons
            name="play-forward"
            size={20}
            color={colores.primarioFuerte}
          />
          <Texto
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colores.primarioFuerte,
            }}
          >
            {SALTO_SEGUNDOS}
          </Texto>
        </Pressable>
      </View>

      {disponibleOffline ? (
        <View
          style={[
            styles.estadoOffline,
            { backgroundColor: colores.exitoSuave },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={colores.exito} />
          <Texto
            style={{ fontSize: 14, fontWeight: "700", color: colores.exito }}
          >
            Disponible sin conexión
          </Texto>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.botonDescarga,
            {
              backgroundColor: colores.primarioSuave,
              opacity: descargando ? 0.55 : pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => void descargar()}
          disabled={descargando}
          accessibilityRole="button"
          accessibilityLabel="Descargar audioguía para escuchar sin conexión"
        >
          {descargando ? (
            <ActivityIndicator color={colores.primarioFuerte} />
          ) : (
            <Ionicons
              name="download-outline"
              size={20}
              color={colores.primarioFuerte}
            />
          )}

          <Texto
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: "700",
              color: colores.primarioFuerte,
            }}
          >
            {descargando
              ? "Descargando audioguía..."
              : "Descargar para escuchar sin conexión"}
          </Texto>
        </Pressable>
      )}

      {estado.error && <Aviso mensaje="No se pudo cargar la audioguía." />}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    alignItems: "center",
    justifyContent: "center",
  },
  informacion: {
    flex: 1,
    gap: 6,
  },
  filaMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pastilla: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bloqueProgreso: {
    gap: 8,
  },
  barra: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    borderRadius: 3,
  },
  filaTiempos: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  boton: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 26,
  },
  botonSalto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  estadoOffline: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  botonDescarga: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
});
