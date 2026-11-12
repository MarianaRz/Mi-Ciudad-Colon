import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useSesion } from "../contextos/SesionContext";
import { biometriaDisponible } from "../servicios/biometria";
import { useTema } from "../tema/TemaContext";
import Aviso from "./ui/Aviso";
import Boton from "./ui/Boton";
import Texto from "./ui/Texto";

interface BloqueoSesionProps {
  email: string;
}

export function BloqueoSesion({ email }: BloqueoSesionProps) {
  const { colores } = useTema();
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
    <View style={[estilos.contenedor, { backgroundColor: colores.fondo }]}>
      <View style={estilos.encabezado}>
        <View
          style={[estilos.icono, { backgroundColor: colores.primarioSuave }]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={44}
            color={colores.primarioFuerte}
          />
        </View>

        <Texto style={estilos.titulo}>Hola de nuevo</Texto>

        <View
          style={[
            estilos.chipEmail,
            { backgroundColor: colores.primarioSuave },
          ]}
        >
          <Texto
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colores.primarioFuerte,
            }}
            numberOfLines={1}
          >
            {email}
          </Texto>
        </View>
      </View>

      {hayBiometria === null && (
        <View style={estilos.verificando}>
          <ActivityIndicator color={colores.primarioFuerte} />
          <Texto style={{ fontSize: 15, color: colores.textoSecundario }}>
            Verificando tu dispositivo...
          </Texto>
        </View>
      )}

      {hayBiometria === true && (
        <>
          <Texto
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: colores.textoSecundario,
              textAlign: "center",
            }}
          >
            Confirmá tu identidad para ver tu cuenta.
          </Texto>

          <Boton
            titulo="Entrar con huella o rostro"
            onPress={() => void entrar()}
          />
        </>
      )}

      {hayBiometria === false && (
        <Aviso
          tipo="info"
          mensaje="Este dispositivo no tiene huella ni rostro configurados. Iniciá sesión con tu contraseña."
        />
      )}

      {mensaje ? <Aviso mensaje={mensaje} /> : null}

      {hayBiometria !== null && (
        <Boton
          titulo="Usar contraseña"
          variante="secundario"
          onPress={() => void usarContraseña()}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: "center",
  },
  encabezado: { alignItems: "center", gap: 12, marginBottom: 8 },
  icono: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 28, lineHeight: 36, fontWeight: "700" },
  chipEmail: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  verificando: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
