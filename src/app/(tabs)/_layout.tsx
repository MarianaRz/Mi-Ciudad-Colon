import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TituloConLogo from "../../components/ui/TituloConLogo";
import { useSesion } from "../../contextos/SesionContext";
import { ALTURA_BARRA } from "../../tema/medidas";
import { useTema } from "../../tema/TemaContext";
import { fuentes } from "../../tema/tipografia";

export default function TabsLayout() {
  const { colores } = useTema();
  const { sesion } = useSesion();
  const insets = useSafeAreaInsets();

  const primerNombre = sesion?.nombre?.trim().split(" ")[0];
  const saludo = `Hola, ${primerNombre || "visitante"}`;
  const alturaTotal = ALTURA_BARRA + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.texto,
        headerShadowVisible: false,
        headerTitleAlign: "left",

        tabBarActiveTintColor: colores.primarioFuerte,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarLabelStyle: { fontFamily: fuentes.media, fontSize: 11 },
        tabBarItemStyle: { paddingVertical: 8 },

        // Barra normal (no flotante): no se superpone con el contenido
        // de las pantallas, así no interfiere con el mapa ni con el index.
        tabBarStyle: {
          height: alturaTotal,
          paddingTop: 0,
          paddingBottom: insets.bottom,
          backgroundColor: colores.superficie,
          borderTopWidth: 1,
          borderTopColor: colores.borde,
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => (
            <TituloConLogo titulo={saludo} subtitulo="Bienvenido a Colón" />
          ),
          tabBarLabel: "Mapa",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="agenda"
        options={{
          headerTitle: () => <TituloConLogo titulo="Agenda" />,
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="recorrido"
        options={{
          headerTitle: () => <TituloConLogo titulo="Mi recorrido" />,
          tabBarLabel: "Mi recorrido",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "footsteps" : "footsteps-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          headerTitle: () => <TituloConLogo titulo="Yo" />,
          tabBarLabel: "Yo",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
