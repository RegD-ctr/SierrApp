import type { Request, Response } from 'express'
import * as promotionsService from './promotions.service'

export async function listActive(_req: Request, res: Response) {
  res.json(await promotionsService.listActivePromotions())
}
