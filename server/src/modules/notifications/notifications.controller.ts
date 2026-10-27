import type { Request, Response } from 'express'
import * as notificationsService from './notifications.service'
import { handleServiceError } from '../../utils/errors'
import { idParamSchema } from './notifications.validation'

function respondError(res: Response, err: unknown) {
  const { status, message } = handleServiceError(err)
  res.status(status).json({ error: message })
}

export async function listMine(req: Request, res: Response) {
  try {
    res.json(await notificationsService.listMyNotifications(req.user!.userId))
  } catch (err) {
    respondError(res, err)
  }
}

export async function unreadCount(req: Request, res: Response) {
  try {
    const count = await notificationsService.getUnreadCount(req.user!.userId)
    res.json({ count })
  } catch (err) {
    respondError(res, err)
  }
}

export async function markRead(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    res.json(await notificationsService.markAsRead(req.user!.userId, id))
  } catch (err) {
    respondError(res, err)
  }
}

export async function markAllRead(req: Request, res: Response) {
  try {
    await notificationsService.markAllAsRead(req.user!.userId)
    res.status(204).send()
  } catch (err) {
    respondError(res, err)
  }
}

