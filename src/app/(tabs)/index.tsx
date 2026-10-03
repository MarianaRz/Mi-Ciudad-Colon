import { Pressable, StyleSheet, Text, View } from "react-native";

import { Link } from "expo-router";

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explorá Colón</Text>

      <Text style={styles.description}>
        Descubrí playas, termas, museos, gastronomía y otros lugares para
        disfrutar la ciudad.
      </Text>

      <Link href="/lugares" asChild>
        <Pressable
          style={styles.button}
          role="button"
          accessibilityLabel="Explorar lugares turísticos de Colón"
        >
          <Text style={styles.buttonText}>Explorar lugares</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#17202A',
    marginBottom: 12,
  },
  description: {
    fontSize: 17,
    lineHeight: 25,
    color: '#5F6B76',
    marginBottom: 24,
  },
  button: {
    minHeight: 52,
    backgroundColor: '#075985',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
