/**
 * exhaustive_notification_test.cjs
 * ══════════════════════════════════════════════════════════════════
 * Script de prueba exhaustiva para el envío de notificaciones push
 * en segundo plano (Android) a la cuenta de Admin Master.
 * ══════════════════════════════════════════════════════════════════
 */

'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const fcmSender = require('./fcm-sender.cjs');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();
const targetUid = 'WuOSSeOODRfxVnNpEVbc6S259f63'; // Admin Master (Soporte)

async function main() {
  console.log('================================================================');
  console.log('🧪 INICIANDO TEST EXHAUSTIVO DE NOTIFICACIONES PUSH (ANDROID)');
  console.log('================================================================');

  // 1. Verificar existencia del Admin Master y sus tokens en RTDB
  console.log(`\n🔍 Verificando cuenta de Admin Master (UID: ${targetUid})...`);
  const userSnap = await db.ref(`users/${targetUid}`).once('value');
  if (!userSnap.exists()) {
    console.error('❌ Error: El usuario Admin Master no existe en la base de datos.');
    process.exit(1);
  }

  const userData = userSnap.val();
  const profile = userData.profile || {};
  console.log(`   👤 Nombre: ${profile.displayName || 'N/A'}`);
  console.log(`   ✉️  Email: ${profile.email || 'N/A'}`);

  const devices = userData.devices || {};
  const tokens = [];
  console.log(`   📱 Dispositivos registrados (${Object.keys(devices).length}):`);
  
  for (const [deviceId, dev] of Object.entries(devices)) {
    if (dev && dev.fcmToken) {
      const isRealToken = dev.fcmToken.includes(':');
      console.log(`     - ID: ${deviceId}`);
      console.log(`       Plataforma: ${dev.platform} | Activo: ${dev.active}`);
      console.log(`       Token: ${dev.fcmToken.substring(0, 25)}... (${isRealToken ? 'REAL' : 'MOCK/TEST'})`);
      if (dev.active !== false && dev.platform === 'android') {
        tokens.push(dev.fcmToken);
      }
    }
  }

  if (tokens.length === 0) {
    console.warn('\n⚠️  ATENCIÓN: No hay tokens de Android activos para este Admin Master.');
    console.warn('   Las notificaciones no se enviarán a ningún dispositivo real.');
    console.warn('   Por favor, asegúrate de que la app móvil en Android esté logueada con dj@admin.com.');
  } else {
    console.log(`\n✅ Se encontraron ${tokens.length} tokens listos para recibir notificaciones.`);
  }

  const results = [];

  // 2. Enviar Notificación Tipo 1: Petición de Canción (Song Request) - Con sonido/alerta visible
  console.log('\n--- [TEST 1/6] Notificación de Petición de Canción (Visible/Sonido) ---');
  try {
    const res = await fcmSender.sendSongRequestNotification(
      targetUid,
      'La Chona - Los Tucanes de Tijuana 🌵',
      'Juan Pérez (Mesa 5)'
    );
    results.push({ test: 'Petición de Canción (Visible)', ...res });
  } catch (err) {
    console.error('❌ Error en Test 1:', err.message);
    results.push({ test: 'Petición de Canción (Visible)', sent: 0, failed: 1, error: err.message });
  }

  // 3. Enviar Notificación Tipo 2: Vencimiento de Plan (Plan Expiry) - Con sonido/alerta visible
  console.log('\n--- [TEST 2/6] Notificación de Vencimiento de Plan (Visible/Sonido) ---');
  try {
    const res = await fcmSender.sendPlanExpiryNotification(targetUid, 24);
    results.push({ test: 'Vencimiento de Plan (Visible)', ...res });
  } catch (err) {
    console.error('❌ Error en Test 2:', err.message);
    results.push({ test: 'Vencimiento de Plan (Visible)', sent: 0, failed: 1, error: err.message });
  }

  // 4. Enviar Notificación Tipo 3: Suscripción Pendiente (Silent / Data-Only)
  console.log('\n--- [TEST 3/6] Notificación de Suscripción Pendiente (Segundo Plano/Silent) ---');
  try {
    const res = await fcmSender.sendSubscriptionPendingNotification(
      'DJ MegaMix Pro',
      'Plan Anual Premium (PRO)',
      'uid-dummy-dj-123'
    );
    results.push({ test: 'Suscripción Pendiente (Silent)', ...res });
  } catch (err) {
    console.error('❌ Error en Test 3:', err.message);
    results.push({ test: 'Suscripción Pendiente (Silent)', sent: 0, failed: 1, error: err.message });
  }

  // 5. Enviar Notificación Tipo 4: Mensaje de Soporte (Silent / Data-Only)
  console.log('\n--- [TEST 4/6] Notificación de Mensaje en Soporte (Segundo Plano/Silent) ---');
  try {
    const res = await fcmSender.sendSupportMessageNotification(
      'DJ Juan',
      'Hola, tengo problemas con el autocompletado en mi tableta. ¿Me pueden ayudar?',
      'uid-dummy-dj-123'
    );
    results.push({ test: 'Mensaje de Soporte (Silent)', ...res });
  } catch (err) {
    console.error('❌ Error en Test 4:', err.message);
    results.push({ test: 'Mensaje de Soporte (Silent)', sent: 0, failed: 1, error: err.message });
  }

  // 6. Enviar Notificación Tipo 5: Nuevo Usuario Registrado (Silent / Data-Only)
  console.log('\n--- [TEST 5/6] Notificación de Nuevo Registro de Usuario (Segundo Plano/Silent) ---');
  try {
    const res = await fcmSender.sendNewUserNotification(
      'DJ ElectroFlow',
      'electroflow@djvip.com',
      'uid-new-dj-999'
    );
    results.push({ test: 'Nuevo Usuario Registrado (Silent)', ...res });
  } catch (err) {
    console.error('❌ Error en Test 5:', err.message);
    results.push({ test: 'Nuevo Usuario Registrado (Silent)', sent: 0, failed: 1, error: err.message });
  }

  // 7. Enviar Notificación Tipo 6: Actualización Global de la App (Visible/Sonido)
  console.log('\n--- [TEST 6/6] Notificación Global de Actualización (Visible/Sonido) ---');
  try {
    const res = await fcmSender.sendGlobalUpdateNotification(
      '2.0.4',
      'Mejoras críticas en la sincronización en segundo plano de notificaciones de soporte.'
    );
    results.push({ test: 'Actualización Global (Visible)', ...res });
  } catch (err) {
    console.error('❌ Error en Test 6:', err.message);
    results.push({ test: 'Actualización Global (Visible)', sent: 0, failed: 1, error: err.message });
  }

  // 8. Imprimir Resumen final
  console.log('\n================================================================');
  console.log('📊 RESUMEN DEL TEST DE NOTIFICACIONES PUSH');
  console.log('================================================================');
  console.table(results);
  console.log('================================================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error running exhaustive notification test:', err);
  process.exit(1);
});
