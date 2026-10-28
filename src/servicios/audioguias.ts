import { Directory, File, Paths } from "expo-file-system";

const carpetaAudioguias = new Directory(Paths.document, "audioguias");

function obtenerExtension(url: string): "mp3" | "m4a" {
  const ruta = url.split("?")[0].toLowerCase();

  return ruta.endsWith(".m4a") ? "m4a" : "mp3";
}

function obtenerArchivo(lugarId: string, extension: string): File {
  return new File(carpetaAudioguias, `${lugarId}.${extension}`);
}

/**
 * Comprueba si existe una audioguía descargada.
 */
export function obtenerAudioguiaDescargada(lugarId: string): string | null {
  const mp3 = obtenerArchivo(lugarId, "mp3");

  if (mp3.exists) return mp3.uri;

  const m4a = obtenerArchivo(lugarId, "m4a");

  if (m4a.exists) return m4a.uri;

  return null;
}

/**
 * Descarga una audioguía y la conserva
 * en el almacenamiento privado de la aplicación.
 */
export async function descargarAudioguia(
  lugarId: string,
  url: string,
): Promise<string> {
  carpetaAudioguias.create({
    idempotent: true,
    intermediates: true,
  });

  const extension = obtenerExtension(url);
  const destino = obtenerArchivo(lugarId, extension);

  if (destino.exists) {
    return destino.uri;
  }

  try {
    const descargado = await File.downloadFileAsync(url, destino);

    return descargado.uri;
  } catch (error) {
    if (destino.exists) {
      destino.delete();
    }

    throw error;
  }
}

/**
 * Elimina una audioguía descargada.
 */
export function eliminarAudioguiaDescargada(lugarId: string): void {
  const mp3 = obtenerArchivo(lugarId, "mp3");
  const m4a = obtenerArchivo(lugarId, "m4a");

  if (mp3.exists) mp3.delete();
  if (m4a.exists) m4a.delete();
}
