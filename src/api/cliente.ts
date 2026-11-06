import axios from "axios";
import * as SecureStore from "expo-secure-store";

const CLAVE_TOKEN = "sesion.token";

export const clienteApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

clienteApi.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(CLAVE_TOKEN);

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});
