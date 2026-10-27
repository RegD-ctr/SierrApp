import path from 'node:path'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { AppError } from '../../utils/errors'

// Se resuelve desde donde arranca el servidor (la carpeta server/).
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp']
// Protección contra "bombas de descompresión" (imágenes diminutas en
// disco que se expanden a gigas en memoria).
const MAX_INPUT_PIXELS = 40_000_000

export type ImageKind = 'general' | 'avatar'

export async function processAndSaveImage(buffer: Buffer, kind: ImageKind): Promise<string> {
  let pipeline = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })

  // Se valida el CONTENIDO real del archivo, no el nombre ni el tipo que
  // declara el cliente (ambos se falsifican fácil). SVG y GIF quedan
  // fuera a propósito: un SVG puede contener scripts.
  let format: string | undefined
  try {
    const meta = await pipeline.metadata()
    format = meta.format
  } catch {
    throw new AppError('El archivo no es una imagen válida.', 400)
  }
  if (!format || !ALLOWED_FORMATS.includes(format)) {
    throw new AppError('Formato no permitido. Usa JPG, PNG o WebP.', 400)
  }

  // .rotate() aplica la orientación EXIF antes de descartar los
  // metadatos. Al re-codificar a WebP se eliminan TODOS los metadatos
  // (incluida la ubicación GPS de fotos tomadas con celular).
  pipeline = pipeline.rotate()
  pipeline =
    kind === 'avatar'
      ? pipeline.resize(512, 512, { fit: 'cover' })
      : pipeline.resize({ width: 1600, withoutEnlargement: true })

  let output: Buffer
  try {
    output = await pipeline.webp({ quality: 80 }).toBuffer()
  } catch {
    throw new AppError('No se pudo procesar la imagen.', 400)
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  // El nombre lo genera el servidor; el nombre original del archivo
  // NUNCA se usa (evita path traversal y colisiones).
  const filename = `${randomUUID()}.webp`
  await fs.writeFile(path.join(UPLOAD_DIR, filename), output)

  return `/uploads/${filename}`
}
