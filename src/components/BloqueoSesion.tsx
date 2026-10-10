import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useSesion } from "../contextos/SesionContext";
import { biometriaDisponible } from "../servicios/biometria";

interface BloqueoSesionProps {
  email: string;
}

export function BloqueoSesion({ email }: BloqueoSesionProps) {
  const { desbloquear, cerrarSesion } = useSesion();
  const [hayBiometria, setHayBiometria] = useState<boolean | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    biometriaDisponible()
      .then((disponible) => {
        if (activo) setHayBiometria(disponible);
      })
      .catch(() => {
        if (activo) setHayBiometria(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  async function entrar() {
    setMensaje(null);
    const verificada = await desbloquear();

    if (!verificada) {
      setMensaje("No pudimos verificar tu identidad. Probá de nuevo.");
    }
  }

  async function usarContraseña() {
    await cerrarSesion();
    router.push("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola de nuevo</Text>
      <Text style={styles.email}>{email}</Text>

      {hayBiometria === null && (
        <Text style={styles.texto}>Verificando tu dispositivo...</Text>
      )}

      {hayBiometria === true && (
        <>
          <Text style={styles.texto}>
            Confirmá tu identidad para ver tu cuenta.
          </Text>

          <Pressable
            style={styles.botonPrincipal}
            onPress={entrar}
            role="button"
            accessibilityLabel="Entrar con huella o rostro"
          >
            <Text style={styles.textoBotonPrincipal}>
              Entrar con huella o rostro
            </Text>
          </Pressable>
        </>
      )}

      {hayBiometria === false && (
        <Text style={styles.texto}>
          Este dispositivo no tiene huella ni rostro configurados. Iniciá sesión
          con tu contraseña.
        </Text>
      )}

      {mensaje && <Text style={styles.error}>{mensaje}</Text>}

      {hayBiometria !== null && (
        <Pressable
          style={styles.botonSecundario}
          onPress={usarContraseña}
          role="button"
          accessibilityLabel="Usar contraseña"
        >
          <Text style={styles.textoBotonSecundario}>Usar contraseña</Text>
        </Pressable>
      )}
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
  },
  email: {
    fontSize: 18,
    fontWeight: "700",
    color: "#075985",
  },
  texto: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5F6B76",
  },
  error: {
    fontSize: 14,
    color: "#B42318",
  },
  botonPrincipal: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#075985",
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#075985",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonSecundario: {
    color: "#075985",
    fontSize: 16,
    fontWeight: "700",
  },
});
