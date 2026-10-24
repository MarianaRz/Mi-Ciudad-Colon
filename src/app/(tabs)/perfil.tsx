import { Link } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";
import { BloqueoSesion } from "../../components/BloqueoSesion";
import { useSesion } from "../../contextos/SesionContext";

const AZUL = "#075985";

export default function PerfilScreen() {
  const { sesion, cargando, bloqueada, cerrarSesion } = useSesion();

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
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={AZUL} />
        <Text style={styles.textoSecundario}>Cargando tu cuenta...</Text>
      </View>
    );
  }

  if (sesion && bloqueada) {
    return <BloqueoSesion email={sesion.email} />;
  }

  if (!sesion) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={styles.bienvenida}>
            <View style={styles.avatarInvitado}>
              <Text style={styles.iconoAvatar}>👤</Text>
            </View>

            <Text style={styles.tituloBienvenida}>Tu espacio en Colón</Text>

            <Text style={styles.textoBienvenida}>
              Descubrí la ciudad a tu manera. Iniciá sesión para guardar tus
              lugares favoritos y registrar tus visitas.
            </Text>
          </View>

          <View style={styles.tarjetaInvitado}>
            <Text style={styles.tituloTarjeta}>
              Tu próxima aventura empieza acá
            </Text>

            <Text style={styles.textoSecundario}>
              Con una cuenta podés conservar tus lugares preferidos y consultar
              tu recorrido cuando quieras.
            </Text>

            <Link href="/login" asChild>
              <Pressable
                style={styles.botonPrincipal}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
              >
                <Text style={styles.textoBotonPrincipal}>Iniciar sesión</Text>
              </Pressable>
            </Link>

            <Link href="/registro" asChild>
              <Pressable
                style={styles.botonSecundario}
                accessibilityRole="button"
                accessibilityLabel="Crear una cuenta"
              >
                <Text style={styles.textoBotonSecundario}>
                  Crear una cuenta
                </Text>
              </Pressable>
            </Link>
          </View>

          <Link href="/" asChild>
            <Pressable
              style={styles.enlaceExplorar}
              accessibilityRole="button"
              accessibilityLabel="Explorar lugares sin iniciar sesión"
            >
              <Text style={styles.textoExplorar}>
                Explorar lugares sin iniciar sesión →
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.encabezadoCuenta}>
          <View style={styles.avatar}>
            <Text style={styles.inicialAvatar}>
              {(sesion.nombre ?? sesion.email).charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.datosCuenta}>
            <Text style={styles.saludo}>
              {sesion.nombre ? `¡Hola, ${sesion.nombre}!` : "¡Hola de nuevo!"}
            </Text>
            <Text style={styles.email} numberOfLines={2}>
              {sesion.email}
            </Text>
            <Text style={styles.estadoCuenta}>● Sesión activa</Text>
          </View>
        </View>

        <Text style={styles.tituloSeccion}>Tu experiencia</Text>

        <Link href="/favoritos" asChild>
          <Pressable
            style={styles.tarjetaAcceso}
            accessibilityRole="button"
            accessibilityLabel="Abrir mis favoritos"
          >
            <View style={styles.iconoAccesoRosa}>
              <Ionicons name="heart-outline" size={26} color="#E11D48" />
            </View>

            <View style={styles.textosAcceso}>
              <Text style={styles.tituloAcceso}>Mis favoritos</Text>
              <Text style={styles.subtituloAcceso}>
                Tus lugares preferidos de Colón
              </Text>
            </View>

            <Text style={styles.flecha}>›</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/recorrido" asChild>
          <Pressable
            style={styles.tarjetaAcceso}
            accessibilityRole="button"
            accessibilityLabel="Abrir mi recorrido"
          >
            <View style={styles.iconoAccesoAzul}>
              <Text style={styles.iconoAcceso}>⌖</Text>
            </View>

            <View style={styles.textosAcceso}>
              <Text style={styles.tituloAcceso}>Mi recorrido</Text>
              <Text style={styles.subtituloAcceso}>
                Reviví los lugares que visitaste
              </Text>
            </View>

            <Text style={styles.flecha}>›</Text>
          </Pressable>
        </Link>

        <Text style={styles.tituloSeccion}>Cuenta y seguridad</Text>

        <View style={styles.tarjetaInformacion}>
          <View style={styles.filaInformacion}>
            <Text style={styles.iconoInformacion}>✉</Text>

            <View style={styles.textosAcceso}>
              <Text style={styles.tituloInformacion}>Correo electrónico</Text>
              <Text style={styles.subtituloAcceso}>{sesion.email}</Text>
            </View>
          </View>

          <View style={styles.separador} />

          <View style={styles.filaInformacion}>
            <Text style={styles.iconoInformacion}>🔒</Text>

            <View style={styles.textosAcceso}>
              <Text style={styles.tituloInformacion}>Protección de sesión</Text>
              <Text style={styles.subtituloAcceso}>
                Bloqueo de sesión con opción de desbloqueo
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.botonCerrar}
          onPress={confirmarCierreSesion}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text style={styles.textoBotonCerrar}>Cerrar sesión</Text>
        </Pressable>

        <Text style={styles.pie}>
          Mi Ciudad Colón · Descubrí, explorá y recordá
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "#F8FAFC",
  },
  textoSecundario: {
    fontSize: 15,
    lineHeight: 23,
    color: "#64748B",
  },
  encabezadoCuenta: {
    backgroundColor: AZUL,
    borderRadius: 20,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  inicialAvatar: {
    fontSize: 28,
    fontWeight: "700",
    color: AZUL,
  },
  datosCuenta: {
    flex: 1,
    gap: 5,
  },
  saludo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  email: {
    fontSize: 14,
    color: "#E0F2FE",
  },
  estadoCuenta: {
    fontSize: 13,
    color: "#BBF7D0",
    fontWeight: "600",
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 12,
    marginBottom: 4,
  },
  tarjetaAcceso: {
    minHeight: 86,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconoAccesoRosa: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  iconoAccesoAzul: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  iconoAcceso: {
    fontSize: 27,
    color: AZUL,
  },
  textosAcceso: {
    flex: 1,
    gap: 4,
  },
  tituloAcceso: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17202A",
  },
  subtituloAcceso: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },
  flecha: {
    fontSize: 30,
    color: "#94A3B8",
  },
  tarjetaInformacion: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filaInformacion: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
  },
  iconoInformacion: {
    fontSize: 22,
    color: AZUL,
    width: 30,
    textAlign: "center",
  },
  tituloInformacion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#17202A",
  },
  separador: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  botonCerrar: {
    minHeight: 52,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonCerrar: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B42318",
  },
  pie: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 16,
  },
  bienvenida: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 14,
  },
  avatarInvitado: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  iconoAvatar: {
    fontSize: 43,
  },
  tituloBienvenida: {
    fontSize: 26,
    fontWeight: "700",
    color: "#17202A",
    textAlign: "center",
  },
  textoBienvenida: {
    fontSize: 15,
    lineHeight: 24,
    color: "#64748B",
    textAlign: "center",
  },
  tarjetaInvitado: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tituloTarjeta: {
    fontSize: 19,
    fontWeight: "700",
    color: "#17202A",
  },
  botonPrincipal: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: AZUL,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonPrincipal: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  botonSecundario: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AZUL,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonSecundario: {
    color: AZUL,
    fontSize: 16,
    fontWeight: "700",
  },
  enlaceExplorar: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  textoExplorar: {
    color: AZUL,
    fontSize: 15,
    fontWeight: "700",
  },
});
