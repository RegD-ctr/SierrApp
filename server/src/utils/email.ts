// Destino: server/src/utils/email.ts
//
// Esto es un STUB intencional: define la interfaz que va a usar el
// resto del código, pero no envía correos reales todavía porque eso
// requiere una cuenta con un proveedor (Resend, SendGrid, Amazon SES,
// etc.) que tú debes crear y configurar con tus propias credenciales.
//
// Por ahora, en desarrollo, esto solo imprime el link en la consola del
// servidor — así puedes copiar el link y probar el flujo completo sin
// tener un proveedor de correo configurado todavía.
//
// Cuando tengas cuenta con un proveedor, instala su SDK (ej. `pnpm add
// resend`) y reemplaza el cuerpo de cada función por la llamada real a
// su API. La forma de las funciones (los parámetros que reciben) no
// tiene que cambiar, así que el resto del backend no se ve afectado.

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${process.env.CORS_ORIGIN}/verificar-correo?token=${token}`
  console.log(`\n[EMAIL - verificación] Para: ${to}\nLink: ${link}\n`)
  // TODO: reemplazar con el envío real cuando tengas un proveedor configurado
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${process.env.CORS_ORIGIN}/restablecer-contrasena?token=${token}`
  console.log(`\n[EMAIL - reset password] Para: ${to}\nLink: ${link}\n`)
  // TODO: reemplazar con el envío real cuando tengas un proveedor configurado
}

export async function sendAccountLockedAlert(to: string): Promise<void> {
  console.log(`\n[EMAIL - alerta de bloqueo] Para: ${to}\nTu cuenta fue bloqueada temporalmente por demasiados intentos fallidos de inicio de sesión.\n`)
  // TODO: reemplazar con el envío real cuando tengas un proveedor configurado
}
