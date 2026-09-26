import { Router } from 'express'
import * as authController from './auth.controller'
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../../middleware/rateLimiter'

export const authRouter = Router()

authRouter.post('/register/usuario', registerLimiter, authController.registerUsuario)
authRouter.post('/register/local', registerLimiter, authController.registerLocal)
authRouter.post('/register/repartidor', registerLimiter, authController.registerRepartidor)

authRouter.post('/login', loginLimiter, authController.login)
authRouter.post('/refresh', authController.refresh)
authRouter.post('/logout', authController.logout)

authRouter.post('/verify-email', authController.verifyEmail)
authRouter.post('/forgot-password', passwordResetLimiter, authController.forgotPassword)
authRouter.post('/reset-password', passwordResetLimiter, authController.resetPassword)
