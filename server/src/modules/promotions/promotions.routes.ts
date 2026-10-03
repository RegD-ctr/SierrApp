import { Router } from 'express'
import * as promotionsController from './promotions.controller'

export const promotionsRouter = Router()

promotionsRouter.get('/', promotionsController.listActive)
