import { Router } from 'express'
import * as ordersController from './orders.controller'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'

export const ordersRouter = Router()

ordersRouter.post('/', requireAuth, requireRole('USUARIO'), ordersController.create)
ordersRouter.get('/me', requireAuth, requireRole('USUARIO'), ordersController.listMine)
ordersRouter.get('/me/active', requireAuth, requireRole('USUARIO'), ordersController.listMineActive)
ordersRouter.patch('/:id/cancel', requireAuth, requireRole('USUARIO'), ordersController.cancel)

ordersRouter.get('/restaurant', requireAuth, requireRole('LOCAL'), ordersController.listForRestaurant)
ordersRouter.patch('/:id/accept', requireAuth, requireRole('LOCAL'), ordersController.accept)
ordersRouter.patch('/:id/reject', requireAuth, requireRole('LOCAL'), ordersController.reject)
ordersRouter.patch('/:id/ready', requireAuth, requireRole('LOCAL'), ordersController.markReady)

ordersRouter.get('/:id', requireAuth, ordersController.getById)
