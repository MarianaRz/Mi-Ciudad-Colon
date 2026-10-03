import { StyleSheet, Text, View } from "react-native";

export default function RecorridoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi recorrido</Text>

      <Text style={styles.texto}>
        Acá vas a poder consultar los lugares que visitaste durante tu
        recorrido.
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
