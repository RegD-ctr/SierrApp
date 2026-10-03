import { Router } from 'express'
import * as notificationsController from './notifications.controller'
import { requireAuth } from '../../middleware/auth'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)

notificationsRouter.get('/', notificationsController.listMine)
notificationsRouter.get('/unread-count', notificationsController.unreadCount)
notificationsRouter.patch('/:id/read', notificationsController.markRead)
notificationsRouter.patch('/read-all', notificationsController.markAllRead)

