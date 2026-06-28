/**
 * fcm-sender.cjs
 * ══════════════════════════════════════════════════════════════════
 * Módulo backend para enviar notificaciones push via Firebase Cloud
 * Messaging (FCM) a los dispositivos Android de DJ Panel Pro.
 *
 * Utilizado por:
 *   • adminRoutes.cjs  — suscripciones, soporte, nuevos usuarios
 *   • server.cjs       — peticiones de canciones
 *   • Cualquier otro módulo del backend DJVIP
 *
 * Flujo:
 *   1. Consultar Firestore → users/{uid}/devices/ → obtener fcmToken(s)
 *   2. Enviar mensaje FCM (payload tipo "data") via firebase-admin
 * ══════════════════════════════════════════════════════════════════
 */

'use strict';

const admin = require('firebase-admin');

// ─── Inicializar Firebase Admin (singleton) ───────────────────────────────────
let adminApp;

function getAdminApp() {
  if (adminApp) return adminApp;

  try {
    adminApp = admin.app();
  } catch (e) {
    // No hay instancia inicializada, crear una nueva
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(sa),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL ||
                     'https://djvip-c2cc9-default-rtdb.firebaseio.com'
      });
    } else {
      const serviceAccount = require('../serviceAccountKey.json');
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL ||
                     'https://djvip-c2cc9-default-rtdb.firebaseio.com'
      });
    }
  }

  return adminApp;
}

function getDatabase() {
  return getAdminApp().database();
}

function getMessaging() {
  return getAdminApp().messaging();
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES INTERNAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtener los tokens FCM de un usuario desde Realtime Database
 * @param {string} uid - UID del usuario
 * @returns {Promise<string[]>}
 */
async function getTokensForUser(uid) {
  try {
    const db = getDatabase();
    const snap = await db.ref(`users/${uid}/devices`).once('value');
    if (!snap.exists()) return [];

    const devices = snap.val();
    const tokens = [];
    Object.values(devices).forEach(device => {
      if (device && device.fcmToken && device.platform === 'android' && device.active !== false) {
        tokens.push(device.fcmToken);
      }
    });

    return tokens;
  } catch (err) {
    console.error(`[FCM] Error obteniendo tokens para uid=${uid}:`, err.message);
    return [];
  }
}

/**
 * Obtener los tokens FCM de todos los admins master
 * @returns {Promise<string[]>}
 */
async function getAdminTokens() {
  try {
    const db = getDatabase();
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) return [];

    const users = usersSnap.val();
    const tokens = [];

    for (const [uid, u] of Object.entries(users)) {
      if (!u || typeof u !== 'object') continue;
      const profile = u.profile || {};

      const isAdmin =
        profile.email === 'dj@admin.com' ||
        profile.role === 'admin_master' ||
        uid === 'uid-admin-master';

      if (isAdmin) {
        const adminTokens = await getTokensForUser(uid);
        tokens.push(...adminTokens);
      }
    }

    return tokens;
  } catch (err) {
    console.error('[FCM] Error obteniendo tokens de admins:', err.message);
    return [];
  }
}



/**
 * Enviar un mensaje FCM a uno o varios tokens
 * @param {string[]} tokens
 * @param {Object} payload - campos del mensaje FCM
 * @returns {Promise<{sent: number, failed: number}>}
 */
async function sendToTokens(tokens, payload, dataOnly = false) {
  if (!tokens || tokens.length === 0) {
    console.warn('[FCM] Sin tokens disponibles para enviar el mensaje.');
    return { sent: 0, failed: 0 };
  }

  const messaging = getMessaging();
  let sent = 0;
  let failed = 0;

  // Enviar a cada token individualmente para manejar errores por token
  const promises = tokens.map(async (token) => {
    try {
      const message = {
        token,
        data: {
          ...payload.data,
          // Asegurar que todos los valores son strings (requerimiento FCM)
          ...Object.fromEntries(
            Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
          )
        },
        android: {
          priority: 'high'
        }
      };

      if (!dataOnly) {
        message.notification = {
          title: payload.data?.title || 'DJ Panel Pro',
          body: payload.data?.body || ''
        };
        message.android.notification = {
          sound: 'default',
          channelId: payload.data?.channel_id || 'djvip_default',
          icon: 'ic_notification'
        };
      }

      await messaging.send(message);
      sent++;
      console.log(`[FCM] ✅ Mensaje enviado al token ...${token.slice(-8)} (dataOnly=${dataOnly})`);
    } catch (err) {
      failed++;
      console.error(`[FCM] ❌ Error enviando al token ...${token.slice(-8)}:`, err.code || err.message);

      // Si el token es inválido, eliminarlo de Firestore
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token'
      ) {
        await removeInvalidToken(token);
      }
    }
  });

  await Promise.allSettled(promises);
  console.log(`[FCM] Resultado: ${sent} enviados, ${failed} fallidos de ${tokens.length} tokens.`);
  return { sent, failed };
}

/**
 * Eliminar un token FCM inválido de Realtime Database
 */
async function removeInvalidToken(token) {
  try {
    const db = getDatabase();
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) return;

    const users = usersSnap.val();
    const promises = [];

    Object.entries(users).forEach(([uid, u]) => {
      if (u && u.devices && typeof u.devices === 'object') {
        Object.entries(u.devices).forEach(([deviceId, device]) => {
          if (device && device.fcmToken === token) {
            promises.push(db.ref(`users/${uid}/devices/${deviceId}`).remove());
          }
        });
      }
    });

    await Promise.all(promises);
    console.log(`[FCM] Token inválido eliminado de Realtime Database.`);
  } catch (err) {
    console.error('[FCM] Error eliminando token inválido:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// API PÚBLICA — Funciones de envío por tipo de notificación
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🎵 Notificación de Petición de Canción
 * Enviada al DJ cuando un usuario del público pide una canción
 *
 * @param {string} djUid       - UID del DJ en Firebase Auth
 * @param {string} songTitle   - Nombre de la canción pedida
 * @param {string} requestedBy - Nombre del usuario que pide
 */
async function sendSongRequestNotification(djUid, songTitle, requestedBy) {
  console.log(`[FCM] 🎵 Petición de canción → DJ:${djUid} | "${songTitle}" por ${requestedBy}`);

  const tokens = await getTokensForUser(djUid);
  return sendToTokens(tokens, {
    data: {
      notification_type: 'song_request',
      title: '🎶 Nueva Petición de Canción',
      body: `${requestedBy} pide: "${songTitle}"`,
      song_title: songTitle,
      requested_by: requestedBy,
      channel_id: 'djvip_song_requests',
      timestamp: String(Date.now())
    }
  });
}

/**
 * ⏳ Notificación de Tiempo Restante del Plan
 * Enviada al DJ cuando su plan está próximo a vencer
 *
 * @param {string} djUid          - UID del DJ
 * @param {number} hoursRemaining - Horas restantes del plan
 */
async function sendPlanExpiryNotification(djUid, hoursRemaining) {
  console.log(`[FCM] ⏳ Plan por vencer → DJ:${djUid} | ${hoursRemaining}h restantes`);

  const tokens = await getTokensForUser(djUid);
  return sendToTokens(tokens, {
    data: {
      notification_type: 'plan_expiry',
      title: '⏳ Tu Plan está por Vencer',
      body: `Tu plan activo vence en ${hoursRemaining} horas. ¡Renuévalo para no perder el servicio!`,
      hours_remaining: String(hoursRemaining),
      channel_id: 'djvip_plan_status',
      timestamp: String(Date.now())
    }
  });
}

/**
 * ✅ Notificación de Suscripción Pendiente de Validación
 * Enviada a todos los Admin Master cuando un DJ solicita un plan
 *
 * @param {string} username - Nombre del DJ que solicita
 * @param {string} planName - Nombre del plan solicitado
 * @param {string} djUid    - UID del DJ (para referencia)
 */
async function sendSubscriptionPendingNotification(username, planName, djUid = '') {
  console.log(`[FCM] ✅ Suscripción pendiente → Admin | Usuario:${username} | Plan:${planName}`);

  const tokens = await getAdminTokens();
  return sendToTokens(tokens, {
    data: {
      notification_type: 'subscription_pending',
      title: '✅ Suscripción Pendiente',
      body: `${username} solicitó activar "${planName}". Requiere tu validación.`,
      username,
      plan_name: planName,
      dj_uid: djUid,
      channel_id: 'djvip_admin_subscriptions',
      timestamp: String(Date.now())
    }
  }, false);
}

/**
 * 💬 Notificación de Mensaje en Chat Soporte PRO
 * Enviada a todos los Admin Master cuando un DJ envía un mensaje de soporte
 *
 * @param {string} fromUser       - Nombre del DJ que envía el mensaje
 * @param {string} messagePreview - Primeros caracteres del mensaje
 * @param {string} djUid          - UID del DJ (para abrir el chat correcto)
 */
async function sendSupportMessageNotification(fromUser, messagePreview, djUid = '') {
  console.log(`[FCM] 💬 Mensaje soporte → Admin | De:${fromUser}`);

  const tokens = await getAdminTokens();
  const preview = messagePreview.length > 80
    ? messagePreview.substring(0, 80) + '...'
    : messagePreview;

  return sendToTokens(tokens, {
    data: {
      notification_type: 'support_message',
      title: '💬 Nuevo Mensaje en Soporte PRO',
      body: `${fromUser}: "${preview}"`,
      from_user: fromUser,
      message_preview: preview,
      dj_uid: djUid,
      channel_id: 'djvip_admin_support',
      timestamp: String(Date.now())
    }
  }, false);
}

/**
 * 👤 Notificación de Nuevo Usuario Registrado
 * Enviada a todos los Admin Master cuando se registra un nuevo usuario
 *
 * @param {string} username - Nombre del nuevo usuario
 * @param {string} email    - Email del nuevo usuario
 * @param {string} uid      - UID asignado al nuevo usuario
 */
async function sendNewUserNotification(username, email, uid = '') {
  console.log(`[FCM] 👤 Nuevo usuario → Admin | ${username} <${email}>`);

  const tokens = await getAdminTokens();
  return sendToTokens(tokens, {
    data: {
      notification_type: 'new_user_registered',
      title: '👤 Nuevo Usuario Registrado',
      body: `${username} (${email}) se unió a la plataforma DJVIP.`,
      username,
      email,
      new_user_uid: uid,
      channel_id: 'djvip_admin_users',
      timestamp: String(Date.now())
    }
  }, false);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENDPOINT: Registrar token FCM desde la app Android
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Guardar o actualizar el token FCM de un dispositivo en Realtime Database
 * Llamado por el endpoint POST /api/register-fcm-token
 *
 * @param {string} uid      - UID del usuario autenticado
 * @param {string} fcmToken - Token FCM del dispositivo
 * @param {string} platform - 'android' | 'ios' | 'web'
 */
async function registerFCMToken(uid, fcmToken, platform = 'android') {
  try {
    const db = getDatabase();
    // Sanitizar token para usarlo como key segura en Realtime Database
    const deviceId = Buffer.from(fcmToken).toString('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/=/g, '')
      .substring(0, 30);

    await db.ref(`users/${uid}/devices/${deviceId}`).set({
      fcmToken,
      platform,
      updatedAt: Date.now(),
      active: true
    });

    console.log(`[FCM] Token registrado para uid=${uid} (${platform}) en Realtime Database`);
    return { success: true };
  } catch (err) {
    console.error('[FCM] Error registrando token:', err.message);
    throw err;
  }
}

/**
 * Eliminar el token FCM de un dispositivo en Realtime Database (para logout)
 *
 * @param {string} uid      - UID del usuario autenticado
 * @param {string} fcmToken - Token FCM del dispositivo
 */
async function unregisterFCMToken(uid, fcmToken) {
  try {
    const db = getDatabase();
    const deviceId = Buffer.from(fcmToken).toString('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/=/g, '')
      .substring(0, 30);

    await db.ref(`users/${uid}/devices/${deviceId}`).remove();
    console.log(`[FCM] Token desregistrado para uid=${uid} en Realtime Database`);
    return { success: true };
  } catch (err) {
    console.error('[FCM] Error desregistrando token:', err.message);
    throw err;
  }
}

/**
 * 🚀 Notificación de Actualización Global
 * Envía una notificación push a todos los dispositivos registrados en la base de datos
 */
async function sendGlobalUpdateNotification(versionName, releaseNotes = '') {
  console.log(`[FCM] 🚀 Notificación global de actualización → v${versionName}`);
  
  try {
    const db = getDatabase();
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) return { sent: 0, failed: 0 };
    
    const users = usersSnap.val();
    const tokens = [];
    
    for (const [uid, u] of Object.entries(users)) {
      if (u && u.devices && typeof u.devices === 'object') {
        Object.values(u.devices).forEach(device => {
          if (device && device.fcmToken && device.platform === 'android' && device.active !== false) {
            if (!tokens.includes(device.fcmToken)) {
              tokens.push(device.fcmToken);
            }
          }
        });
      }
    }
    
    const bodyText = releaseNotes 
      ? `Hay una nueva versión disponible (v${versionName}). Novedades: ${releaseNotes}`
      : `Ya está disponible la nueva versión ${versionName}. Abre la aplicación para actualizar.`;
      
    return sendToTokens(tokens, {
      data: {
        notification_type: 'app_update',
        title: '🚀 Actualización de DJ Panel Pro',
        body: bodyText,
        version: versionName,
        channel_id: 'djvip_default',
        timestamp: String(Date.now())
      }
    });
  } catch (err) {
    console.error('[FCM] Error enviando notificación de actualización global:', err.message);
    return { sent: 0, failed: 0 };
  }
}

// ─── Exportar ─────────────────────────────────────────────────────────────────
module.exports = {
  sendSongRequestNotification,
  sendPlanExpiryNotification,
  sendSubscriptionPendingNotification,
  sendSupportMessageNotification,
  sendNewUserNotification,
  sendGlobalUpdateNotification,
  registerFCMToken,
  unregisterFCMToken,
  getAdminTokens,
  getTokensForUser
};
