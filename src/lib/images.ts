/**
 * Préparation d'une image avant son envoi : elle est réduite dans le navigateur
 * (1 600 px au plus sur son grand côté) et convertie en JPEG. Une photo de
 * téléphone de plusieurs mégaoctets devient ainsi une image de quelques
 * centaines de kilo-octets, rapide à envoyer et à afficher.
 */
const MAX_SIDE = 1600
/** Taille maximale acceptée par le serveur, avec une marge. */
const MAX_BYTES = 1_400_000
const QUALITIES = [0.85, 0.7, 0.55]

export class ImageError extends Error {
  override name = 'ImageError'
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const address = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(address)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(address)
      reject(new ImageError('Ce fichier n’est pas une image lisible.'))
    }
    image.src = address
  })
}

/** Poids d'une image encodée en adresse « data: ». */
const byteLength = (dataUrl: string) => Math.ceil(((dataUrl.split(',')[1] ?? '').length * 3) / 4)

/** Réduit l'image choisie et la renvoie sous forme d'adresse « data: » en JPEG. */
export async function prepareImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('Choisissez un fichier image.')
  }
  const image = await load(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new ImageError('Cette image n’a pas pu être préparée.')
  // Fond blanc : une image transparente ne devient pas noire en JPEG.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  for (const quality of QUALITIES) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (byteLength(dataUrl) <= MAX_BYTES) return dataUrl
  }
  throw new ImageError('Cette image est trop lourde, même une fois réduite.')
}
