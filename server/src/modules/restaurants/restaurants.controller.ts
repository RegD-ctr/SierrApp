// Destino: server/src/modules/restaurants/restaurants.controller.ts

import type { Request, Response } from 'express'
import * as restaurantsService from './restaurants.service'
import { handleServiceError } from '../../utils/errors'
import {
  updateRestaurantSchema,
  toggleOpenSchema,
  createDishSchema,
  updateDishSchema,
  listRestaurantsQuerySchema,
  idParamSchema,
} from './restaurants.validation'

function respondError(res: Response, err: unknown) {
  const { status, message } = handleServiceError(err)
  res.status(status).json({ error: message })
}

// --- Público ---

export async function list(req: Request, res: Response) {
  try {
    const query = listRestaurantsQuerySchema.parse(req.query)
    const restaurants = await restaurantsService.listActiveRestaurants(query)
    res.json(restaurants)
  } catch (err) {
    respondError(res, err)
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const restaurant = await restaurantsService.getRestaurantDetail(id)
    res.json(restaurant)
  } catch (err) {
    respondError(res, err)
  }
}

// --- Rol LOCAL (requiere requireAuth + requireRole('LOCAL')) ---

export async function getMine(req: Request, res: Response) {
  try {
    const restaurant = await restaurantsService.getMyRestaurant(req.user!.userId)
    res.json(restaurant)
  } catch (err) {
    respondError(res, err)
  }
}

export async function updateMine(req: Request, res: Response) {
  try {
    const data = updateRestaurantSchema.parse(req.body)
    const restaurant = await restaurantsService.updateMyRestaurant(req.user!.userId, data)
    res.json(restaurant)
  } catch (err) {
    respondError(res, err)
  }
}

export async function toggleOpen(req: Request, res: Response) {
  try {
    const { isOpen } = toggleOpenSchema.parse(req.body)
    const restaurant = await restaurantsService.toggleMyRestaurantOpen(req.user!.userId, isOpen)
    res.json(restaurant)
  } catch (err) {
    respondError(res, err)
  }
}

export async function createDish(req: Request, res: Response) {
  try {
    const data = createDishSchema.parse(req.body)
    const dish = await restaurantsService.createDish(req.user!.userId, data)
    res.status(201).json(dish)
  } catch (err) {
    respondError(res, err)
  }
}

export async function updateDish(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const data = updateDishSchema.parse(req.body)
    const dish = await restaurantsService.updateDish(req.user!.userId, id, data)
    res.json(dish)
  } catch (err) {
    respondError(res, err)
  }
}

export async function deleteDish(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    await restaurantsService.deleteDish(req.user!.userId, id)
    res.status(204).send()
  } catch (err) {
    respondError(res, err)
  }
}

// --- Rol ADMIN (requiere requireAuth + requireRole('ADMIN')) ---

export async function listPending(_req: Request, res: Response) {
  try {
    const restaurants = await restaurantsService.listPendingRestaurants()
    res.json(restaurants)
  } catch (err) {
    respondError(res, err)
  }
}

export async function listAllForAdmin(_req: Request, res: Response) {
  try {
    const restaurants = await restaurantsService.listAllRestaurantsForAdmin()
    res.json(restaurants)
  } catch (err) {
    respondError(res, err)
  }
}

export async function approve(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const restaurant = await restaurantsService.approveRestaurant(id)
    res.json(restaurant)
  } catch (err) {
    respondError(res, err)
  }
}

export async function suspend(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const restaurant = await restaurantsService.suspendRestaurant(id)
    res.json(restaurant)
  } catch (err) {
    respondError(res, err)
  }
}

export async function reactivate(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const restaurant = await restaurantsService.reactivateRestaurant(id)
    res.json(restaurant)
  } catch (err) {
    respondError(res, err)
  }
}
