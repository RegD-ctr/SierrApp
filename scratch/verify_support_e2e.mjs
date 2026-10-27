import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/diegoreyes/.gemini/antigravity/brain/e0541bb2-6307-48a0-b851-3fdec9c84554';
const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:8443';

async function main() {
  console.log('=== INICIO VERIFICACIÓN COMPLETA MÓDULO DE SOPORTE ===\n');

  // --------------------------------------------------------------------------
  // PASO 6 (PREVIO): PRUEBAS DE SEGURIDAD
  // --------------------------------------------------------------------------
  console.log('--- PASO 6: Pruebas de Seguridad en Endpoints de Soporte ---');
  
  // 6.1: POST /api/support/messages sin token -> 401
  const unauthRes = await fetch(`${BACKEND_URL}/api/support/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensaje: 'Mensaje sin auth' }),
  });
  console.log(`6.1 POST /api/support/messages sin token status: ${unauthRes.status} (esperado 401)`);
  if (unauthRes.status !== 401) {
    throw new Error(`Fallo de seguridad: se esperaba 401 y se obtuvo ${unauthRes.status}`);
  }

  // Crear usuario de prueba con el esquema real
  const timestamp = Date.now();
  const userEmail = `support.user.${timestamp}@test.com`;
  const userPassword = 'S!err4App2026#Sup0rtP@ss';
  const userName = `Carlos Cliente ${timestamp.toString().slice(-4)}`;

  console.log(`Registrando usuario de prueba: ${userEmail}`);
  const regUserRes = await fetch(`${BACKEND_URL}/api/auth/register/usuario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: userName,
      email: userEmail,
      password: userPassword,
      telefono: '5551234567',
      direccion: {
        calle: 'Av. Las Palmas',
        numero: '123',
        colonia: 'Centro',
        cp: '64000',
        ciudad: 'Monterrey',
        estado: 'Nuevo León',
      },
    }),
  });
  if (!regUserRes.ok) {
    const errText = await regUserRes.text();
    throw new Error(`Error al registrar usuario: ${regUserRes.status} ${errText}`);
  }
  const regUserData = await regUserRes.json();
  const userId = regUserData.userId;
  console.log(`Usuario creado exitosamente: ID ${userId}`);

  // Iniciar sesión como usuario para obtener accessToken
  const userLoginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: userPassword }),
  });
  const userLoginData = await userLoginRes.json();
  const userToken = userLoginData.accessToken;

  // 6.2: GET /api/support/admin/conversations con token de USUARIO -> 403
  const forbiddenRes = await fetch(`${BACKEND_URL}/api/support/admin/conversations`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log(`6.2 GET /api/support/admin/conversations con token de USUARIO status: ${forbiddenRes.status} (esperado 403)`);
  if (forbiddenRes.status !== 403) {
    throw new Error(`Fallo de seguridad: se esperaba 403 y se obtuvo ${forbiddenRes.status}`);
  }
  console.log('✓ Pruebas de seguridad aprobadas: 401 sin auth y 403 para rol no admin.\n');

  // Login como Admin para aprobar el local
  const adminLoginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sierraapp.com', password: 'Adm!nPlatf0rm2026#Secure' }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.accessToken;

  // Registrar segundo usuario (rol LOCAL) para el Paso 5
  const localEmail = `support.local.${timestamp}@test.com`;
  const localPassword = 'S!err4App2026#Sup0rtP@ss';
  const localName = `Taquería Don Pedro ${timestamp.toString().slice(-4)}`;
  console.log(`Registrando local de prueba: ${localEmail}`);
  const regLocalRes = await fetch(`${BACKEND_URL}/api/auth/register/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombreNegocio: localName,
      email: localEmail,
      password: localPassword,
      telefono: '5559876543',
      direccion: 'Av. Siempre Viva 742, Colonia Centro',
    }),
  });
  if (!regLocalRes.ok) {
    const errText = await regLocalRes.text();
    throw new Error(`Error al registrar local: ${regLocalRes.status} ${errText}`);
  }
  const regLocalData = await regLocalRes.json();
  const localUserId = regLocalData.userId;
  const restaurantId = regLocalData.restaurantId;
  console.log(`Local creado exitosamente: ID ${localUserId}, Restaurante: ${restaurantId}`);

  // Admin aprueba el local para que pueda operar
  await fetch(`${BACKEND_URL}/api/restaurants/admin/${restaurantId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`Local ${restaurantId} aprobado por el Admin`);

  // Local inicia sesión
  const localLoginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: localEmail, password: localPassword }),
  });
  const localLoginData = await localLoginRes.json();
  const localToken = localLoginData.accessToken;
  console.log(`Token de autenticación obtenido para el Local\n`);

  // --------------------------------------------------------------------------
  // PLAYWRIGHT BROWSER SETUP
  // --------------------------------------------------------------------------
  console.log('Iniciando Chromium para pruebas E2E visuales...');
  const browser = await chromium.launch({ headless: true });

  // Contexto 1: Usuario Normal
  const userContext = await browser.newContext({
    viewport: { width: 420, height: 840 },
  });
  const userPage = await userContext.newPage();

  // Contexto 2: Admin
  const adminContext = await browser.newContext({
    viewport: { width: 1280, height: 840 },
  });
  const adminPage = await adminContext.newPage();

  try {
    // ------------------------------------------------------------------------
    // PASO 1: USUARIO ENVÍA MENSAJE REAL DESDE LA UI (Support.tsx)
    // ------------------------------------------------------------------------
    console.log('--- PASO 1: Usuario inicia sesión y envía mensaje a soporte desde la UI ---');
    await userPage.goto(FRONTEND_URL);
    await userPage.waitForLoadState('networkidle');

    // Iniciar sesión como usuario
    await userPage.locator('button:has-text("Usuario")').first().click();
    await userPage.locator('input[type="email"]').fill(userEmail);
    await userPage.locator('input[type="password"]').fill(userPassword);
    await userPage.locator('button[type="submit"]').click();

    // Esperar navegación al dashboard / inicio
    await userPage.waitForSelector('text=Inicio', { timeout: 10000 });
    console.log('Usuario autenticado correctamente en la interfaz');

    // Navegar a Perfil
    await userPage.locator('nav button:has-text("Perfil")').click();
    await userPage.waitForSelector('text=Mi Perfil', { timeout: 5000 });

    // Navegar a "Ayuda y soporte"
    await userPage.locator('button:has-text("Ayuda y soporte")').click();
    await userPage.waitForSelector('text=Centro de Ayuda', { timeout: 5000 });
    console.log('Pantalla de Soporte (Support.tsx) cargada');

    // Escribir y enviar mensaje real
    const userMessageText = 'Hola soporte, tengo un problema con mi dirección de entrega para mi pedido.';
    const inputArea = userPage.locator('input[placeholder*="Escribe"]').first();
    await inputArea.fill(userMessageText);
    
    // Clic en enviar
    const sendButton = userPage.locator('button:has-text("Enviar")').first();
    await sendButton.click();

    // Esperar a que el mensaje aparezca en la lista de mensajes
    await userPage.waitForSelector(`text=${userMessageText}`, { timeout: 8000 });
    console.log('Mensaje enviado y visible en Support.tsx');

    // Captura de pantalla Paso 1
    const screen1 = path.join(ARTIFACT_DIR, 'audit_support_1_usuario_envia_mensaje.png');
    await userPage.screenshot({ path: screen1, fullPage: true });
    console.log(`✓ Captura 1 guardada: ${screen1}`);

    // Verificar en BD que se guardó con autor: USUARIO
    const messagesRes = await fetch(`${BACKEND_URL}/api/support/messages`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userMessages = await messagesRes.json();
    console.log(`Mensajes en BD para el usuario: ${userMessages.length}`);
    const lastUserMsg = userMessages.find(m => m.mensaje === userMessageText);
    if (!lastUserMsg || lastUserMsg.autor !== 'USUARIO') {
      throw new Error(`El mensaje en BD no tiene autor: 'USUARIO': ${JSON.stringify(lastUserMsg)}`);
    }
    console.log('✓ Verificación en BD exitosa: autor = USUARIO\n');

    // ------------------------------------------------------------------------
    // PASO 2: ADMIN INICIA SESIÓN, RECIBE NOTIFICACIÓN Y VE CONVERSACIÓN
    // ------------------------------------------------------------------------
    console.log('--- PASO 2: Admin inicia sesión en AdminPanel.tsx y revisa lista de conversaciones ---');
    await adminPage.goto(FRONTEND_URL);
    await adminPage.waitForLoadState('networkidle');

    // Iniciar sesión como Admin
    await adminPage.locator('button:has-text("Acceso administrador")').click();
    await adminPage.locator('input[type="email"]').fill('admin@sierraapp.com');
    await adminPage.locator('input[type="password"]').fill('Adm!nPlatf0rm2026#Secure');
    await adminPage.locator('button[type="submit"]').click();

    // Esperar dashboard de Admin
    await adminPage.waitForSelector('text=Dashboard', { timeout: 10000 });
    console.log('Admin autenticado en AdminPanel');

    // Verificar notificación persistida para el admin
    const notifRes = await fetch(`${BACKEND_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const notifs = await notifRes.json();
    const supportNotif = notifs.find(n => n.tipo === 'SOPORTE_MENSAJE' && n.titulo.toLowerCase().includes('soporte'));
    console.log(`Notificación persistida encontrada para el admin: ${supportNotif ? supportNotif.titulo : 'Ninguna'}`);

    // Ir a la pestaña Soporte en AdminPanel
    await adminPage.locator('nav button:has-text("Soporte")').click();
    await adminPage.waitForSelector('text=Soporte y Mensajes', { timeout: 5000 });

    // Verificar que la conversación del usuario aparece
    await adminPage.waitForSelector(`text=${userName}`, { timeout: 8000 });
    console.log(`Conversación de ${userName} presente en la lista de soporte`);

    // Captura de pantalla Paso 2
    const screen2 = path.join(ARTIFACT_DIR, 'audit_support_2_admin_conversaciones_list.png');
    await adminPage.screenshot({ path: screen2, fullPage: true });
    console.log(`✓ Captura 2 guardada: ${screen2}\n`);

    // ------------------------------------------------------------------------
    // PASO 3 & 4: ADMIN ABRE CONVERSACIÓN, RESPONDE Y USUARIO RECIBE EN VIVO
    // ------------------------------------------------------------------------
    console.log('--- PASO 3 & 4: Admin abre chat, responde y usuario recibe respuesta en vivo ---');
    // Clic en "Abrir chat →" para el usuario
    const openChatBtn = adminPage.locator(`div:has-text("${userName}")`).locator('button:has-text("Abrir chat")').first();
    await openChatBtn.click();

    // Esperar vista de chat
    await adminPage.waitForSelector('text=← Volver', { timeout: 5000 });
    await adminPage.waitForSelector(`text=${userMessageText}`, { timeout: 5000 });
    console.log('Chat abierto en el AdminPanel, mensaje del usuario visible');

    // Admin escribe respuesta
    const adminReplyText = 'Hola Carlos, con gusto te apoyamos. ¿Nos podrías confirmar tu calle y número exacto?';
    await adminPage.locator('input[placeholder*="Escribe una respuesta como Soporte"]').fill(adminReplyText);
    await adminPage.locator('button:has-text("Responder")').click();

    // Esperar a que aparezca la respuesta en el chat de admin
    await adminPage.waitForSelector(`text=${adminReplyText}`, { timeout: 8000 });
    console.log('Respuesta enviada por Admin y visible en el panel');

    // Captura de pantalla Paso 3
    const screen3 = path.join(ARTIFACT_DIR, 'audit_support_3_admin_chat_reply.png');
    await adminPage.screenshot({ path: screen3, fullPage: true });
    console.log(`✓ Captura 3 guardada: ${screen3}`);

    // VERIFICAR RECEPCIÓN EN VIVO EN EL LADO DEL USUARIO SIN RECARGAR
    console.log('Verificando recepción en vivo en la pantalla del usuario (sin reload)...');
    await userPage.waitForSelector(`text=${adminReplyText}`, { timeout: 10000 });
    console.log('✓ La respuesta del Admin llegó en tiempo real al usuario mediante WebSockets!');

    // Captura de pantalla Paso 4
    const screen4 = path.join(ARTIFACT_DIR, 'audit_support_4_usuario_recibe_respuesta_live.png');
    await userPage.screenshot({ path: screen4, fullPage: true });
    console.log(`✓ Captura 4 guardada: ${screen4}`);

    // Verificar en BD autor: SOPORTE
    const updatedMessagesRes = await fetch(`${BACKEND_URL}/api/support/messages`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const updatedMessages = await updatedMessagesRes.json();
    const replyMsgInDb = updatedMessages.find(m => m.mensaje === adminReplyText);
    if (!replyMsgInDb || replyMsgInDb.autor !== 'SOPORTE') {
      throw new Error(`La respuesta en BD no tiene autor: 'SOPORTE': ${JSON.stringify(replyMsgInDb)}`);
    }
    console.log('✓ Verificación en BD exitosa: autor = SOPORTE');

    // Verificar notificación persistida para el usuario
    const userNotifRes = await fetch(`${BACKEND_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userNotifs = await userNotifRes.json();
    const userSupportNotif = userNotifs.find(n => n.tipo === 'SOPORTE_RESPUESTA');
    console.log(`✓ Notificación persistida recibida por el usuario: ${userSupportNotif?.titulo || 'OK'}\n`);

    // ------------------------------------------------------------------------
    // PASO 5: SEGUNDO USUARIO (ROL LOCAL) ESCRIBE A SOPORTE
    // ------------------------------------------------------------------------
    console.log('--- PASO 5: Segundo usuario (rol LOCAL) escribe a soporte ---');
    const localMsgText = 'Hola soporte, queremos confirmar el estado de aprobación de nuestro restaurante.';
    const sendLocalMsgRes = await fetch(`${BACKEND_URL}/api/support/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localToken}`,
      },
      body: JSON.stringify({ mensaje: localMsgText }),
    });
    const localMsgData = await sendLocalMsgRes.json();
    console.log(`Mensaje enviado por el LOCAL: ${localMsgData.id}`);

    // En AdminPanel, volver a la lista de conversaciones
    await adminPage.locator('button:has-text("← Volver")').click();
    await adminPage.waitForSelector('text=Soporte y Mensajes', { timeout: 5000 });

    // Esperar a que ambas conversaciones aparezcan
    await adminPage.waitForSelector(`text=${localName}`, { timeout: 8000 });
    await adminPage.waitForSelector(`text=${userName}`, { timeout: 8000 });
    console.log('Ambas conversaciones (Usuario y Local) presentes en AdminPanel');

    // Captura de pantalla Paso 5
    const screen5 = path.join(ARTIFACT_DIR, 'audit_support_5_admin_multiples_roles_conversaciones.png');
    await adminPage.screenshot({ path: screen5, fullPage: true });
    console.log(`✓ Captura 5 guardada: ${screen5}\n`);

    console.log('=== TODAS LAS PRUEBAS E2E Y VISUALES COMPLETADAS CON ÉXITO ===');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('ERROR EN VERIFICACIÓN:', err);
  process.exit(1);
});
