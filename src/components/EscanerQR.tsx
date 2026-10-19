import Ionicons from "@react-native-vector-icons/ionicons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";

import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface EscanerQRProps {
  visible: boolean;
  onCerrar: () => void;
  onEscaneado: (codigo: string) => Promise<boolean>;
}

export default function EscanerQR({
  visible,
  onCerrar,
  onEscaneado,
}: EscanerQRProps) {
  const [permiso, solicitarPermiso] = useCameraPermissions();

  const [escaneado, setEscaneado] = useState(false);
  const [comprobando, setComprobando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const procesando = useRef(false);
  const sesionEscaneo = useRef(0);

  // Reiniciar el escáner cada vez que se abre o se cierra.
  useEffect(() => {
    sesionEscaneo.current += 1;
    procesando.current = false;
    setEscaneado(false);
    setComprobando(false);
    setMensajeError(null);

    return () => {
      sesionEscaneo.current += 1;
    };
  }, [visible]);

  function cerrar() {
    sesionEscaneo.current += 1;
    procesando.current = false;
    setEscaneado(false);
    setComprobando(false);
    setMensajeError(null);
    onCerrar();
  }

  function reintentar() {
    sesionEscaneo.current += 1;
    procesando.current = false;
    setEscaneado(false);
    setComprobando(false);
    setMensajeError(null);
  }

  async function procesarCodigo(resultado: BarcodeScanningResult) {
    if (procesando.current || !visible) {
      return;
    }

    procesando.current = true;
    setEscaneado(true);
    setComprobando(true);
    setMensajeError(null);

    const sesionActual = sesionEscaneo.current;

    try {
      const reconocido = await onEscaneado(resultado.data);

      // Ignorar respuestas que llegaron después de cerrar
      // o reiniciar el escáner.
      if (sesionActual !== sesionEscaneo.current) {
        return;
      }

      if (!reconocido) {
        setMensajeError(
          "Código QR no reconocido como un punto turístico de Colón.",
        );
      }
    } catch (error) {
      console.error("ERROR AL PROCESAR QR:", error);

      if (sesionActual !== sesionEscaneo.current) {
        return;
      }

      setMensajeError(
        "No pudimos comprobar este código QR. Intentá nuevamente.",
      );
    } finally {
      if (sesionActual === sesionEscaneo.current) {
        setComprobando(false);
      }
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Escanear código QR</Text>

          <Pressable
            onPress={cerrar}
            accessibilityRole="button"
            accessibilityLabel="Cerrar escáner"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
        </View>

        {!permiso ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color="#075985" />

            <Text style={styles.mensaje}>Comprobando permiso de cámara...</Text>
          </View>
        ) : !permiso.granted ? (
          <View style={styles.centro}>
            <Ionicons name="camera-outline" size={54} color="#075985" />

            <Text style={styles.mensaje}>
              Necesitamos usar la cámara para leer el código QR del lugar que
              visitaste.
            </Text>

            {permiso.canAskAgain ? (
              <Pressable style={styles.boton} onPress={solicitarPermiso}>
                <Text style={styles.textoBoton}>Permitir cámara</Text>
              </Pressable>
            ) : (
              <Text style={styles.ayuda}>
                El permiso fue rechazado. Podés habilitarlo desde los ajustes
                del teléfono o registrar tu visita manualmente.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.contenedorCamara}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={
                visible && !escaneado ? procesarCodigo : undefined
              }
            />

            <View pointerEvents="none" style={styles.superposicion}>
              <View style={styles.marcoQR} />

              <Text style={styles.instrucciones}>
                Apuntá la cámara al código QR del lugar.
              </Text>
            </View>

            {comprobando && (
              <View style={styles.panelResultado}>
                <ActivityIndicator size="large" color="#075985" />

                <Text style={styles.mensaje}>Comprobando código QR...</Text>
              </View>
            )}

            {mensajeError && !comprobando && (
              <View style={styles.panelResultado}>
                <Ionicons
                  name="alert-circle-outline"
                  size={46}
                  color="#B42318"
                />

                <Text style={styles.mensaje}>{mensajeError}</Text>

                <Pressable
                  style={styles.boton}
                  onPress={reintentar}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBoton}>Volver a escanear</Text>
                </Pressable>

                <Pressable
                  style={styles.botonCancelar}
                  onPress={cerrar}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  encabezado: {
    backgroundColor: "#075985",
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 20,
  },

  mensaje: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },

  ayuda: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },

  boton: {
    backgroundColor: "#075985",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  contenedorCamara: {
    flex: 1,
    backgroundColor: "#000000",
  },

  superposicion: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },

  marcoQR: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 20,
  },

  instrucciones: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  panelResultado: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },

  botonCancelar: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },

  textoCancelar: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
});
