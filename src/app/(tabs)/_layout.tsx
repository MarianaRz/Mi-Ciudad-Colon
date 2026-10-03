import { Tabs } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#075985",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerShadowVisible: false,

        tabBarActiveTintColor: "#075985",
        tabBarInactiveTintColor: "#5F6B76",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D6DEE5",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "Colón",
          tabBarLabel: "Mapa",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="agenda"
        options={{
          headerTitle: "Colón",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="recorrido"
        options={{
          headerTitle: "Colón",
          tabBarLabel: "Mi recorrido",
          tabBarIcon: ({ color }) => (
            <Ionicons name="footsteps-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          headerTitle: "Colón",
          tabBarLabel: "Yo",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
