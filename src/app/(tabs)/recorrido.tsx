import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import Boton from "../../components/ui/Boton";
import PantallaCarga from "../../components/ui/PantallaCarga";
import Texto from "../../components/ui/Texto";
import { useTema } from "../../tema/TemaContext";
import { fuentes } from "../../tema/tipografia";
import { obtenerInfoCategoria } from "../../utils/categorias";

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
import { obtenerLugares, obtenerLugarPorQr } from "../../servicios/lugares";

import {
  comprobarVisitaGps,
  PRECISION_MAXIMA_GPS_METROS,
  RADIO_VISITA_GPS_METROS,
} from "../../servicios/ubicacionVisitas";

import {
  obtenerVisitaReciente,
  obtenerVisitas,
  registrarVisita,
} from "../../servicios/visitas";

import { confirmarAccion } from "../../servicios/haptica";
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
  const { colores } = useTema();
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

  async function procesarQr(codigo: string): Promise<boolean> {
    const lugar = await obtenerLugarPorQr(codigo);

    if (!lugar) {
      // El escáner mostrará el mensaje de error
      // y permitirá volver a escanear.
      return false;
    }

    // QR válido: cerramos el escáner.
    setEscanerVisible(false);

    // Esperamos a que cierre el modal de cámara
    // antes de abrir el formulario de visita.
    setTimeout(() => {
      prepararRegistro(lugar, "qr");
    }, 400);

    return true;
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
  // Comprobar si existe una visita reciente
  // --------------------------------------------------

  async function guardarVisita() {
    if (!sesion || !lugarSeleccionado || guardando || seleccionandoFoto) {
      return;
    }

    setGuardando(true);

    try {
      const visitaReciente = await obtenerVisitaReciente(
        sesion.email,
        lugarSeleccionado.id,
        30,
      );

      if (visitaReciente) {
        setGuardando(false);

        Alert.alert(
          "Ya registraste este lugar",
          `Registraste una visita a ${lugarSeleccionado.nombre} durante los últimos 30 minutos.\n\n¿Querés registrar otra visita igualmente?`,
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Registrar igualmente",
              onPress: () => {
                void persistirVisita();
              },
            },
          ],
          { cancelable: false },
        );

        return;
      }

      await persistirVisita(true);
    } catch (error) {
      console.error("ERROR AL COMPROBAR VISITA RECIENTE:", error);

      setGuardando(false);

      Alert.alert(
        "Error",
        "No pudimos comprobar si ya registraste este lugar. Intentá nuevamente.",
      );
    }
  }

  // --------------------------------------------------
  // Guardar la visita en SQLite
  // --------------------------------------------------

  async function persistirVisita(bloqueoActivo = false) {
    if (
      !sesion ||
      !lugarSeleccionado ||
      (!bloqueoActivo && guardando) ||
      seleccionandoFoto
    ) {
      return;
    }

    setGuardando(true);

    let fotoPermanente: string | null = null;

    try {
      // Primero guardamos una copia permanente de la fotografía.
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

    // La visita ya quedó guardada correctamente.
    void confirmarAccion();

    setModalVisible(false);
    setLugarSeleccionado(null);
    setNota("");
    setFotoTemporal(null);
    setDistanciaGps(null);

    try {
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
    return <PantallaCarga titulo="Cargando tu recorrido..." />;
  }

  if (estado.fase === "error") {
    return (
      <View style={[estilos.centro, { backgroundColor: colores.fondo }]}>
        <View
          style={[
            estilos.circuloEstado,
            { backgroundColor: colores.errorSuave },
          ]}
        >
          <Ionicons name="alert-circle" size={32} color={colores.error} />
        </View>

        <Texto
          style={{
            fontSize: 15,
            color: colores.textoSecundario,
            textAlign: "center",
          }}
        >
          {estado.mensaje}
        </Texto>

        <View style={{ alignSelf: "stretch", marginTop: 8 }}>
          <Boton titulo="Reintentar" onPress={() => void cargarDatos()} />
        </View>
      </View>
    );
  }

  const { lugares, visitas } = estado;

  const red = {
    conectado: {
      fondo: colores.exitoSuave,
      color: colores.exito,
      icono: "wifi" as NombreIcono,
      titulo: "Con conexión",
      detalle: "Tus visitas se guardan en este dispositivo.",
    },
    "sin-conexion": {
      fondo: colores.advertenciaSuave,
      color: colores.advertencia,
      icono: "cloud-offline" as NombreIcono,
      titulo: "Sin conexión",
      detalle: "Podés seguir registrando visitas sin Internet.",
    },
    comprobando: {
      fondo: colores.primarioSuave,
      color: colores.primarioFuerte,
      icono: "sync" as NombreIcono,
      titulo: "Comprobando conexión...",
      detalle: "Consultando el estado de la red.",
    },
  }[conectividad];

  const iconosOrigen: Record<OrigenVisita, NombreIcono> = {
    qr: "qr-code",
    gps: "navigate",
    manual: "create",
  };

  const bloqueado = guardando || seleccionandoFoto;

  return (
    <View style={[estilos.contenedor, { backgroundColor: colores.fondo }]}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Texto
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: colores.textoSecundario,
          }}
        >
          Registrá tus visitas y guardá tus recuerdos de Colón.
        </Texto>

        {/* Estado de conectividad */}
        <View style={[estilos.tarjetaConexion, { backgroundColor: red.fondo }]}>
          <View
            style={[
              estilos.circuloConexion,
              { backgroundColor: colores.superficie },
            ]}
          >
            {conectividad === "comprobando" ? (
              <ActivityIndicator size="small" color={red.color} />
            ) : (
              <Ionicons name={red.icono} size={22} color={red.color} />
            )}
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Texto
              style={{ fontSize: 15, fontWeight: "700", color: red.color }}
            >
              {red.titulo}
            </Texto>
            <Texto style={{ fontSize: 13, color: colores.textoSecundario }}>
              {red.detalle}
            </Texto>
          </View>
        </View>

        {/* Historial de visitas */}
        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <View
              style={[
                estilos.iconoSeccion,
                { backgroundColor: colores.primarioSuave },
              ]}
            >
              <Ionicons
                name="footsteps"
                size={18}
                color={colores.primarioFuerte}
              />
            </View>

            <Texto style={{ flex: 1, fontSize: 20, fontWeight: "700" }}>
              Lugares visitados
            </Texto>

            {sesion && visitas.length > 0 && (
              <View
                style={[
                  estilos.contador,
                  { backgroundColor: colores.primario },
                ]}
              >
                <Texto
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colores.sobrePrimario,
                  }}
                >
                  {visitas.length}
                </Texto>
              </View>
            )}
          </View>

          {!sesion ? (
            <View
              style={[
                estilos.tarjetaVacia,
                SOMBRA,
                { backgroundColor: colores.superficie },
              ]}
            >
              <View
                style={[
                  estilos.circuloEstado,
                  { backgroundColor: colores.primarioSuave },
                ]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={34}
                  color={colores.primarioFuerte}
                />
              </View>

              <Texto
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: colores.textoSecundario,
                  textAlign: "center",
                }}
              >
                Iniciá sesión para guardar y consultar tus visitas.
              </Texto>

              <View style={{ alignSelf: "stretch" }}>
                <Boton
                  titulo="Iniciar sesión"
                  onPress={() => router.push("/login")}
                />
              </View>
            </View>
          ) : visitas.length === 0 ? (
            <View
              style={[
                estilos.tarjetaVacia,
                SOMBRA,
                { backgroundColor: colores.superficie },
              ]}
            >
              <View
                style={[
                  estilos.circuloEstado,
                  { backgroundColor: colores.primarioSuave },
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={34}
                  color={colores.primarioFuerte}
                />
              </View>

              <Texto
                style={{
                  fontSize: 15,
                  color: colores.textoSecundario,
                  textAlign: "center",
                }}
              >
                Todavía no registraste ninguna visita.
              </Texto>
            </View>
          ) : (
            visitas.map((visita) => {
              const lugar = lugares.find((item) => item.id === visita.lugarId);

              return (
                <View
                  key={visita.id}
                  style={[
                    estilos.tarjeta,
                    SOMBRA,
                    { backgroundColor: colores.superficie },
                  ]}
                >
                  {visita.fotoUri ? (
                    <Image
                      source={{ uri: visita.fotoUri }}
                      style={estilos.fotoHistorial}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        estilos.fotoHistorial,
                        estilos.iconoHistorial,
                        { backgroundColor: colores.exitoSuave },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={30}
                        color={colores.exito}
                      />
                    </View>
                  )}

                  <View style={{ flex: 1, gap: 6 }}>
                    <Texto
                      numberOfLines={2}
                      style={{ fontSize: 16, fontWeight: "700" }}
                    >
                      {lugar?.nombre ?? "Lugar no disponible"}
                    </Texto>

                    <View style={estilos.fila}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colores.textoSecundario}
                      />
                      <Texto
                        style={{ fontSize: 13, color: colores.textoSecundario }}
                      >
                        {formatearFecha(visita.fechaHora)}
                      </Texto>
                    </View>

                    <View style={estilos.filaPastillas}>
                      <Pastilla
                        icono={iconosOrigen[visita.origen]}
                        texto={textoOrigen(visita.origen)}
                        fondo={colores.primarioSuave}
                        color={colores.primarioFuerte}
                      />
                      <Pastilla
                        icono={
                          visita.sincronizada
                            ? "cloud-done-outline"
                            : "cloud-upload-outline"
                        }
                        texto={
                          visita.sincronizada
                            ? "Sincronizada"
                            : "Guardada en este dispositivo"
                        }
                        fondo={
                          visita.sincronizada
                            ? colores.exitoSuave
                            : colores.advertenciaSuave
                        }
                        color={
                          visita.sincronizada
                            ? colores.exito
                            : colores.advertencia
                        }
                      />
                    </View>

                    {visita.nota ? (
                      <Texto
                        style={{
                          fontSize: 14,
                          lineHeight: 20,
                          color: colores.textoSecundario,
                        }}
                      >
                        {visita.nota}
                      </Texto>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Registrar una visita */}
        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <View
              style={[
                estilos.iconoSeccion,
                { backgroundColor: colores.primarioSuave },
              ]}
            >
              <Ionicons
                name="location"
                size={18}
                color={colores.primarioFuerte}
              />
            </View>

            <Texto style={{ flex: 1, fontSize: 20, fontWeight: "700" }}>
              Registrar una visita
            </Texto>
          </View>

          <Texto
            style={{
              fontSize: 14,
              lineHeight: 21,
              color: colores.textoSecundario,
            }}
          >
            Registrá una visita manualmente, mediante QR o comprobando tu
            ubicación GPS.
          </Texto>

          {/* Escáner QR */}
          <Pressable
            style={[estilos.botonQr, { backgroundColor: colores.primario }]}
            onPress={abrirEscaner}
            role="button"
            accessibilityLabel="Escanear código QR"
          >
            <Ionicons name="qr-code" size={22} color={colores.sobrePrimario} />

            <Texto
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colores.sobrePrimario,
              }}
            >
              Escanear código QR
            </Texto>
          </Pressable>

          {/* Lugares disponibles */}
          {lugares.length === 0 ? (
            <View
              style={[
                estilos.tarjetaVacia,
                SOMBRA,
                { backgroundColor: colores.superficie },
              ]}
            >
              <Texto style={{ fontSize: 15, color: colores.textoSecundario }}>
                No hay lugares disponibles.
              </Texto>
            </View>
          ) : (
            lugares.map((lugar) => {
              const { icono, color } = obtenerInfoCategoria(lugar.categoriaId);

              return (
                <View
                  key={lugar.id}
                  style={[
                    estilos.tarjetaLugar,
                    SOMBRA,
                    { backgroundColor: colores.superficie },
                  ]}
                >
                  <View style={estilos.filaLugar}>
                    <View
                      style={[
                        estilos.iconoLugar,
                        { backgroundColor: `${color}20` },
                      ]}
                    >
                      <Ionicons name={icono} size={22} color={color} />
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Texto style={{ fontSize: 16, fontWeight: "700" }}>
                        {lugar.nombre}
                      </Texto>

                      <Texto
                        numberOfLines={2}
                        style={{ fontSize: 13, color: colores.textoSecundario }}
                      >
                        {lugar.direccion}
                      </Texto>
                    </View>
                  </View>

                  <View style={estilos.accionesLugar}>
                    {/* Registro manual */}
                    <Pressable
                      style={[
                        estilos.botonAccion,
                        { backgroundColor: colores.primarioSuave },
                        comprobandoGps !== null && estilos.botonDeshabilitado,
                      ]}
                      onPress={() => abrirRegistro(lugar)}
                      disabled={comprobandoGps !== null}
                      role="button"
                      accessibilityLabel={`Registrar manualmente una visita a ${lugar.nombre}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colores.primarioFuerte}
                      />

                      <Texto
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: colores.primarioFuerte,
                        }}
                      >
                        Manual
                      </Texto>
                    </Pressable>

                    {/* Registro GPS */}
                    <Pressable
                      style={[
                        estilos.botonAccion,
                        { backgroundColor: colores.primario, flex: 1.4 },
                        comprobandoGps !== null && estilos.botonDeshabilitado,
                      ]}
                      onPress={() => registrarConGps(lugar)}
                      disabled={comprobandoGps !== null}
                      role="button"
                      accessibilityLabel={`Comprobar ubicación GPS para ${lugar.nombre}`}
                    >
                      {comprobandoGps === lugar.id ? (
                        <ActivityIndicator
                          size="small"
                          color={colores.sobrePrimario}
                        />
                      ) : (
                        <Ionicons
                          name="navigate-outline"
                          size={18}
                          color={colores.sobrePrimario}
                        />
                      )}

                      <Texto
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: colores.sobrePrimario,
                        }}
                      >
                        {comprobandoGps === lugar.id
                          ? "Ubicando..."
                          : "Registrar con GPS"}
                      </Texto>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          <View
            style={[
              estilos.avisoGps,
              { backgroundColor: colores.primarioSuave },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={colores.primarioFuerte}
            />

            <Texto
              style={{
                flex: 1,
                fontSize: 13,
                lineHeight: 19,
                color: colores.textoSecundario,
              }}
            >
              Para registrar con GPS necesitás estar a
              {` ${RADIO_VISITA_GPS_METROS} metros `}o menos del lugar. La
              ubicación se consulta únicamente cuando tocás el botón.
            </Texto>
          </View>
        </View>
      </ScrollView>

      {/* Modal de confirmación */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModal}
      >
        <KeyboardAvoidingView
          style={estilos.fondoModal}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={estilos.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                estilos.contenidoModal,
                { backgroundColor: colores.superficie },
              ]}
            >
              <View
                style={[estilos.manija, { backgroundColor: colores.borde }]}
              />

              {/* Encabezado */}
              <View style={estilos.encabezadoModal}>
                <Texto style={{ flex: 1, fontSize: 22, fontWeight: "700" }}>
                  Confirmar visita
                </Texto>

                <Pressable
                  onPress={cerrarModal}
                  disabled={bloqueado}
                  hitSlop={10}
                  style={[
                    estilos.botonCerrar,
                    { backgroundColor: colores.primarioSuave },
                  ]}
                  role="button"
                  accessibilityLabel="Cerrar formulario"
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colores.primarioFuerte}
                  />
                </Pressable>
              </View>

              <Texto style={{ fontSize: 18, fontWeight: "700" }}>
                {lugarSeleccionado?.nombre}
              </Texto>

              <View style={estilos.filaPastillas}>
                <Pastilla
                  icono={iconosOrigen[origenRegistro]}
                  texto={textoOrigen(origenRegistro)}
                  fondo={colores.primarioSuave}
                  color={colores.primarioFuerte}
                />
              </View>

              {/* Distancia GPS */}
              {origenRegistro === "gps" && distanciaGps !== null && (
                <View
                  style={[
                    estilos.confirmacionGps,
                    { backgroundColor: colores.exitoSuave },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colores.exito}
                  />

                  <Texto
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "600",
                      color: colores.exito,
                    }}
                  >
                    Ubicación verificada: estás a
                    {` ${formatearDistancia(distanciaGps)} `}
                    del lugar.
                  </Texto>
                </View>
              )}

              {/* Fotografía */}
              <Texto style={estilos.etiquetaCampo}>Fotografía (opcional)</Texto>

              {fotoTemporal ? (
                <View style={estilos.vistaPrevia}>
                  <ImagenNativa
                    key={fotoTemporal}
                    source={{ uri: fotoTemporal }}
                    style={estilos.imagenPrevia}
                    resizeMode="cover"
                  />

                  <Pressable
                    style={[
                      estilos.botonQuitarFoto,
                      { backgroundColor: colores.superficie },
                    ]}
                    onPress={() => setFotoTemporal(null)}
                    disabled={bloqueado}
                    role="button"
                    accessibilityLabel="Quitar fotografía"
                  >
                    <Ionicons
                      name="close-circle"
                      size={30}
                      color={colores.error}
                    />
                  </Pressable>
                </View>
              ) : (
                <View
                  style={[
                    estilos.placeholderFoto,
                    {
                      backgroundColor: colores.primarioSuave,
                      borderColor: colores.borde,
                    },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={34}
                    color={colores.primarioFuerte}
                  />

                  <Texto
                    style={{ fontSize: 14, color: colores.textoSecundario }}
                  >
                    Sin fotografía
                  </Texto>
                </View>
              )}

              {/* Cámara y galería */}
              <View style={estilos.filaFotos}>
                <Pressable
                  style={[
                    estilos.botonFoto,
                    { borderColor: colores.borde },
                    bloqueado && estilos.botonDeshabilitado,
                  ]}
                  onPress={sacarFoto}
                  disabled={bloqueado}
                  role="button"
                  accessibilityLabel="Sacar una foto con la cámara"
                >
                  <Ionicons
                    name="camera"
                    size={20}
                    color={colores.primarioFuerte}
                  />

                  <Texto style={{ fontSize: 14, fontWeight: "700" }}>
                    Cámara
                  </Texto>
                </Pressable>

                <Pressable
                  style={[
                    estilos.botonFoto,
                    { borderColor: colores.borde },
                    bloqueado && estilos.botonDeshabilitado,
                  ]}
                  onPress={elegirFoto}
                  disabled={bloqueado}
                  role="button"
                  accessibilityLabel="Elegir una foto de la galería"
                >
                  <Ionicons
                    name="images"
                    size={20}
                    color={colores.primarioFuerte}
                  />

                  <Texto style={{ fontSize: 14, fontWeight: "700" }}>
                    Galería
                  </Texto>
                </Pressable>
              </View>

              {/* Nota */}
              <Texto style={estilos.etiquetaCampo}>
                Nota personal (opcional)
              </Texto>

              <TextInput
                style={[
                  estilos.campoNota,
                  {
                    borderColor: colores.borde,
                    backgroundColor: colores.superficie,
                    color: colores.texto,
                  },
                ]}
                placeholder="¿Qué te pareció este lugar?"
                placeholderTextColor={colores.textoSecundario}
                value={nota}
                onChangeText={setNota}
                multiline
                maxLength={500}
                textAlignVertical="top"
                editable={!guardando}
              />

              <Texto
                style={{
                  fontSize: 12,
                  color: colores.textoSecundario,
                  textAlign: "right",
                }}
              >
                {nota.length}/500
              </Texto>

              {/* Guardar */}
              <Boton
                titulo="Guardar visita"
                cargando={guardando}
                disabled={seleccionandoFoto}
                onPress={guardarVisita}
              />

              {/* Cancelar */}
              <Boton
                titulo="Cancelar"
                variante="texto"
                disabled={bloqueado}
                onPress={cerrarModal}
              />
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
// Componentes auxiliares
// --------------------------------------------------

type NombreIcono = React.ComponentProps<typeof Ionicons>["name"];

interface PastillaProps {
  icono: NombreIcono;
  texto: string;
  fondo: string;
  color: string;
}

function Pastilla({ icono, texto, fondo, color }: PastillaProps) {
  return (
    <View style={[estilos.pastilla, { backgroundColor: fondo }]}>
      <Ionicons name={icono} size={14} color={color} />

      <Texto style={{ fontSize: 12, fontWeight: "600", color }}>{texto}</Texto>
    </View>
  );
}

// --------------------------------------------------
// Estilos
// --------------------------------------------------

const SOMBRA = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
} as const;

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },

  contenido: {
    padding: 16,
    paddingBottom: 32,
    gap: 20,
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },

  circuloEstado: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  tarjetaConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
  },

  circuloConexion: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  seccion: { gap: 12 },

  encabezadoSeccion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconoSeccion: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  contador: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  tarjetaVacia: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },

  tarjeta: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 20,
  },

  fotoHistorial: {
    width: 76,
    height: 76,
    borderRadius: 16,
  },

  iconoHistorial: {
    alignItems: "center",
    justifyContent: "center",
  },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  filaPastillas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  pastilla: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  botonQr: {
    minHeight: 54,
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },

  tarjetaLugar: {
    borderRadius: 20,
    padding: 14,
    gap: 14,
  },

  filaLugar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconoLugar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  accionesLugar: {
    flexDirection: "row",
    gap: 10,
  },

  botonAccion: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },

  botonDeshabilitado: { opacity: 0.55 },

  avisoGps: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
  },

  // Modal
  fondoModal: {
    flex: 1,
    backgroundColor: "rgba(20, 27, 45, 0.5)",
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  contenidoModal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
  },

  manija: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 6,
  },

  encabezadoModal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  botonCerrar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  confirmacionGps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
  },

  etiquetaCampo: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },

  vistaPrevia: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
  },

  imagenPrevia: {
    width: "100%",
    height: "100%",
  },

  botonQuitarFoto: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderFoto: {
    height: 120,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  filaFotos: {
    flexDirection: "row",
    gap: 10,
  },

  botonFoto: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  campoNota: {
    minHeight: 110,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fuentes.regular,
    fontSize: 15,
  },
});
