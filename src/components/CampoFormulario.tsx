import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface CampoFormularioProps extends TextInputProps {
  etiqueta: string;
  error?: string;
}

export function CampoFormulario({
  etiqueta,
  error,
  style,
  ...resto
}: CampoFormularioProps) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>

      <TextInput
        placeholderTextColor="#7C8792"
        accessibilityLabel={etiqueta}
        style={[styles.input, style]}
        {...resto}
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: 8,
  },
  etiqueta: {
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
  error: {
    color: "#B42318",
    fontSize: 14,
  },
});
