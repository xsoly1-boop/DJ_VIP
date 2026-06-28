const fcmSender = require('./fcm-sender.cjs');

async function test() {
  console.log('🚀 Probando autenticación del SDK de administración con Firebase...');
  try {
    // Al intentar registrar un token FCM ficticio para el usuario "test-uid",
    // el SDK de Firebase Admin se verá obligado a obtener un token OAuth de Google
    // y conectarse a Realtime Database. Si las credenciales fallan, arrojará
    // el error de JWT o de permisos de inmediato.
    const testUid = 'uid-admin-master';
    const fakeToken = 'test-fake-token-12345';
    
    console.log('📤 Intentando registrar token ficticio...');
    await fcmSender.registerFCMToken(testUid, fakeToken, 'android');
    console.log('✅ ¡Éxito! Las credenciales de Firebase Admin SDK son VÁLIDAS.');
    
    // Limpiamos la prueba
    console.log('🧹 Limpiando token ficticio...');
    await fcmSender.unregisterFCMToken(testUid, fakeToken);
    console.log('✅ Limpieza completada.');
    
  } catch (err) {
    console.error('❌ Error de Firebase Admin SDK:', err);
  }
  process.exit(0);
}

test();
