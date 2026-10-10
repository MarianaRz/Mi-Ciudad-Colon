import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
    formState: { errors },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { email: "", contraseña: "", confirmacion: "" },
  });

  async function enviar(datos: DatosRegistro) {
    setErrorEnvio(null);

    try {
      const nueva = await registrarseApi(datos.email, datos.contraseña);
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
        <View style={styles.contenido}>
          <Text style={styles.titulo}>Crear cuenta</Text>

          <Text style={styles.subtitulo}>
            Guardá tus favoritos y tu recorrido en tu cuenta.
          </Text>

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
            style={styles.boton}
            onPress={handleSubmit(enviar)}
            role="button"
            accessibilityLabel="Crear cuenta"
          >
            <Text style={styles.textoBoton}>Crear cuenta</Text>
          </Pressable>

          <Link href="/login" replace style={styles.enlace}>
            ¿Ya tenés cuenta? Iniciá sesión
          </Link>
        </View>
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
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 20,
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
