// Destino: server/src/modules/restaurants/restaurants.routes.ts

import { Router } from 'express'
import * as restaurantsController from './restaurants.controller'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'

export const restaurantsRouter = Router()

// ORDEN IMPORTA: Express evalúa las rutas en el orden en que se
// declaran. Todas las rutas con segmentos fijos (/me/..., /admin/...)
// deben ir ANTES de '/:id' — si no, una petición a GET /me/restaurant
// haría que Express interprete "me" como si fuera el :id de
// GET /:id, y nunca llegaría a la ruta correcta.

// --- Público (sin login) ---
restaurantsRouter.get('/', restaurantsController.list)

// --- Rol LOCAL ---
restaurantsRouter.get('/me/restaurant', requireAuth, requireRole('LOCAL'), restaurantsController.getMine)
restaurantsRouter.patch('/me/restaurant', requireAuth, requireRole('LOCAL'), restaurantsController.updateMine)
restaurantsRouter.patch('/me/restaurant/estado', requireAuth, requireRole('LOCAL'), restaurantsController.toggleOpen)

restaurantsRouter.post('/me/dishes', requireAuth, requireRole('LOCAL'), restaurantsController.createDish)
restaurantsRouter.patch('/me/dishes/:id', requireAuth, requireRole('LOCAL'), restaurantsController.updateDish)
restaurantsRouter.delete('/me/dishes/:id', requireAuth, requireRole('LOCAL'), restaurantsController.deleteDish)

// --- Rol ADMIN ---
restaurantsRouter.get('/admin/pending', requireAuth, requireRole('ADMIN'), restaurantsController.listPending)
restaurantsRouter.get('/admin/all', requireAuth, requireRole('ADMIN'), restaurantsController.listAllForAdmin)
restaurantsRouter.patch('/admin/:id/approve', requireAuth, requireRole('ADMIN'), restaurantsController.approve)
restaurantsRouter.patch('/admin/:id/suspend', requireAuth, requireRole('ADMIN'), restaurantsController.suspend)
restaurantsRouter.patch('/admin/:id/reactivate', requireAuth, requireRole('ADMIN'), restaurantsController.reactivate)

// --- Público (sin login) — AL FINAL a propósito, ver nota de arriba ---
restaurantsRouter.get('/:id', restaurantsController.getById)
