import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { router } from "expo-router";
import { useSesion } from "../contextos/SesionContext";

const esquemaLogin = z.object({
  email: z.email("Ingresá un correo electrónico válido"),
  contraseña: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type DatosLogin = z.infer<typeof esquemaLogin>;

export default function LoginScreen() {
  const { iniciarSesion: guardarSesion } = useSesion();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: {
      email: "",
      contraseña: "",
    },
  });

  function iniciarSesion(datos: DatosLogin) {
    guardarSesion(datos.email);
    router.replace("/(tabs)/perfil");
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.contenido}>
          <Text style={styles.titulo}>Mi Ciudad</Text>

          <Text style={styles.subtitulo}>
            Iniciá sesión para guardar tus favoritos y tu recorrido.
          </Text>

          <View style={styles.campo}>
            <Text style={styles.label}>Correo electrónico</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="tu@email.com"
                  placeholderTextColor="#7C8792"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                  accessibilityLabel="Correo electrónico"
                />
              )}
            />

            {errors.email && (
              <Text style={styles.error}>{errors.email.message}</Text>
            )}
          </View>

          <View style={styles.campo}>
            <Text style={styles.label}>Contraseña</Text>

            <Controller
              control={control}
              name="contraseña"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ingresá tu contraseña"
                  placeholderTextColor="#7C8792"
                  secureTextEntry
                  autoComplete="password"
                  style={styles.input}
                  accessibilityLabel="Contraseña"
                />
              )}
            />

            {errors.contraseña && (
              <Text style={styles.error}>{errors.contraseña.message}</Text>
            )}
          </View>

          <Pressable
            style={styles.boton}
            onPress={handleSubmit(iniciarSesion)}
            role="button"
            accessibilityLabel="Iniciar sesión"
          >
            <Text style={styles.textoBoton}>Iniciar sesión</Text>
          </Pressable>
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
  campo: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17202A",
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#17202A",
    backgroundColor: "#FFFFFF",
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
});
