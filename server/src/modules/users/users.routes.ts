import { Router } from 'express'
import * as usersController from './users.controller'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'

export const usersRouter = Router()

usersRouter.get('/me/addresses', requireAuth, requireRole('USUARIO'), usersController.listAddresses)
usersRouter.post('/me/addresses', requireAuth, requireRole('USUARIO'), usersController.createAddress)
usersRouter.patch('/me/addresses/:id/default', requireAuth, requireRole('USUARIO'), usersController.setDefaultAddress)
usersRouter.patch('/me/addresses/:id', requireAuth, requireRole('USUARIO'), usersController.updateAddress)
usersRouter.delete('/me/addresses/:id', requireAuth, requireRole('USUARIO'), usersController.deleteAddress)

usersRouter.get('/me/favorites', requireAuth, requireRole('USUARIO'), usersController.listFavorites)
usersRouter.patch('/me/favorites/:restaurantId/toggle', requireAuth, requireRole('USUARIO'), usersController.toggleFavorite)
