import type { Request, Response } from 'express'
import * as adminService from './admin.service'
import { handleServiceError } from '../../utils/errors'
import { idParamSchema, updateConfigSchema } from './admin.validation'

function respondError(res: Response, err: unknown) {
  const { status, message } = handleServiceError(err)
  res.status(status).json({ error: message })
}

export async function listPendingRepartidores(_req: Request, res: Response) {
  try {
    res.json(await adminService.listPendingRepartidores())
  } catch (err) {
    respondError(res, err)
  }
}

export async function listAllRepartidores(_req: Request, res: Response) {
  try {
    res.json(await adminService.listAllRepartidores())
  } catch (err) {
    respondError(res, err)
  }
}

export async function approveRepartidor(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    res.json(await adminService.approveRepartidor(id))
  } catch (err) {
    respondError(res, err)
  }
}

export async function rejectRepartidor(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    res.json(await adminService.rejectRepartidor(id))
  } catch (err) {
    respondError(res, err)
  }
}

export async function suspendRepartidor(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    res.json(await adminService.suspendRepartidor(id))
  } catch (err) {
    respondError(res, err)
  }
}

export async function reactivateRepartidor(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    res.json(await adminService.reactivateRepartidor(id))
  } catch (err) {
    respondError(res, err)
  }
}

export async function listAllUsuarios(_req: Request, res: Response) {
  try {
    res.json(await adminService.listAllUsuarios())
  } catch (err) {
    respondError(res, err)
  }
}

export async function suspendUsuario(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    res.json(await adminService.suspendUsuario(id))
  } catch (err) {
    respondError(res, err)
  }
}

export async function reactivateUsuario(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params)
    res.json(await adminService.reactivateUsuario(id))
  } catch (err) {
    respondError(res, err)
  }
}

export async function getConfig(_req: Request, res: Response) {
  try {
    res.json(await adminService.getConfig())
  } catch (err) {
    respondError(res, err)
  }
}

export async function updateConfig(req: Request, res: Response) {
  try {
    const data = updateConfigSchema.parse(req.body)
    res.json(await adminService.updateConfig(data))
  } catch (err) {
    respondError(res, err)
  }
}

import { createZoneSchema, updateZoneSchema, idParamSchema as zoneIdParamSchema } from './zones.validation'

export async function listZones(_req: Request, res: Response) {
  try {
    res.json(await adminService.listZones())
  } catch (err) {
    respondError(res, err)
  }
}

export async function createZone(req: Request, res: Response) {
  try {
    const { nombre } = createZoneSchema.parse(req.body)
    res.status(201).json(await adminService.createZone(nombre))
  } catch (err) {
    respondError(res, err)
  }
}

export async function updateZone(req: Request, res: Response) {
  try {
    const { id } = zoneIdParamSchema.parse(req.params)
    const data = updateZoneSchema.parse(req.body)
    res.json(await adminService.updateZone(id, data))
  } catch (err) {
    respondError(res, err)
  }
}

export async function deleteZone(req: Request, res: Response) {
  try {
    const { id } = zoneIdParamSchema.parse(req.params)
    await adminService.deleteZone(id)
    res.status(204).send()
  } catch (err) {
    respondError(res, err)
  }
}

