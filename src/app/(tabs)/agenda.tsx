import { StyleSheet, Text, View } from "react-native";

export default function AgendaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda</Text>

      <Text style={styles.texto}>
        Próximamente vas a poder consultar actividades y eventos de Colón.
      </Text>
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
    fontSize: 24,
    fontWeight: "700",
    color: "#17202A",
  },

  texto: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5F6B76",
  },
});
