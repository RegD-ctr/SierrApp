import { Router } from 'express'
import * as adminController from './admin.controller'
import { requireAuth } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'

export const adminRouter = Router()

// Todo este router es exclusivo de ADMIN — se aplica una sola vez a
// nivel de router en vez de repetirlo en cada línea.
adminRouter.use(requireAuth, requireRole('ADMIN'))

adminRouter.get('/repartidores/pending', adminController.listPendingRepartidores)
adminRouter.get('/repartidores', adminController.listAllRepartidores)
adminRouter.patch('/repartidores/:id/approve', adminController.approveRepartidor)
adminRouter.patch('/repartidores/:id/reject', adminController.rejectRepartidor)
adminRouter.patch('/repartidores/:id/suspend', adminController.suspendRepartidor)
adminRouter.patch('/repartidores/:id/reactivate', adminController.reactivateRepartidor)

adminRouter.get('/usuarios', adminController.listAllUsuarios)
adminRouter.patch('/usuarios/:id/suspend', adminController.suspendUsuario)
adminRouter.patch('/usuarios/:id/reactivate', adminController.reactivateUsuario)

adminRouter.get('/config', adminController.getConfig)
adminRouter.patch('/config', adminController.updateConfig)

adminRouter.get('/zonas', adminController.listZones)
adminRouter.post('/zonas', adminController.createZone)
adminRouter.patch('/zonas/:id', adminController.updateZone)
adminRouter.delete('/zonas/:id', adminController.deleteZone)

