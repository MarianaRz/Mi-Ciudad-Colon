import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image as ImagenNativa,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import EscanerQR from "../../components/EscanerQR";
import { useSesion } from "../../contextos/SesionContext";
import { useConectividad } from "../../hooks/useConectividad";
import {
  eliminarFotoVisita,
  guardarFotoVisita,
} from "../../servicios/fotosVisitas";
import { obtenerLugarPorQr, obtenerLugares } from "../../servicios/lugares";

import {
  comprobarVisitaGps,
  PRECISION_MAXIMA_GPS_METROS,
  RADIO_VISITA_GPS_METROS,
} from "../../servicios/ubicacionVisitas";

import { obtenerVisitas, registrarVisita } from "../../servicios/visitas";

import { Lugar } from "../../tipos/lugar";
import { OrigenVisita, Visita } from "../../tipos/visita";

type EstadoPantalla =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | { fase: "listo"; lugares: Lugar[]; visitas: Visita[] };

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function textoOrigen(origen: OrigenVisita): string {
  switch (origen) {
    case "qr":
      return "Código QR";

    case "gps":
      return "Ubicación GPS";

    case "manual":
      return "Registro manual";
  }
}

function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)} metros`;
  }

  return `${(metros / 1000).toFixed(1)} km`;
}

export default function RecorridoScreen() {
  const { sesion, cargando: cargandoSesion } = useSesion();

  // Detectar conectividad mediante expo-network.
  const conectividad = useConectividad();

  const [estado, setEstado] = useState<EstadoPantalla>({
    fase: "cargando",
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [escanerVisible, setEscanerVisible] = useState(false);

  const [lugarSeleccionado, setLugarSeleccionado] = useState<Lugar | null>(
    null,
  );

  const [origenRegistro, setOrigenRegistro] = useState<OrigenVisita>("manual");

  const [nota, setNota] = useState("");

  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);

  const [seleccionandoFoto, setSeleccionandoFoto] = useState(false);

  const [comprobandoGps, setComprobandoGps] = useState<string | null>(null);

  const [distanciaGps, setDistanciaGps] = useState<number | null>(null);

  // --------------------------------------------------
  // Cargar lugares y visitas
  // --------------------------------------------------

  const cargarDatos = useCallback(async () => {
    try {
      setEstado({ fase: "cargando" });

      const respuesta = await obtenerLugares();

      const visitas = sesion ? await obtenerVisitas(sesion.email) : [];

      setEstado({
        fase: "listo",
        lugares: respuesta.datos,
        visitas,
      });
    } catch (error) {
      setEstado({
        fase: "error",
        mensaje:
          error instanceof Error
            ? error.message
            : "No pudimos cargar tu recorrido.",
      });
    }
  }, [sesion?.email]);

  useFocusEffect(
    useCallback(() => {
      if (!cargandoSesion) {
        cargarDatos();
      }
    }, [cargandoSesion, cargarDatos]),
  );

  // --------------------------------------------------
  // Sesión
  // --------------------------------------------------

  function solicitarInicioSesion() {
    Alert.alert(
      "Iniciá sesión",
      "Necesitás una cuenta para registrar visitas.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Iniciar sesión",
          onPress: () => router.push("/login"),
        },
      ],
    );
  }

  // --------------------------------------------------
  // Preparar registro
  // --------------------------------------------------

  function prepararRegistro(
    lugar: Lugar,
    origen: OrigenVisita,
    distancia: number | null = null,
  ) {
    setLugarSeleccionado(lugar);
    setOrigenRegistro(origen);
    setDistanciaGps(distancia);
    setNota("");
    setFotoTemporal(null);
    setModalVisible(true);
  }

  function abrirRegistro(lugar: Lugar) {
    if (!sesion) {
      solicitarInicioSesion();
      return;
    }

    prepararRegistro(lugar, "manual");
  }

  // --------------------------------------------------
  // Registro mediante QR
  // --------------------------------------------------

  function abrirEscaner() {
    if (!sesion) {
      solicitarInicioSesion();
      return;
    }

    setEscanerVisible(true);
  }

  async function procesarQr(codigo: string) {
    setEscanerVisible(false);

    try {
      const lugar = await obtenerLugarPorQr(codigo);

      if (!lugar) {
        Alert.alert(
          "Código no reconocido",
          "Este QR no corresponde a un lugar turístico registrado.",
        );

        return;
      }

      // Esperar el cierre del modal de cámara.
      setTimeout(() => {
        prepararRegistro(lugar, "qr");
      }, 400);
    } catch {
      Alert.alert("Error", "No pudimos comprobar el código QR.");
    }
  }

  // --------------------------------------------------
  // Registro mediante GPS
  // --------------------------------------------------

  async function registrarConGps(lugar: Lugar) {
    if (!sesion) {
      solicitarInicioSesion();
      return;
    }

    if (comprobandoGps !== null) {
      return;
    }

    setComprobandoGps(lugar.id);

    try {
      const resultado = await comprobarVisitaGps(lugar.coordenadas);

      switch (resultado.estado) {
        case "dentro":
          prepararRegistro(lugar, "gps", resultado.distanciaMetros);
          break;

        case "lejos":
          Alert.alert(
            "Estás lejos del lugar",
            `Tu ubicación está aproximadamente a ${formatearDistancia(
              resultado.distanciaMetros,
            )} de ${lugar.nombre}.\n\nPara registrar una visita mediante GPS necesitás estar a ${RADIO_VISITA_GPS_METROS} metros o menos.\n\nSi querés, podés utilizar el registro manual.`,
          );
          break;

        case "precision-insuficiente":
          Alert.alert(
            "Ubicación poco precisa",
            resultado.precisionMetros === null
              ? "El celular no pudo determinar la precisión de tu ubicación. Intentá nuevamente al aire libre o utilizá el registro manual."
              : `La ubicación tiene un margen de error aproximado de ${Math.round(
                  resultado.precisionMetros,
                )} metros.\n\nPara registrar mediante GPS necesitamos una precisión de ${PRECISION_MAXIMA_GPS_METROS} metros o mejor.\n\nIntentá nuevamente al aire libre, habilitá la ubicación precisa en Android o utilizá el registro manual.`,
          );
          break;

        case "permiso-denegado":
          Alert.alert(
            "Permiso de ubicación",
            "No tenemos permiso para consultar tu ubicación. Podés habilitarlo desde los ajustes de Android o registrar la visita manualmente.",
          );
          break;

        case "ubicacion-desactivada":
          Alert.alert(
            "Ubicación desactivada",
            "Activá la ubicación del celular para registrar la visita mediante GPS. También podés utilizar el registro manual.",
          );
          break;

        case "error":
          Alert.alert(
            "No pudimos obtener tu ubicación",
            `${resultado.mensaje}\n\nPodés intentar nuevamente o registrar la visita manualmente.`,
          );
          break;
      }
    } catch (error) {
      console.error("ERROR GPS:", error);

      Alert.alert(
        "Error de ubicación",
        "No pudimos comprobar tu ubicación. Intentá nuevamente.",
      );
    } finally {
      setComprobandoGps(null);
    }
  }

  // --------------------------------------------------
  // Seleccionar fotografía de la galería
  // --------------------------------------------------

  async function elegirFoto() {
    if (seleccionandoFoto || guardando) {
      return;
    }

    setSeleccionandoFoto(true);

    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets.length > 0) {
        setFotoTemporal(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error("ERROR AL ELEGIR FOTO:", error);

      Alert.alert("Error", "No se pudo seleccionar la fotografía.");
    } finally {
      setSeleccionandoFoto(false);
    }
  }

  // --------------------------------------------------
  // Sacar fotografía con la cámara
  // --------------------------------------------------

  async function sacarFoto() {
    if (seleccionandoFoto || guardando) {
      return;
    }

    setSeleccionandoFoto(true);

    try {
      const permiso = await ImagePicker.getCameraPermissionsAsync();

      let autorizado = permiso.granted;

      if (!autorizado && permiso.canAskAgain) {
        const respuesta = await ImagePicker.requestCameraPermissionsAsync();

        autorizado = respuesta.granted;
      }

      if (!autorizado) {
        Alert.alert(
          "Permiso de cámara",
          "Para sacar una fotografía necesitás permitir el acceso a la cámara. También podés elegir una imagen de tu galería o guardar la visita sin foto.",
        );

        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets.length > 0) {
        setFotoTemporal(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error("ERROR AL SACAR FOTO:", error);

      Alert.alert("Error", "No pudimos sacar la fotografía.");
    } finally {
      setSeleccionandoFoto(false);
    }
  }

  // --------------------------------------------------
  // Guardar visita en SQLite
  // --------------------------------------------------

 async function guardarVisita() {
   if (!sesion || !lugarSeleccionado || guardando || seleccionandoFoto) {
     return;
   }

   setGuardando(true);

   let fotoPermanente: string | null = null;

   try {
     // Primero guardamos una copia permanente.
     if (fotoTemporal) {
       fotoPermanente = await guardarFotoVisita(fotoTemporal);
     }

     // Después registramos la visita en SQLite.
     await registrarVisita(
       sesion.email,
       lugarSeleccionado.id,
       origenRegistro,
       nota.trim() || null,
       fotoPermanente,
     );
   } catch (error) {
     console.error("ERROR AL GUARDAR VISITA:", error);

     // Si SQLite falló después de copiar la fotografía,
     // eliminamos únicamente nuestra copia privada.
     if (fotoPermanente) {
       try {
         await eliminarFotoVisita(fotoPermanente);
       } catch (errorLimpieza) {
         console.error("ERROR AL LIMPIAR FOTOGRAFÍA:", errorLimpieza);
       }
     }

     Alert.alert(
       "Error",
       "No pudimos completar el registro. Intentá nuevamente.",
     );

     setGuardando(false);
     return;
   }

   // Llegamos acá solamente si SQLite guardó correctamente.
   setModalVisible(false);
   setLugarSeleccionado(null);
   setNota("");
   setFotoTemporal(null);
   setDistanciaGps(null);

   try {
     // Actualizamos el historial por separado.
     await cargarDatos();
   } catch (error) {
     console.error("ERROR AL ACTUALIZAR HISTORIAL:", error);
   } finally {
     setGuardando(false);
   }

   Alert.alert("¡Visita registrada!", "Agregamos este lugar a tu recorrido.");
 }

  // --------------------------------------------------
  // Cerrar formulario
  // --------------------------------------------------

  function cerrarModal() {
    if (guardando || seleccionandoFoto) {
      return;
    }

    setModalVisible(false);
    setLugarSeleccionado(null);
    setNota("");
    setFotoTemporal(null);
    setDistanciaGps(null);
  }

  // --------------------------------------------------
  // Estados de carga y error
  // --------------------------------------------------

  if (estado.fase === "cargando") {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#075985" />

        <Text style={styles.textoSecundario}>Cargando tu recorrido...</Text>
      </View>
    );
  }

  if (estado.fase === "error") {
    return (
      <View style={styles.centro}>
        <Ionicons name="alert-circle-outline" size={42} color="#B42318" />

        <Text style={styles.textoSecundario}>{estado.mensaje}</Text>

        <Pressable style={styles.botonPrincipal} onPress={cargarDatos}>
          <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const { lugares, visitas } = estado;

  return (
    <View style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Mi recorrido</Text>

          <Text style={styles.descripcion}>
            Registrá tus visitas y guardá tus recuerdos de Colón.
          </Text>
        </View>

        {/* ---------------------------------------- */}
        {/* Estado de conectividad                  */}
        {/* ---------------------------------------- */}

        <View
          style={[
            styles.tarjetaConexion,
            conectividad === "conectado"
              ? styles.conexionActiva
              : conectividad === "sin-conexion"
                ? styles.conexionInactiva
                : styles.conexionComprobando,
          ]}
        >
          {conectividad === "comprobando" ? (
            <ActivityIndicator size="small" color="#075985" />
          ) : (
            <Ionicons
              name={
                conectividad === "conectado"
                  ? "wifi-outline"
                  : "cloud-offline-outline"
              }
              size={23}
              color={conectividad === "conectado" ? "#15803D" : "#B45309"}
            />
          )}

          <View style={styles.informacionConexion}>
            <Text
              style={[
                styles.tituloConexion,
                conectividad === "sin-conexion"
                  ? styles.textoConexionInactiva
                  : styles.textoConexionActiva,
              ]}
            >
              {conectividad === "comprobando"
                ? "Comprobando conexión..."
                : conectividad === "conectado"
                  ? "Con conexión"
                  : "Sin conexión"}
            </Text>

            <Text style={styles.descripcionConexion}>
              {conectividad === "conectado"
                ? "Tus visitas se guardan en este dispositivo."
                : conectividad === "sin-conexion"
                  ? "Podés seguir registrando visitas sin Internet."
                  : "Consultando el estado de la red."}
            </Text>
          </View>
        </View>

        {/* ---------------------------------------- */}
        {/* Historial de visitas                    */}
        {/* ---------------------------------------- */}

        <View style={styles.seccion}>
          <View style={styles.encabezadoSeccion}>
            <Ionicons name="footsteps-outline" size={23} color="#075985" />

            <Text style={styles.tituloSeccion}>Lugares visitados</Text>

            {sesion && visitas.length > 0 && (
              <View style={styles.contador}>
                <Text style={styles.textoContador}>{visitas.length}</Text>
              </View>
            )}
          </View>

          {!sesion ? (
            <View style={styles.tarjetaVacia}>
              <Text style={styles.textoSecundario}>
                Iniciá sesión para guardar y consultar tus visitas.
              </Text>

              <Pressable
                style={styles.botonPrincipal}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.textoBotonPrincipal}>Iniciar sesión</Text>
              </Pressable>
            </View>
          ) : visitas.length === 0 ? (
            <View style={styles.tarjetaVacia}>
              <Ionicons name="map-outline" size={34} color="#94A3B8" />

              <Text style={styles.textoSecundario}>
                Todavía no registraste ninguna visita.
              </Text>
            </View>
          ) : (
            visitas.map((visita) => {
              const lugar = lugares.find((item) => item.id === visita.lugarId);

              return (
                <View key={visita.id} style={styles.tarjetaVisita}>
                  {visita.fotoUri ? (
                    <Image
                      source={{
                        uri: visita.fotoUri,
                      }}
                      style={styles.fotoHistorial}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.iconoHistorial}>
                      <Ionicons
                        name="checkmark-circle"
                        size={29}
                        color="#16A34A"
                      />
                    </View>
                  )}

                  <View style={styles.informacionVisita}>
                    <Text style={styles.nombreLugar}>
                      {lugar?.nombre ?? "Lugar no disponible"}
                    </Text>

                    <Text style={styles.fecha}>
                      {formatearFecha(visita.fechaHora)}
                    </Text>

                    <Text style={styles.origenVisita}>
                      {textoOrigen(visita.origen)}
                    </Text>

                    {visita.nota && (
                      <Text style={styles.notaVisita}>{visita.nota}</Text>
                    )}

                    <Text style={styles.estadoSincronizacion}>
                      {visita.sincronizada
                        ? "Sincronizada"
                        : "Guardada en este dispositivo"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ---------------------------------------- */}
        {/* Registrar una visita                    */}
        {/* ---------------------------------------- */}

        <View style={styles.seccion}>
          <View style={styles.encabezadoSeccion}>
            <Ionicons name="location-outline" size={23} color="#075985" />

            <Text style={styles.tituloSeccion}>Registrar una visita</Text>
          </View>

          <Text style={styles.descripcionSeccion}>
            Registrá una visita manualmente, mediante QR o comprobando tu
            ubicación GPS.
          </Text>

          {/* Escáner QR */}
          <Pressable
            style={styles.botonQr}
            onPress={abrirEscaner}
            accessibilityRole="button"
            accessibilityLabel="Escanear código QR"
          >
            <Ionicons name="qr-code-outline" size={24} color="#075985" />

            <Text style={styles.textoBotonQr}>Escanear código QR</Text>
          </Pressable>

          {/* Lugares disponibles */}
          {lugares.length === 0 ? (
            <View style={styles.tarjetaVacia}>
              <Text style={styles.textoSecundario}>
                No hay lugares disponibles.
              </Text>
            </View>
          ) : (
            lugares.map((lugar) => (
              <View key={lugar.id} style={styles.tarjetaLugar}>
                <View style={styles.filaLugar}>
                  <View style={styles.iconoLugar}>
                    <Ionicons
                      name="location-outline"
                      size={22}
                      color="#075985"
                    />
                  </View>

                  <View style={styles.informacionLugar}>
                    <Text style={styles.nombreLugar}>{lugar.nombre}</Text>

                    <Text style={styles.direccion} numberOfLines={2}>
                      {lugar.direccion}
                    </Text>
                  </View>
                </View>

                <View style={styles.accionesLugar}>
                  {/* Registro manual */}
                  <Pressable
                    style={styles.botonManual}
                    onPress={() => abrirRegistro(lugar)}
                    disabled={comprobandoGps !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Registrar manualmente una visita a ${lugar.nombre}`}
                  >
                    <Ionicons name="create-outline" size={19} color="#075985" />

                    <Text style={styles.textoBotonManual}>Manual</Text>
                  </Pressable>

                  {/* Registro GPS */}
                  <Pressable
                    style={[
                      styles.botonGps,
                      comprobandoGps !== null && styles.botonDeshabilitado,
                    ]}
                    onPress={() => registrarConGps(lugar)}
                    disabled={comprobandoGps !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Comprobar ubicación GPS para ${lugar.nombre}`}
                  >
                    {comprobandoGps === lugar.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name="navigate-outline"
                        size={19}
                        color="#FFFFFF"
                      />
                    )}

                    <Text style={styles.textoBotonGps}>
                      {comprobandoGps === lugar.id
                        ? "Ubicando..."
                        : "Registrar con GPS"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          <Text style={styles.avisoGps}>
            Para registrar con GPS necesitás estar a
            {` ${RADIO_VISITA_GPS_METROS} metros `}o menos del lugar. La
            ubicación se consulta únicamente cuando tocás el botón.
          </Text>
        </View>
      </ScrollView>

      {/* ---------------------------------------- */}
      {/* Modal de confirmación                   */}
      {/* ---------------------------------------- */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModal}
      >
        <KeyboardAvoidingView
          style={styles.fondoModal}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contenidoModal}>
              {/* Encabezado */}
              <View style={styles.encabezadoModal}>
                <Text style={styles.tituloModal}>Confirmar visita</Text>

                <Pressable
                  onPress={cerrarModal}
                  disabled={guardando || seleccionandoFoto}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar formulario"
                >
                  <Ionicons name="close" size={26} color="#64748B" />
                </Pressable>
              </View>

              <Text style={styles.nombreModal}>
                {lugarSeleccionado?.nombre}
              </Text>

              <Text style={styles.origenModal}>
                {textoOrigen(origenRegistro)}
              </Text>

              {/* Distancia GPS */}
              {origenRegistro === "gps" && distanciaGps !== null && (
                <View style={styles.confirmacionGps}>
                  <Ionicons name="checkmark-circle" size={21} color="#15803D" />

                  <Text style={styles.textoConfirmacionGps}>
                    Ubicación verificada: estás a
                    {` ${formatearDistancia(distanciaGps)} `}
                    del lugar.
                  </Text>
                </View>
              )}

              {/* Fotografía */}
              <Text style={styles.etiqueta}>Fotografía (opcional)</Text>

              {fotoTemporal ? (
                <View style={styles.vistaPrevia}>
                  <ImagenNativa
                    key={fotoTemporal}
                    source={{
                      uri: fotoTemporal,
                    }}
                    style={styles.imagenPrevia}
                    resizeMode="cover"
                  />

                  <Pressable
                    style={styles.botonQuitarFoto}
                    onPress={() => setFotoTemporal(null)}
                    disabled={guardando || seleccionandoFoto}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar fotografía"
                  >
                    <Ionicons name="close-circle" size={30} color="#B42318" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.placeholderFoto}>
                  <Ionicons name="image-outline" size={34} color="#94A3B8" />

                  <Text style={styles.textoPlaceholder}>Sin fotografía</Text>
                </View>
              )}

              {/* Cámara y galería */}
              <View style={styles.filaFotos}>
                <Pressable
                  style={styles.botonFoto}
                  onPress={sacarFoto}
                  disabled={guardando || seleccionandoFoto}
                >
                  <Ionicons name="camera-outline" size={22} color="#075985" />

                  <Text style={styles.textoBotonFoto}>Cámara</Text>
                </Pressable>

                <Pressable
                  style={styles.botonFoto}
                  onPress={elegirFoto}
                  disabled={guardando || seleccionandoFoto}
                >
                  <Ionicons name="images-outline" size={22} color="#075985" />

                  <Text style={styles.textoBotonFoto}>Galería</Text>
                </Pressable>
              </View>

              {/* Nota */}
              <Text style={styles.etiqueta}>Nota personal (opcional)</Text>

              <TextInput
                style={styles.campoNota}
                placeholder="¿Qué te pareció este lugar?"
                placeholderTextColor="#94A3B8"
                value={nota}
                onChangeText={setNota}
                multiline
                maxLength={500}
                textAlignVertical="top"
                editable={!guardando}
              />

              <Text style={styles.contadorNota}>{nota.length}/500</Text>

              {/* Guardar */}
              <Pressable
                style={[
                  styles.botonPrincipal,
                  (guardando || seleccionandoFoto) && styles.botonDeshabilitado,
                ]}
                onPress={guardarVisita}
                disabled={guardando || seleccionandoFoto}
              >
                {guardando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoBotonPrincipal}>Guardar visita</Text>
                )}
              </Pressable>

              {/* Cancelar */}
              <Pressable
                style={styles.botonCancelar}
                onPress={cerrarModal}
                disabled={guardando || seleccionandoFoto}
              >
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Escáner QR */}
      <EscanerQR
        visible={escanerVisible}
        onCerrar={() => setEscanerVisible(false)}
        onEscaneado={procesarQr}
      />
    </View>
  );
}

// --------------------------------------------------
// Estilos
// --------------------------------------------------

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  contenido: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 20,
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
    backgroundColor: "#F8FAFC",
  },

  encabezado: {
    gap: 6,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "700",
    color: "#17202A",
  },

  descripcion: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
  },

  // ----------------------------------------
  // Conectividad
  // ----------------------------------------

  tarjetaConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
  },

  conexionActiva: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },

  conexionInactiva: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },

  conexionComprobando: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },

  informacionConexion: {
    flex: 1,
    gap: 3,
  },

  tituloConexion: {
    fontSize: 14,
    fontWeight: "700",
  },

  textoConexionActiva: {
    color: "#166534",
  },

  textoConexionInactiva: {
    color: "#92400E",
  },

  descripcionConexion: {
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
  },

  // ----------------------------------------
  // Secciones
  // ----------------------------------------

  seccion: {
    gap: 12,
  },

  encabezadoSeccion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  tituloSeccion: {
    fontSize: 19,
    fontWeight: "700",
    color: "#17202A",
  },

  contador: {
    backgroundColor: "#E0F2FE",
    borderRadius: 20,
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  textoContador: {
    color: "#075985",
    fontSize: 13,
    fontWeight: "700",
  },

  textoSecundario: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
    textAlign: "center",
  },

  descripcionSeccion: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },

  tarjetaVacia: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  // ----------------------------------------
  // Historial
  // ----------------------------------------

  tarjetaVisita: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  fotoHistorial: {
    width: 82,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },

  iconoHistorial: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  informacionVisita: {
    flex: 1,
    gap: 5,
  },

  nombreLugar: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17202A",
  },

  fecha: {
    fontSize: 13,
    color: "#64748B",
  },

  origenVisita: {
    fontSize: 12,
    fontWeight: "700",
    color: "#075985",
  },

  notaVisita: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
    marginTop: 3,
  },

  estadoSincronizacion: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  // ----------------------------------------
  // Lugares
  // ----------------------------------------

  tarjetaLugar: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    gap: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconoLugar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  informacionLugar: {
    flex: 1,
    gap: 3,
  },

  direccion: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },

  accionesLugar: {
    flexDirection: "row",
    gap: 9,
  },

  botonManual: {
    flex: 1,
    minHeight: 46,
    backgroundColor: "#E0F2FE",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 9,
  },

  textoBotonManual: {
    fontSize: 14,
    fontWeight: "700",
    color: "#075985",
  },

  botonGps: {
    flex: 1.5,
    minHeight: 46,
    backgroundColor: "#075985",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 9,
  },

  textoBotonGps: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  avisoGps: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  // ----------------------------------------
  // Botones principales
  // ----------------------------------------

  botonPrincipal: {
    minHeight: 52,
    backgroundColor: "#075985",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  textoBotonPrincipal: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  botonQr: {
    minHeight: 52,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#075985",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 14,
  },

  textoBotonQr: {
    color: "#075985",
    fontSize: 16,
    fontWeight: "700",
  },

  // ----------------------------------------
  // Modal
  // ----------------------------------------

  fondoModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  contenidoModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    gap: 12,
  },

  encabezadoModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  tituloModal: {
    fontSize: 21,
    fontWeight: "700",
    color: "#17202A",
  },

  nombreModal: {
    fontSize: 17,
    fontWeight: "700",
    color: "#075985",
  },

  origenModal: {
    fontSize: 13,
    color: "#64748B",
  },

  etiqueta: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    marginTop: 4,
  },

  // ----------------------------------------
  // Fotografías
  // ----------------------------------------

  vistaPrevia: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    position: "relative",
  },

  imagenPrevia: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },

  botonQuitarFoto: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 2,
  },

  placeholderFoto: {
    height: 100,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  textoPlaceholder: {
    color: "#64748B",
    fontSize: 13,
  },

  filaFotos: {
    flexDirection: "row",
    gap: 10,
  },

  botonFoto: {
    flex: 1,
    minHeight: 48,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
  },

  textoBotonFoto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#075985",
  },

  // ----------------------------------------
  // Nota
  // ----------------------------------------

  campoNota: {
    minHeight: 85,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#17202A",
    backgroundColor: "#F8FAFC",
  },

  contadorNota: {
    textAlign: "right",
    color: "#94A3B8",
    fontSize: 12,
  },

  botonCancelar: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  textoCancelar: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },

  // ----------------------------------------
  // Confirmación GPS
  // ----------------------------------------

  confirmacionGps: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  textoConfirmacionGps: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#166534",
  },
});
