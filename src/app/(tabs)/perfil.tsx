import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { UsuarioApi } from "../../api/usuario";
import { obtenerMiUsuarioApi } from "../../api/usuario";
import { BloqueoSesion } from "../../components/BloqueoSesion";
import Boton from "../../components/ui/Boton";
import Texto from "../../components/ui/Texto";
import { useSesion } from "../../contextos/SesionContext";
import { useTema } from "../../tema/TemaContext";

const SOMBRA = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;

type IconoAcceso = "heart-outline" | "calendar-outline" | "footsteps-outline";
type IconoDato = "mail-outline" | "lock-closed-outline";
type IconoBeneficio = "heart-outline" | "footsteps-outline" | "cloud-outline";

function AccesoFila({
  icono,
  titulo,
  subtitulo,
  alPresionar,
}: {
  icono: IconoAcceso;
  titulo: string;
  subtitulo: string;
  alPresionar: () => void;
}) {
  const { colores } = useTema();

  return (
    <Pressable
      onPress={alPresionar}
      role="button"
      accessibilityLabel={`${titulo}. ${subtitulo}`}
      style={[estilos.acceso, SOMBRA, { backgroundColor: colores.superficie }]}
    >
      <View
        style={[estilos.iconoTile, { backgroundColor: colores.primarioSuave }]}
      >
        <Ionicons name={icono} size={24} color={colores.primarioFuerte} />
      </View>

      <View style={estilos.textos}>
        <Texto style={{ fontSize: 16, fontWeight: "700" }}>{titulo}</Texto>
        <Texto
          style={{
            fontSize: 13,
            lineHeight: 19,
            color: colores.textoSecundario,
          }}
        >
          {subtitulo}
        </Texto>
      </View>

      <Ionicons
        name="chevron-forward"
        size={22}
        color={colores.textoSecundario}
      />
    </Pressable>
  );
}

function FilaDato({
  icono,
  titulo,
  valor,
  primera = false,
}: {
  icono: IconoDato;
  titulo: string;
  valor: string;
  primera?: boolean;
}) {
  const { colores } = useTema();

  return (
    <View
      style={[
        estilos.filaDato,
        !primera && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colores.borde,
        },
      ]}
    >
      <View
        style={[estilos.iconoTile, { backgroundColor: colores.primarioSuave }]}
      >
        <Ionicons name={icono} size={22} color={colores.primarioFuerte} />
      </View>

      <View style={estilos.textos}>
        <Texto style={{ fontSize: 15, fontWeight: "700" }}>{titulo}</Texto>
        <Texto
          style={{
            fontSize: 13,
            lineHeight: 19,
            color: colores.textoSecundario,
          }}
        >
          {valor}
        </Texto>
      </View>
    </View>
  );
}

function Beneficio({ icono, texto }: { icono: IconoBeneficio; texto: string }) {
  const { colores } = useTema();

  return (
    <View style={estilos.beneficio}>
      <View
        style={[estilos.iconoTile, { backgroundColor: colores.primarioSuave }]}
      >
        <Ionicons name={icono} size={22} color={colores.primarioFuerte} />
      </View>
      <Texto style={{ fontSize: 15, lineHeight: 22, flex: 1 }}>{texto}</Texto>
    </View>
  );
}

export default function PerfilScreen() {
  const { colores } = useTema();
  const { sesion, cargando, bloqueada, cerrarSesion } = useSesion();

  const emailSesion = sesion?.email;
  const [usuarioApi, setUsuarioApi] = useState<UsuarioApi | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      if (!emailSesion || bloqueada) {
        setUsuarioApi(null);
        return () => {
          activo = false;
        };
      }

      setUsuarioApi(null);

      async function cargarUsuario() {
        try {
          const usuario = await obtenerMiUsuarioApi();
          if (activo) setUsuarioApi(usuario);
        } catch {
          // Si la API no responde, se muestran los datos de la sesión local.
          if (activo) setUsuarioApi(null);
        }
      }

      void cargarUsuario();

      return () => {
        activo = false;
      };
    }, [emailSesion, bloqueada]),
  );

  const nombreUsuario = usuarioApi?.nombre ?? sesion?.nombre;
  const emailUsuario = usuarioApi?.email ?? sesion?.email ?? "";

  function confirmarCierreSesion() {
    Alert.alert(
      "Cerrar sesión",
      "¿Querés cerrar tu sesión en Mi Ciudad Colón?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => void cerrarSesion(),
        },
      ],
    );
  }

  if (cargando) {
    return (
      <View style={[estilos.centro, { backgroundColor: colores.fondo }]}>
        <ActivityIndicator size="large" color={colores.primarioFuerte} />
        <Texto style={{ fontSize: 15, color: colores.textoSecundario }}>
          Cargando tu cuenta...
        </Texto>
      </View>
    );
  }

  if (sesion && bloqueada) {
    return <BloqueoSesion email={sesion.email} />;
  }

  if (!sesion) {
    return (
      <SafeAreaView
        style={[estilos.safeArea, { backgroundColor: colores.fondo }]}
        edges={[]}
      >
        <ScrollView
          contentContainerStyle={estilos.contenido}
          showsVerticalScrollIndicator={false}
        >
          <View style={estilos.bienvenida}>
            <View
              style={[
                estilos.avatarInvitado,
                { backgroundColor: colores.primarioSuave },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={44}
                color={colores.primarioFuerte}
              />
            </View>

            <Texto style={estilos.titulo}>Tu espacio en Colón</Texto>

            <Texto
              style={{
                fontSize: 15,
                lineHeight: 23,
                color: colores.textoSecundario,
                textAlign: "center",
              }}
            >
              Descubrí la ciudad a tu manera. Con una cuenta guardás lo que más
              te gusta.
            </Texto>
          </View>

          <View
            style={[
              estilos.tarjeta,
              SOMBRA,
              { backgroundColor: colores.superficie },
            ]}
          >
            <Beneficio
              icono="heart-outline"
              texto="Guardá tus lugares favoritos"
            />
            <Beneficio
              icono="footsteps-outline"
              texto="Registrá los lugares que visitaste"
            />
            <Beneficio
              icono="cloud-outline"
              texto="Conservá todo si cambiás de teléfono"
            />
          </View>

          <Boton
            titulo="Iniciar sesión"
            onPress={() => router.push("/login")}
          />

          <Boton
            titulo="Crear una cuenta"
            variante="secundario"
            onPress={() => router.push("/registro")}
          />

          <Boton
            titulo="Explorar el mapa sin iniciar sesión"
            variante="texto"
            onPress={() => router.push("/")}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const inicial = (nombreUsuario ?? emailUsuario).charAt(0).toUpperCase();

  return (
    <SafeAreaView
      style={[estilos.safeArea, { backgroundColor: colores.fondo }]}
      edges={[]}
    >
      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Perfil */}
        <View
          style={[
            estilos.perfil,
            SOMBRA,
            { backgroundColor: colores.superficie },
          ]}
        >
          <View style={[estilos.avatar, { backgroundColor: colores.primario }]}>
            <Texto style={[estilos.inicial, { color: colores.sobrePrimario }]}>
              {inicial}
            </Texto>
          </View>

          <Texto style={estilos.saludo}>
            {nombreUsuario ? `¡Hola, ${nombreUsuario}!` : "¡Hola de nuevo!"}
          </Texto>

          <Texto
            style={{ fontSize: 14, color: colores.textoSecundario }}
            numberOfLines={1}
          >
            {emailUsuario}
          </Texto>

          <View
            style={[estilos.estado, { backgroundColor: colores.exitoSuave }]}
          >
            <Ionicons name="checkmark-circle" size={16} color={colores.exito} />
            <Texto
              style={{ fontSize: 13, fontWeight: "700", color: colores.exito }}
            >
              Sesión activa
            </Texto>
          </View>
        </View>

        {/* Tu experiencia */}
        <Texto style={estilos.seccion}>Tu experiencia</Texto>

        <AccesoFila
          icono="heart-outline"
          titulo="Mis favoritos"
          subtitulo="Tus lugares preferidos de Colón"
          alPresionar={() => router.push("/favoritos")}
        />

        <AccesoFila
          icono="calendar-outline"
          titulo="Mis eventos"
          subtitulo="Los eventos a los que querés ir"
          alPresionar={() => router.push("/eventos-guardados")}
        />

        <AccesoFila
          icono="footsteps-outline"
          titulo="Mi recorrido"
          subtitulo="Reviví los lugares que visitaste"
          alPresionar={() => router.push("/(tabs)/recorrido")}
        />

        {/* Cuenta y seguridad */}
        <Texto style={estilos.seccion}>Cuenta y seguridad</Texto>

        <View
          style={[
            estilos.tarjetaDatos,
            SOMBRA,
            { backgroundColor: colores.superficie },
          ]}
        >
          <FilaDato
            icono="mail-outline"
            titulo="Correo electrónico"
            valor={emailUsuario}
            primera
          />
          <FilaDato
            icono="lock-closed-outline"
            titulo="Protección de sesión"
            valor="Bloqueo de sesión con opción de desbloqueo"
          />
        </View>

        <View style={estilos.cerrar}>
          <Boton
            titulo="Cerrar sesión"
            variante="peligro"
            onPress={confirmarCierreSesion}
          />
        </View>

        <Texto
          style={{
            fontSize: 12,
            color: colores.textoSecundario,
            textAlign: "center",
          }}
        >
          Mi Ciudad Colón · Descubrí, explorá y recordá
        </Texto>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea: { flex: 1 },
  contenido: { padding: 20, paddingBottom: 40, gap: 14 },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  textos: { flex: 1, gap: 2 },
  iconoTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700",
    textAlign: "center",
  },
  seccion: { fontSize: 18, fontWeight: "700", marginTop: 12 },

  // Con sesión
  perfil: {
    borderRadius: 26,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  inicial: { fontSize: 36, lineHeight: 44, fontWeight: "700" },
  saludo: { fontSize: 22, lineHeight: 30, fontWeight: "700" },
  estado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  acceso: {
    minHeight: 80,
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  tarjetaDatos: { borderRadius: 22, paddingHorizontal: 16 },
  filaDato: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
  },
  cerrar: { marginTop: 10, marginBottom: 4 },

  // Sin sesión
  bienvenida: { alignItems: "center", paddingVertical: 24, gap: 12 },
  avatarInvitado: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  tarjeta: { borderRadius: 22, padding: 18, gap: 16, marginBottom: 6 },
  beneficio: { flexDirection: "row", alignItems: "center", gap: 14 },
});
