import type { Request, Response } from 'express'
import multer from 'multer'
import * as uploadsService from './uploads.service'
import { AppError, handleServiceError } from '../../utils/errors'

function buildUploader(maxBytes: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
  }).single('file')
}

const generalUploader = buildUploader(5 * 1024 * 1024)
const avatarUploader = buildUploader(2 * 1024 * 1024)

// Convierte los errores de multer (archivo muy grande, campo inesperado)
// en errores controlados; si no, caerían como 500 genérico.
function runUploader(uploader: ReturnType<typeof buildUploader>, req: Request, res: Response) {
  return new Promise<void>((resolve, reject) => {
    uploader(req, res, (err: unknown) => {
      if (!err) return resolve()
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return reject(new AppError('La imagen es demasiado pesada.', 413))
        }
        return reject(new AppError('Archivo inválido.', 400))
      }
      reject(err)
    })
  })
}

async function handleUpload(
  uploader: ReturnType<typeof buildUploader>,
  kind: uploadsService.ImageKind,
  req: Request,
  res: Response
) {
  try {
    await runUploader(uploader, req, res)
    if (!req.file) {
      throw new AppError('Debes enviar una imagen en el campo "file".', 400)
    }
    const imagePath = await uploadsService.processAndSaveImage(req.file.buffer, kind)
    res.status(201).json({ path: imagePath })
  } catch (err) {
    const { status, message } = handleServiceError(err)
    res.status(status).json({ error: message })
  }
}

export function uploadImage(req: Request, res: Response) {
  return handleUpload(generalUploader, 'general', req, res)
}

export function uploadDriverPhoto(req: Request, res: Response) {
  return handleUpload(avatarUploader, 'avatar', req, res)
}
