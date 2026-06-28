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

const STEAM_UID = 'EB1irGfMGNXNTB7khTCpsEB1y2s1';

// Notificaciones típicas que recibe un usuario con plan activo
const NOTIFICATIONS = [
  {
    label: '🎟️ [1/4] Plan Activado',
    payload: {
      notification: {
        title: '🎉 ¡Tu Plan ha sido Activado!',
        body: 'Tu suscripción "Plan Eventual" está ahora activa. ¡Disfruta todas las funciones premium!'
      },
      data: {
        notification_type: 'plan_activated',
        plan_name: 'Plan Eventual',
        channel_id: 'djvip_plan_status',
        timestamp: String(Date.now())
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'djvip_plan_status', icon: 'ic_notification' }
      }
    }
  },
  {
    label: '⏳ [2/4] Plan por Vencer (24h)',
    payload: {
      notification: {
        title: '⏳ Tu Plan Vence Pronto',
        body: 'Tu plan "Plan Eventual" vence en 24 horas. ¡Renuévalo para no perder el servicio!'
      },
      data: {
        notification_type: 'plan_expiry',
        hours_remaining: '24',
        plan_name: 'Plan Eventual',
        channel_id: 'djvip_plan_status',
        timestamp: String(Date.now())
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'djvip_plan_status', icon: 'ic_notification' }
      }
    }
  },
  {
    label: '🎵 [3/4] Petición de Canción Recibida',
    payload: {
      notification: {
        title: '🎶 Nueva Petición de Canción',
        body: 'Ana pide: "Bohemian Rhapsody - Queen 🎸"'
      },
      data: {
        notification_type: 'song_request',
        song_title: 'Bohemian Rhapsody - Queen',
        requested_by: 'Ana (Mesa 4)',
        channel_id: 'djvip_song_requests',
        timestamp: String(Date.now())
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'djvip_song_requests', icon: 'ic_notification' }
      }
    }
  },
  {
    label: '🔔 [4/4] Actualización de Plataforma',
    payload: {
      notification: {
        title: '🚀 Actualización Disponible',
        body: 'DJ a la Carta Pro v1.0.0.24 — Notificaciones mejoradas y corrección de errores.'
      },
      data: {
        notification_type: 'app_update',
        version: '1.0.0.24',
        channel_id: 'djvip_updates',
        timestamp: String(Date.now())
      },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'djvip_updates', icon: 'ic_notification' }
      }
    }
  }
];

async function getRealTokens(uid) {
  const snap = await db.ref(`users/${uid}/devices`).once('value');
  if (!snap.exists()) return [];
  return Object.values(snap.val())
    .filter(d => d && d.fcmToken && d.platform === 'android' && d.active !== false
      && !d.fcmToken.startsWith('desktop_') && !d.fcmToken.startsWith('test_'))
    .map(d => d.fcmToken);
}

async function runTest() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧪 TEST DE NOTIFICACIONES — USUARIO CON PLAN ACTIVO');
  console.log('   Cuenta: Steam | UID:', STEAM_UID);
  console.log('═══════════════════════════════════════════════════════\n');

  const tokens = await getRealTokens(STEAM_UID);
  if (tokens.length === 0) {
    console.error('❌ Steam no tiene tokens reales registrados.');
    process.exit(1);
  }
  console.log(`📱 Tokens activos: ${tokens.length} | token: ...${tokens[0].slice(-8)}\n`);

  const results = [];

  for (const notif of NOTIFICATIONS) {
    console.log(`Enviando ${notif.label}...`);
    let sent = 0, failed = 0;

    for (const token of tokens) {
      try {
        await messaging.send({ token, ...notif.payload });
        sent++;
        console.log(`  ✅ Enviado`);
      } catch (err) {
        failed++;
        console.log(`  ❌ Error: ${err.code}`);
      }
    }

    results.push({ notificacion: notif.label, sent, failed });
    // Pausa entre notificaciones para que lleguen separadas y se puedan identificar
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('═══════════════════════════════════════════════════════');
  console.table(results);
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(0);
}

runTest().catch(err => { console.error('Error fatal:', err); process.exit(1); });
