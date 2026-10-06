import type { Request, Response } from 'express'
import * as ordersService from './orders.service'
import { handleServiceError } from '../../utils/errors'
import { createOrderSchema, idParamSchema, rateOrderSchema } from './orders.validation'

function respondError(res: Response, err: unknown) {
  const { status, message } = handleServiceError(err)
  res.status(status).json({ error: message })
}

export async function create(req: Request, res: Response) {
  try {
    const input = createOrderSchema.parse(req.body)
    const order = await ordersService.createOrder(req.user!.userId, input)
    res.status(201).json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const orders = await ordersService.listMyOrders(req.user!.userId)
    res.json(orders)
  } catch (err) {
    respondError(res, err)
  }
}

export async function listMineActive(req: Request, res: Response) {
  try {
    const orders = await ordersService.listMyActiveOrders(req.user!.userId)
    res.json(orders)
  } catch (err) {
    respondError(res, err)
  }
}

export async function cancel(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.cancelOrder(id, req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.getOrderDetail(id, req.user!)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function listForRestaurant(req: Request, res: Response) {
  try {
    const orders = await ordersService.listRestaurantOrders(req.user!.userId)
    res.json(orders)
  } catch (err) {
    respondError(res, err)
  }
}

export async function accept(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.acceptOrder(id, req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function reject(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.rejectOrder(id, req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function markReady(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.markOrderReady(id, req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function rate(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const input = rateOrderSchema.parse(req.body)
    const order = await ordersService.rateOrder(id, req.user!.userId, input)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function listAvailable(req: Request, res: Response) {
  try {
    const orders = await ordersService.listAvailableOrders()
    res.json(orders)
  } catch (err) {
    respondError(res, err)
  }
}

export async function claim(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.claimOrder(id, req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function markPickedUp(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.markOrderPickedUp(id, req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function startDelivery(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.startOrderDelivery(id, req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function deliver(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const order = await ordersService.deliverOrder(id, req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function getActiveDelivery(req: Request, res: Response) {
  try {
    const order = await ordersService.getActiveDelivery(req.user!.userId)
    res.json(order)
  } catch (err) {
    respondError(res, err)
  }
}

export async function listDeliveries(req: Request, res: Response) {
  try {
    const orders = await ordersService.listDriverDeliveries(req.user!.userId)
    res.json(orders)
  } catch (err) {
    respondError(res, err)
  }
}

export async function listAllForAdmin(req: Request, res: Response) {
  try {
    const { desde, hasta, estado } = req.query as { desde?: string; hasta?: string; estado?: string }
    const orders = await ordersService.listAllOrdersForAdmin({ desde, hasta, estado })
    res.json(orders)
  } catch (err) {
    respondError(res, err)
  }
}


