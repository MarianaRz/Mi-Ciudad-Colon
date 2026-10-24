import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { CampoFormulario } from "../components/CampoFormulario";
import { useSesion } from "../contextos/SesionContext";
import { registrarseApi } from "../servicios/auth";

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
      const nueva = await registrarseApi(
        datos.email.trim().toLowerCase(),
        datos.contraseña,
        datos.nombre.trim(),
      );

      await iniciarSesion(nueva);
      router.replace("/(tabs)/perfil");
    } catch {
      setErrorEnvio("No pudimos crear la cuenta. Probá de nuevo.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titulo}>Crear cuenta</Text>

          <Text style={styles.subtitulo}>
            Guardá tus favoritos y tu recorrido en tu cuenta.
          </Text>

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

          {errorEnvio && <Text style={styles.error}>{errorEnvio}</Text>}

          <Pressable
            style={[styles.boton, isSubmitting && styles.botonDeshabilitado]}
            onPress={handleSubmit(enviar)}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
          >
            <Text style={styles.textoBoton}>
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            </Text>
          </Pressable>

          <Link href="/login" replace style={styles.enlace}>
            ¿Ya tenés cuenta? Iniciá sesión
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 18,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "700",
    color: "#17202A",
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5F6B76",
  },
  boton: {
    minHeight: 52,
    backgroundColor: "#075985",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBoton: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    color: "#B42318",
    fontSize: 14,
  },
  enlace: {
    color: "#075985",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
