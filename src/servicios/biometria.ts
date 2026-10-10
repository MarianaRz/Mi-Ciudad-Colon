import * as LocalAuthentication from "expo-local-authentication";

export async function biometriaDisponible(): Promise<boolean> {
  const [hayHardware, estaConfigurada] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  return hayHardware && estaConfigurada;
}

export async function autenticarConBiometria(): Promise<boolean> {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirmá tu identidad para entrar",
    cancelLabel: "Cancelar",
  });

  return resultado.success;
}
