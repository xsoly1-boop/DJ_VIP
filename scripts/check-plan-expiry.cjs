/**
 * check-plan-expiry.cjs
 * ═══════════════════════════════════════════════════════════════
 * Script que verifica los planes próximos a vencer y envía
 * notificaciones FCM a los DJs afectados.
 *
 * Ejecutar periódicamente (cron job o Cloud Scheduler):
 *   node scripts/check-plan-expiry.cjs
 *
 * O integrar con un endpoint del servidor:
 *   POST /api/admin/checkPlanExpiry   (requiere admin secret)
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const admin = require('firebase-admin');
const fcmSender = require('./fcm-sender.cjs');

// Inicializar Firebase Admin si no está ya inicializado
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
      });
    } else {
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
      });
    }
  } catch (e) {
    console.error('[PlanExpiry] Error inicializando Firebase Admin:', e.message);
    process.exit(1);
  }
}

/**
 * Verificar usuarios con plan próximo a vencer y enviar notificaciones FCM
 * Se envía notificación a 24h y a 1h antes del vencimiento
 */
async function checkPlanExpiry() {
  console.log('[PlanExpiry] Iniciando verificación de planes próximos a vencer...');

  const db = admin.database();
  const usersSnap = await db.ref('users').once('value');

  if (!usersSnap.exists()) {
    console.log('[PlanExpiry] No hay usuarios en la base de datos.');
    return;
  }

  const now = Date.now();
  const HOURS_24 = 24 * 60 * 60 * 1000;
  const HOURS_1  =  1 * 60 * 60 * 1000;
  const WINDOW   = 30 * 60 * 1000; // ventana de 30 min para evitar duplicados

  let notificaciones24h = 0;
  let notificaciones1h  = 0;

  const promises = [];

  usersSnap.forEach(userSnap => {
    const uid = userSnap.key;
    const profile = userSnap.val()?.profile;
    if (!profile) return;

    const { activePlan, subscriptionStatus, planExpiresAt } = profile;

    // Solo usuarios con plan activo y fecha de vencimiento
    if (!planExpiresAt || !activePlan || activePlan === 'free') return;
    if (subscriptionStatus !== 'active' && subscriptionStatus !== 'approved') return;

    const msToExpiry = planExpiresAt - now;

    // Notificación a 24 horas antes
    if (msToExpiry > 0 && msToExpiry <= HOURS_24 && msToExpiry > HOURS_24 - WINDOW) {
      const hours = Math.ceil(msToExpiry / (60 * 60 * 1000));
      promises.push(
        fcmSender.sendPlanExpiryNotification(uid, hours)
          .then(() => { notificaciones24h++; })
          .catch(err => console.error(`[PlanExpiry] Error notif 24h uid=${uid}:`, err.message))
      );
    }

    // Notificación a 1 hora antes
    if (msToExpiry > 0 && msToExpiry <= HOURS_1 && msToExpiry > HOURS_1 - WINDOW) {
      const minutes = Math.ceil(msToExpiry / (60 * 1000));
      promises.push(
        fcmSender.sendPlanExpiryNotification(uid, Math.ceil(minutes / 60))
          .then(() => { notificaciones1h++; })
          .catch(err => console.error(`[PlanExpiry] Error notif 1h uid=${uid}:`, err.message))
      );
    }
  });

  await Promise.allSettled(promises);

  console.log(`[PlanExpiry] Verificación completada:`);
  console.log(`  • Notificaciones de 24h enviadas: ${notificaciones24h}`);
  console.log(`  • Notificaciones de 1h enviadas:  ${notificaciones1h}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkPlanExpiry()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[PlanExpiry] Error fatal:', err);
      process.exit(1);
    });
}

module.exports = { checkPlanExpiry };
