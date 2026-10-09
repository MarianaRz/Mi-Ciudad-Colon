import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSesion } from "../../contextos/SesionContext";

export default function PerfilScreen() {
  const { sesion, cargando, cerrarSesion } = useSesion();

  // 1. Si está cargando la sesión
  if (cargando) {
    return (
      <View style={styles.container}>
        <Text style={styles.texto}>Cargando tu cuenta...</Text>
      </View>
    );
  }

  // 2. Si HAY una sesión activa
  if (sesion) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Tu cuenta</Text>

        <Text style={styles.texto}>Sesión iniciada como:</Text>

        <Text style={styles.email}>{sesion.email}</Text>

        <Pressable
          style={styles.botonCerrar}
          onPress={cerrarSesion}
          role="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text style={styles.textoBotonCerrar}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  // 3. Si NO hay sesión activa (invitado)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu cuenta</Text>

      <Text style={styles.texto}>
        Iniciá sesión para guardar tus favoritos y tu recorrido.
      </Text>

      <Link href="/login" asChild>
        <Pressable
          style={styles.botonIniciar}
          role="button"
          accessibilityLabel="Iniciar sesión"
        >
          <Text style={styles.textoBotonIniciar}>Iniciar sesión</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#17202A",
    marginBottom: 4,
  },
  texto: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5F6B76",
  },
  email: {
    fontSize: 18,
    fontWeight: "700",
    color: "#075985",
  },
  botonCerrar: {
    minHeight: 52,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#B42318",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  textoBotonCerrar: {
    color: "#B42318",
    fontSize: 16,
    fontWeight: "700",
  },
  botonIniciar: {
    minHeight: 52,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#075985",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonIniciar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
