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

// Repartidor
ordersRouter.get('/available', requireAuth, requireRole('REPARTIDOR'), ordersController.listAvailable)
ordersRouter.get('/me/active-delivery', requireAuth, requireRole('REPARTIDOR'), ordersController.getActiveDelivery)
ordersRouter.get('/me/deliveries', requireAuth, requireRole('REPARTIDOR'), ordersController.listDeliveries)
ordersRouter.patch('/:id/claim', requireAuth, requireRole('REPARTIDOR'), ordersController.claim)
ordersRouter.patch('/:id/picked-up', requireAuth, requireRole('REPARTIDOR'), ordersController.markPickedUp)
ordersRouter.patch('/:id/start-delivery', requireAuth, requireRole('REPARTIDOR'), ordersController.startDelivery)
ordersRouter.patch('/:id/deliver', requireAuth, requireRole('REPARTIDOR'), ordersController.deliver)

ordersRouter.get('/:id', requireAuth, ordersController.getById)
ordersRouter.patch('/:id/rate', requireAuth, requireRole('USUARIO'), ordersController.rate)

