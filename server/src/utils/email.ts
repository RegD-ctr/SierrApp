// STUB intencional: no envía correos reales todavía (requiere cuenta con
// un proveedor como Resend/SendGrid). En desarrollo imprime el link en
// consola para poder probar el flujo completo sin proveedor configurado.

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${process.env.CORS_ORIGIN}/verificar-correo?token=${token}`
  console.log(`\n[EMAIL - verificación] Para: ${to}\nLink: ${link}\n`)
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${process.env.CORS_ORIGIN}/restablecer-contrasena?token=${token}`
  console.log(`\n[EMAIL - reset password] Para: ${to}\nLink: ${link}\n`)
}

export async function sendAccountLockedAlert(to: string): Promise<void> {
  console.log(`\n[EMAIL - alerta de bloqueo] Para: ${to}\nTu cuenta fue bloqueada temporalmente por demasiados intentos fallidos de inicio de sesión.\n`)
}
