const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();
const messaging = admin.messaging();

// ─── Usuarios objetivo ────────────────────────────────────────────────────────
const TARGETS = [
  { name: 'Admin Master', uid: 'WuOSSeOODRfxVnNpEVbc6S259f63' },
  { name: 'Steam',        uid: 'EB1irGfMGNXNTB7khTCpsEB1y2s1' }
];

// ─── Notificaciones de prueba ──────────────────────────────────────────────────
const NOTIFICATIONS = [
  {
    id: 'song_request',
    label: '🎵 Petición de Canción (Visible)',
    buildPayload: (name) => ({
      notification: { title: '🎶 Nueva Petición de Canción', body: `Carlos pide: "Payaso de Rodeo - Caballo Dorado 🤠"` },
      data: { notification_type: 'song_request', song_title: 'Payaso de Rodeo', requested_by: 'Carlos (Mesa 2)', channel_id: 'djvip_song_requests', timestamp: String(Date.now()) },
      android: { priority: 'high', notification: { sound: 'default', channelId: 'djvip_song_requests', icon: 'ic_notification' } }
    })
  },
  {
    id: 'plan_expiry',
    label: '⏳ Vencimiento de Plan (Visible)',
    buildPayload: (name) => ({
      notification: { title: '⏳ Tu Plan está por Vencer', body: 'Tu plan activo vence en 12 horas. ¡Renuévalo!' },
      data: { notification_type: 'plan_expiry', hours_remaining: '12', channel_id: 'djvip_plan_status', timestamp: String(Date.now()) },
      android: { priority: 'high', notification: { sound: 'default', channelId: 'djvip_plan_status', icon: 'ic_notification' } }
    })
  },
  {
    id: 'subscription_pending',
    label: '✅ Suscripción Pendiente (Visible)',
    buildPayload: (name) => ({
      notification: { title: '✅ Suscripción Pendiente', body: `DJ Flash solicitó activar "Plan Mensual Pro". Requiere tu validación.` },
      data: { notification_type: 'subscription_pending', username: 'DJ Flash', plan_name: 'Plan Mensual Pro', channel_id: 'djvip_admin_subscriptions', timestamp: String(Date.now()) },
      android: { priority: 'high', notification: { sound: 'default', channelId: 'djvip_admin_subscriptions', icon: 'ic_notification' } }
    })
  },
  {
    id: 'support_message',
    label: '💬 Mensaje de Soporte (Visible)',
    buildPayload: (name) => ({
      notification: { title: '💬 Nuevo Mensaje en Soporte PRO', body: 'DJ ElectroFlow: "Hola, necesito ayuda con mi evento..."' },
      data: { notification_type: 'support_message', from_user: 'DJ ElectroFlow', channel_id: 'djvip_admin_support', timestamp: String(Date.now()) },
      android: { priority: 'high', notification: { sound: 'default', channelId: 'djvip_admin_support', icon: 'ic_notification' } }
    })
  },
  {
    id: 'new_user',
    label: '👤 Nuevo Usuario Registrado (Visible)',
    buildPayload: (name) => ({
      notification: { title: '👤 Nuevo Usuario Registrado', body: 'DJ Bassline (bassline@djvip.com) se unió a la plataforma.' },
      data: { notification_type: 'new_user_registered', username: 'DJ Bassline', email: 'bassline@djvip.com', channel_id: 'djvip_admin_users', timestamp: String(Date.now()) },
      android: { priority: 'high', notification: { sound: 'default', channelId: 'djvip_admin_users', icon: 'ic_notification' } }
    })
  }
];

// ─── Obtener tokens válidos de un usuario ─────────────────────────────────────
async function getRealTokens(uid) {
  const snap = await db.ref(`users/${uid}/devices`).once('value');
  if (!snap.exists()) return [];
  const devices = snap.val();
  return Object.entries(devices)
    .filter(([, d]) => d && d.fcmToken && d.platform === 'android' && d.active !== false
      && !d.fcmToken.startsWith('desktop_') && !d.fcmToken.startsWith('test_'))
    .map(([, d]) => d.fcmToken);
}

// ─── Enviar una notificación a un token ───────────────────────────────────────
async function sendOne(token, payload) {
  try {
    const msgId = await messaging.send({ token, ...payload });
    return { ok: true, msgId };
  } catch (err) {
    return { ok: false, error: err.code || err.message };
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function runTest() {
  const results = [];

  for (const target of TARGETS) {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`👤 USUARIO: ${target.name} (UID: ${target.uid})`);
    console.log(`${'═'.repeat(65)}`);

    const tokens = await getRealTokens(target.uid);
    if (tokens.length === 0) {
      console.log(`   ⚠️  Sin tokens reales registrados. Saltando...\n`);
      continue;
    }
    console.log(`   📱 Tokens activos: ${tokens.length}\n`);

    for (let i = 0; i < NOTIFICATIONS.length; i++) {
      const notif = NOTIFICATIONS[i];
      const payload = notif.buildPayload(target.name);

      console.log(`   [${i + 1}/${NOTIFICATIONS.length}] ${notif.label}`);

      let sent = 0, failed = 0;
      for (const token of tokens) {
        const res = await sendOne(token, payload);
        if (res.ok) {
          sent++;
          console.log(`       ✅ Enviado | token: ...${token.slice(-8)}`);
        } else {
          failed++;
          console.log(`       ❌ Falló  | token: ...${token.slice(-8)} | ${res.error}`);
        }
        // Pequeña pausa entre notificaciones para que lleguen separadas
        await new Promise(r => setTimeout(r, 1500));
      }

      results.push({ usuario: target.name, notificacion: notif.label, sent, failed });
    }
  }

  // ─── Resumen ─────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(65)}`);
  console.log('📊 RESUMEN DEL TEST COMPLETO');
  console.log(`${'═'.repeat(65)}`);
  console.table(results);
  console.log(`${'═'.repeat(65)}\n`);

  process.exit(0);
}

runTest().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
