import type { Request, Response } from 'express'
import * as supportService from './support.service'
import { handleServiceError } from '../../utils/errors'
import { sendMessageSchema, userIdParamSchema } from './support.validation'

function respondError(res: Response, err: unknown) {
  const { status, message } = handleServiceError(err)
  res.status(status).json({ error: message })
}

export async function send(req: Request, res: Response) {
  try {
    const { mensaje, orderId } = sendMessageSchema.parse(req.body)
    res.status(201).json(await supportService.sendMessage(req.user!.userId, mensaje, orderId))
  } catch (err) {
    respondError(res, err)
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    res.json(await supportService.listMyMessages(req.user!.userId))
  } catch (err) {
    respondError(res, err)
  }
}

export async function listConversations(_req: Request, res: Response) {
  try {
    res.json(await supportService.listConversations())
  } catch (err) {
    respondError(res, err)
  }
}

export async function getConversation(req: Request, res: Response) {
  try {
    const { userId } = userIdParamSchema.parse(req.params)
    res.json(await supportService.getConversation(userId))
  } catch (err) {
    respondError(res, err)
  }
}

export async function reply(req: Request, res: Response) {
  try {
    const { userId } = userIdParamSchema.parse(req.params)
    const { mensaje } = sendMessageSchema.pick({ mensaje: true }).parse(req.body)
    res.status(201).json(await supportService.replyToUser(userId, mensaje))
  } catch (err) {
    respondError(res, err)
  }
}
