import { Directory, File, Paths } from "expo-file-system";

const carpetaFotos = new Directory(Paths.document, "fotos-visitas");

/**
 * Copia una fotografía temporal al almacenamiento
 * persistente de la aplicación.
 *
 * No modifica ni elimina la fotografía original.
 */
export async function guardarFotoVisita(uriTemporal: string): Promise<string> {
  carpetaFotos.create({
    idempotent: true,
    intermediates: true,
  });

  const archivoOrigen = new File(uriTemporal);

  // Conservar la extensión cuando sea reconocida.
  const extensionEncontrada = uriTemporal
    .split("?")[0]
    .match(/\.(jpg|jpeg|png|webp|heic|heif)$/i);

  const extension = extensionEncontrada
    ? extensionEncontrada[1].toLowerCase()
    : "jpg";

  const nombre = `visita-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}.${extension}`;

  const archivoDestino = new File(carpetaFotos, nombre);

  archivoOrigen.copy(archivoDestino);

  return archivoDestino.uri;
}

/**
 * Elimina únicamente una fotografía que pertenece
 * a la carpeta privada de visitas.
 *
 * Se utiliza cuando falla el registro en SQLite.
 */
export async function eliminarFotoVisita(fotoUri: string): Promise<void> {
  const prefijoCarpeta = carpetaFotos.uri.endsWith("/")
    ? carpetaFotos.uri
    : `${carpetaFotos.uri}/`;

  // Nunca eliminar archivos externos a nuestra carpeta.
  if (!fotoUri.startsWith(prefijoCarpeta)) {
    throw new Error("La fotografía no pertenece a la carpeta de visitas.");
  }

  const archivo = new File(fotoUri);

  if (archivo.exists) {
    archivo.delete();
  }
}
