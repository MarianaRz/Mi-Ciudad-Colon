import { Stack } from "expo-router";

import { SesionProvider } from "../contextos/SesionContext";

export default function RootLayout() {
  return (
    <SesionProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen
          name="lugares"
          options={{
            title: "Lugares",
            headerStyle: {
              backgroundColor: "#075985",
            },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: {
              fontWeight: "700",
            },
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="login"
          options={{
            title: "Iniciar sesión",
            headerShown: false,
          }}
        />
      </Stack>
    </SesionProvider>
  );
}
