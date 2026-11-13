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

import { registrarUsuarioApi } from "../api/auth";
import { CampoFormulario } from "../components/CampoFormulario";
import Aviso from "../components/ui/Aviso";
import Boton from "../components/ui/Boton";
import Logo from "../components/ui/Logo";
import Texto from "../components/ui/Texto";
import { useSesion } from "../contextos/SesionContext";
import { useTema } from "../tema/TemaContext";
import { fuentes } from "../tema/tipografia";

const esquemaRegistro = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "Ingresá tu nombre (mínimo 2 caracteres)")
      .max(80, "El nombre no puede superar los 80 caracteres"),
    email: z.email("Ingresá un correo electrónico válido"),
    contraseña: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmacion: z.string(),
  })
  .refine((datos) => datos.contraseña === datos.confirmacion, {
    message: "Las contraseñas no coinciden",
    path: ["confirmacion"],
  });

type DatosRegistro = z.infer<typeof esquemaRegistro>;

export default function RegistroScreen() {
  const { colores } = useTema();
  const { iniciarSesion } = useSesion();
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: {
      nombre: "",
      email: "",
      contraseña: "",
      confirmacion: "",
    },
  });

  async function enviar(datos: DatosRegistro) {
    setErrorEnvio(null);

    try {
      const nueva = await registrarUsuarioApi(
        datos.email.trim().toLowerCase(),
        datos.contraseña,
        datos.nombre.trim(),
      );

      await iniciarSesion(nueva);
      router.replace("/(tabs)/perfil");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          setErrorEnvio("Ya existe una cuenta con ese correo electrónico.");
        } else if (error.response?.status === 400) {
          setErrorEnvio("Revisá los datos ingresados e intentá nuevamente.");
        } else if (!error.response) {
          setErrorEnvio(
            "No pudimos conectar con el servidor. Revisá tu conexión.",
          );
        } else {
          setErrorEnvio("No pudimos crear la cuenta. Intentá nuevamente.");
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
            <Logo tamano={64} />
            <Texto style={estilos.titulo}>Crear cuenta</Texto>
            <Texto
              style={[estilos.subtitulo, { color: colores.textoSecundario }]}
            >
              Guardá tus favoritos y tu recorrido en tu cuenta.
            </Texto>
          </View>

          <Controller
            control={control}
            name="nombre"
            render={({ field: { value, onChange } }) => (
              <CampoFormulario
                etiqueta="Nombre"
                value={value}
                onChangeText={onChange}
                placeholder="Tu nombre"
                autoCapitalize="words"
                autoComplete="name"
                error={errors.nombre?.message}
              />
            )}
          />

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
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                autoComplete="new-password"
                error={errors.contraseña?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmacion"
            render={({ field: { value, onChange } }) => (
              <CampoFormulario
                etiqueta="Repetí la contraseña"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                autoComplete="new-password"
                error={errors.confirmacion?.message}
              />
            )}
          />

          {errorEnvio ? <Aviso mensaje={errorEnvio} /> : null}

          <Boton
            titulo="Crear cuenta"
            cargando={isSubmitting}
            onPress={handleSubmit(enviar)}
          />

          <Link
            href="/login"
            replace
            style={[estilos.enlace, { color: colores.primarioFuerte }]}
          >
            ¿Ya tenés cuenta? Iniciá sesión
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
    gap: 16,
  },
  encabezado: { alignItems: "center", gap: 10, marginBottom: 4 },
  titulo: { fontSize: 28, lineHeight: 36, fontWeight: "700" },
  subtitulo: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  enlace: {
    fontFamily: fuentes.semibold,
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 12,
  },
});
