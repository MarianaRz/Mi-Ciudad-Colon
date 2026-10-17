import Ionicons from "@react-native-vector-icons/ionicons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";

import { useRef, useState } from "react";

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
  onEscaneado: (codigo: string) => void;
}

export default function EscanerQR({
  visible,
  onCerrar,
  onEscaneado,
}: EscanerQRProps) {
  const [permiso, solicitarPermiso] = useCameraPermissions();

  const [escaneado, setEscaneado] = useState(false);

  // Evitar múltiples lecturas antes de que React actualice el estado.
  const procesando = useRef(false);

  function cerrar() {
    procesando.current = false;
    setEscaneado(false);
    onCerrar();
  }

  function procesarCodigo(resultado: BarcodeScanningResult) {
    if (procesando.current) return;

    procesando.current = true;
    setEscaneado(true);

    onEscaneado(resultado.data);
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
});
