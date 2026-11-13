import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { ingresarApi } from "../api/auth";
import { CampoFormulario } from "../components/CampoFormulario";
import Aviso from "../components/ui/Aviso";
import Boton from "../components/ui/Boton";
import Logo from "../components/ui/Logo";
import Texto from "../components/ui/Texto";
import { useSesion } from "../contextos/SesionContext";
import { useTema } from "../tema/TemaContext";
import { fuentes } from "../tema/tipografia";

const esquemaLogin = z.object({
  email: z.email("Ingresá un correo electrónico válido"),
  contraseña: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type DatosLogin = z.infer<typeof esquemaLogin>;

export default function LoginScreen() {
  const { colores } = useTema();
  const { iniciarSesion: guardarSesion } = useSesion();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: {
      email: "",
      contraseña: "",
    },
  });

  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  async function enviar(datos: DatosLogin) {
    setErrorEnvio(null);

    try {
      const nueva = await ingresarApi(datos.email, datos.contraseña);
      await guardarSesion(nueva);
      router.replace("/(tabs)/perfil");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setErrorEnvio("El correo o la contraseña son incorrectos.");
        } else if (!error.response) {
          setErrorEnvio(
            "No pudimos conectar con el servidor. Revisá tu conexión.",
          );
        } else {
          setErrorEnvio("No pudimos iniciar sesión. Intentá nuevamente.");
        }
      } else {
        setErrorEnvio("Ocurrió un error inesperado. Intentá nuevamente.");
      }
    }
  }

  return (
    <SafeAreaView
      style={[estilos.safeArea, { backgroundColor: colores.fondo }]}
    >
      <KeyboardAvoidingView
        style={estilos.contenedor}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={estilos.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <View style={estilos.encabezado}>
            <Logo tamano={72} />
            <Texto style={estilos.titulo}>Mi Ciudad</Texto>
            <Texto
              style={[estilos.subtitulo, { color: colores.textoSecundario }]}
            >
              Iniciá sesión para guardar tus favoritos y tu recorrido.
            </Texto>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <CampoFormulario
                etiqueta="Correo electrónico"
                value={value}
                onChangeText={onChange}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="contraseña"
            render={({ field: { value, onChange } }) => (
              <CampoFormulario
                etiqueta="Contraseña"
                value={value}
                onChangeText={onChange}
                placeholder="Ingresá tu contraseña"
                secureTextEntry
                autoComplete="password"
                error={errors.contraseña?.message}
              />
            )}
          />

          {errorEnvio ? <Aviso mensaje={errorEnvio} /> : null}

          <Boton
            titulo="Iniciar sesión"
            cargando={isSubmitting}
            onPress={handleSubmit(enviar)}
          />

          <Link
            href="/registro"
            replace
            style={[estilos.enlace, { color: colores.primarioFuerte }]}
          >
            ¿No tenés cuenta? Registrate
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  safeArea: { flex: 1 },
  contenedor: { flex: 1 },
  contenido: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 18,
  },
  encabezado: { alignItems: "center", gap: 10, marginBottom: 8 },
  titulo: { fontSize: 30, lineHeight: 38, fontWeight: "700" },
  subtitulo: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  enlace: {
    fontFamily: fuentes.semibold,
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 12,
  },
});
