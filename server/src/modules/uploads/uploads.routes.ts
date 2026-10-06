import { Router } from "express"
import rateLimit from "express-rate-limit"
import * as uploadsController from "./uploads.controller"
import { requireAuth } from "../../middleware/auth"
import { requireRole } from "../../middleware/requireRole"

export const uploadsRouter = Router()

const authenticatedUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas subidas. Inténtalo más tarde." },
})

// Estricto a propósito: este endpoint es público (el repartidor sube su
// foto al REGISTRARSE, cuando todavía no puede iniciar sesión).
const publicUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas subidas desde esta red. Inténtalo más tarde." },
})

// Fotos de platillos y portadas de restaurante (solo rol LOCAL)
uploadsRouter.post(
  "/image",
  requireAuth,
  requireRole("LOCAL"),
  authenticatedUploadLimiter,
  uploadsController.uploadImage,
)

// Foto del repartidor durante el registro (sin login)
uploadsRouter.post(
  "/driver-photo",
  publicUploadLimiter,
  uploadsController.uploadDriverPhoto,
)

// Foto del repartidor autenticado al editar su perfil
uploadsRouter.post(
  "/driver-photo/me",
  requireAuth,
  requireRole("REPARTIDOR"),
  authenticatedUploadLimiter,
  uploadsController.uploadDriverPhoto,
)
