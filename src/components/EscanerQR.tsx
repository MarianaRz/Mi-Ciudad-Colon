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
  View,
} from "react-native";

import { useTema } from "../tema/TemaContext";
import Boton from "./ui/Boton";
import PantallaCarga from "./ui/PantallaCarga";
import Texto from "./ui/Texto";

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
  const { colores } = useTema();

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
        "No pudimos comprobar este código. Revisá tu conexión e intentá nuevamente.",
      );
    } finally {
      if (sesionActual === sesionEscaneo.current) {
        setComprobando(false);
      }
    }
  }
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <View style={[estilos.contenedor, { backgroundColor: colores.fondo }]}>
        <View
          style={[
            estilos.encabezado,
            {
              backgroundColor: colores.superficie,
              borderBottomColor: colores.borde,
            },
          ]}
        >
          <Texto style={estilos.titulo}>Escanear código QR</Texto>

          <Pressable
            onPress={cerrar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar escáner"
            style={[
              estilos.botonCerrar,
              { backgroundColor: colores.primarioSuave },
            ]}
          >
            <Ionicons name="close" size={24} color={colores.primarioFuerte} />
          </Pressable>
        </View>

        {!permiso ? (
          <PantallaCarga titulo="Comprobando permiso de cámara..." />
        ) : !permiso.granted ? (
          <View style={estilos.centro}>
            <View
              style={[
                estilos.circuloEstado,
                { backgroundColor: colores.primarioSuave },
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={32}
                color={colores.primarioFuerte}
              />
            </View>

            <Texto style={estilos.mensaje}>
              Necesitamos usar la cámara para leer el código QR del lugar que
              visitaste.
            </Texto>

            {permiso.canAskAgain ? (
              <View style={estilos.acciones}>
                <Boton titulo="Permitir cámara" onPress={solicitarPermiso} />
              </View>
            ) : (
              <Texto
                style={[estilos.ayuda, { color: colores.textoSecundario }]}
              >
                El permiso fue rechazado. Podés habilitarlo desde los ajustes
                del teléfono o registrar tu visita manualmente.
              </Texto>
            )}
          </View>
        ) : (
          <View style={estilos.contenedorCamara}>
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

            <View pointerEvents="none" style={estilos.superposicion}>
              <View style={estilos.sombra} />

              <View style={estilos.filaCentral}>
                <View style={estilos.sombra} />

                <View style={estilos.marcoQR}>
                  <View
                    style={[
                      estilos.esquina,
                      estilos.esquinaSuperiorIzquierda,
                      { borderColor: colores.primario },
                    ]}
                  />
                  <View
                    style={[
                      estilos.esquina,
                      estilos.esquinaSuperiorDerecha,
                      { borderColor: colores.primario },
                    ]}
                  />
                  <View
                    style={[
                      estilos.esquina,
                      estilos.esquinaInferiorIzquierda,
                      { borderColor: colores.primario },
                    ]}
                  />
                  <View
                    style={[
                      estilos.esquina,
                      estilos.esquinaInferiorDerecha,
                      { borderColor: colores.primario },
                    ]}
                  />
                </View>

                <View style={estilos.sombra} />
              </View>

              <View style={[estilos.sombra, estilos.sombraInferior]}>
                <Texto style={estilos.instrucciones}>
                  Apuntá la cámara al código QR del lugar.
                </Texto>
              </View>
            </View>

            {comprobando && (
              <View
                style={[
                  estilos.panelResultado,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.borde,
                  },
                ]}
              >
                <ActivityIndicator
                  size="large"
                  color={colores.primarioFuerte}
                />

                <Texto style={estilos.mensaje}>Comprobando código QR...</Texto>
              </View>
            )}

            {mensajeError && !comprobando && (
              <View
                style={[
                  estilos.panelResultado,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.borde,
                  },
                ]}
              >
                <View
                  style={[
                    estilos.circuloEstado,
                    { backgroundColor: colores.errorSuave },
                  ]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={32}
                    color={colores.error}
                  />
                </View>

                <Texto style={estilos.mensaje}>{mensajeError}</Texto>

                <View style={estilos.acciones}>
                  <Boton titulo="Volver a escanear" onPress={reintentar} />

                  <Boton titulo="Cancelar" variante="texto" onPress={cerrar} />
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const MARCO = 260;

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },

  encabezado: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },

  titulo: {
    fontSize: 20,
    fontWeight: "700",
  },

  botonCerrar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 16,
  },

  circuloEstado: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  mensaje: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },

  ayuda: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },

  acciones: {
    alignSelf: "stretch",
    gap: 6,
    marginTop: 4,
  },

  contenedorCamara: {
    flex: 1,
    backgroundColor: "#000000",
  },

  superposicion: {
    ...StyleSheet.absoluteFill,
  },

  sombra: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  filaCentral: {
    flexDirection: "row",
    height: MARCO,
  },

  marcoQR: {
    width: MARCO,
    height: MARCO,
  },

  esquina: {
    position: "absolute",
    width: 40,
    height: 40,
  },

  esquinaSuperiorIzquierda: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },

  esquinaSuperiorDerecha: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },

  esquinaInferiorIzquierda: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },

  esquinaInferiorDerecha: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },

  sombraInferior: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
  },

  instrucciones: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    textAlign: "center",
  },

  panelResultado: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "30%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
});
