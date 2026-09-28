import type { Request, Response } from 'express'
import * as usersService from './users.service'
import { handleServiceError } from '../../utils/errors'
import { createAddressSchema, updateAddressSchema, idParamSchema } from './users.validation'

function respondError(res: Response, err: unknown) {
  const { status, message } = handleServiceError(err)
  res.status(status).json({ error: message })
}

export async function listAddresses(req: Request, res: Response) {
  try {
    const addresses = await usersService.listAddresses(req.user!.userId)
    res.json(addresses)
  } catch (err) {
    respondError(res, err)
  }
}

export async function createAddress(req: Request, res: Response) {
  try {
    const data = createAddressSchema.parse(req.body)
    const address = await usersService.createAddress(req.user!.userId, data)
    res.status(201).json(address)
  } catch (err) {
    respondError(res, err)
  }
}

export async function updateAddress(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const data = updateAddressSchema.parse(req.body)
    const address = await usersService.updateAddress(req.user!.userId, id, data)
    res.json(address)
  } catch (err) {
    respondError(res, err)
  }
}

export async function setDefaultAddress(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    const address = await usersService.setDefaultAddress(req.user!.userId, id)
    res.json(address)
  } catch (err) {
    respondError(res, err)
  }
}

export async function deleteAddress(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    await usersService.deleteAddress(req.user!.userId, id)
    res.status(204).send()
  } catch (err) {
    respondError(res, err)
  }
}
