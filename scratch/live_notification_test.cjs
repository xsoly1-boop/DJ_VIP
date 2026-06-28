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

const ADMIN_UID = 'WuOSSeOODRfxVnNpEVbc6S259f63';

async function runLiveTest() {
  console.log('\n=== TEST EN VIVO COMPLETO ===\n');

  // 1. Obtener tokens del admin en tiempo real desde la DB
  console.log(`[1] Leyendo tokens de users/${ADMIN_UID}/devices en Firebase...`);
  const snap = await db.ref(`users/${ADMIN_UID}/devices`).once('value');
  
  if (!snap.exists()) {
    console.error('❌ No hay dispositivos registrados para el Admin Master en la DB.');
    console.log('   Esto explica por qué no llegan notificaciones desde el servidor.');
    process.exit(1);
  }

  const devices = snap.val();
  console.log(`   Dispositivos encontrados: ${Object.keys(devices).length}`);
  
  const validTokens = [];
  Object.entries(devices).forEach(([id, device]) => {
    console.log(`   - ${id}: token=${device.fcmToken?.slice(0,30)}... | active=${device.active} | platform=${device.platform}`);
    if (device && device.fcmToken && device.platform === 'android' && device.active !== false) {
      validTokens.push(device.fcmToken);
    }
  });
  
  console.log(`\n[2] Tokens válidos encontrados: ${validTokens.length}`);
  
  if (validTokens.length === 0) {
    console.error('❌ No hay tokens válidos. El admin debe iniciar sesión en la app.');
    process.exit(1);
  }

  // 2. Enviar notificación de prueba visible a cada token
  console.log('\n[3] Enviando notificación de prueba VISIBLE (alta prioridad)...');
  
  for (const token of validTokens) {
    if (token.startsWith('desktop_') || token.startsWith('test_')) {
      console.log(`   ⏭️  Saltando token simulado: ${token.slice(0,30)}`);
      continue;
    }
    
    try {
      const messageId = await messaging.send({
        token,
        notification: {
          title: '🧪 Test en Vivo desde Servidor',
          body: `Notificación enviada directamente desde el backend - ${new Date().toLocaleTimeString()}`
        },
        data: {
          notification_type: 'test',
          timestamp: String(Date.now())
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'djvip_song_requests',
            icon: 'ic_notification'
          }
        }
      });
      console.log(`   ✅ ENVIADO CON ÉXITO | Message ID: ${messageId}`);
      console.log(`      Token: ${token.slice(0,40)}...`);
    } catch (err) {
      console.error(`   ❌ ERROR: ${err.code} - ${err.message}`);
      console.log(`      Token: ${token.slice(0,40)}...`);
    }
  }

  console.log('\n=== FIN DEL TEST ===\n');
  process.exit(0);
}

runLiveTest().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
