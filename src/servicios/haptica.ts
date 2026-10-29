import * as Haptics from "expo-haptics";

/**
 * Confirmación táctil al completar una acción.
 * Si el dispositivo no admite háptica, la acción
 * principal debe seguir funcionando normalmente.
 */
export async function confirmarAccion(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // La háptica es complementaria.
  }
}

/**
 * Aviso táctil cuando una acción requiere atención.
 */
export async function advertirAccion(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // No bloquear la aplicación.
  }
}

/**
 * Respuesta táctil suave para interacciones.
 */
export async function tocarElemento(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Algunos dispositivos no admiten vibración.
  }
}
