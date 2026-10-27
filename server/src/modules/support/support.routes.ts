import { Router } from 'express'
import * as supportController from './support.controller'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'

export const supportRouter = Router()

// Cualquier rol autenticado puede escribir a soporte — no se restringe
// a USUARIO, un local o repartidor también pueden necesitar ayuda.
supportRouter.post('/messages', requireAuth, supportController.send)
supportRouter.get('/messages', requireAuth, supportController.listMine)

supportRouter.get('/admin/conversations', requireAuth, requireRole('ADMIN'), supportController.listConversations)
supportRouter.get('/admin/conversations/:userId', requireAuth, requireRole('ADMIN'), supportController.getConversation)
supportRouter.post('/admin/conversations/:userId/reply', requireAuth, requireRole('ADMIN'), supportController.reply)
