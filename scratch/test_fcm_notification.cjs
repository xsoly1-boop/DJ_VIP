const admin = require('firebase-admin');
const path = require('path');

// Cargar la cuenta de servicio
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function runTest() {
  const targetEmail = 'xsoly.1@gmail.com';
  console.log(`\n🔍 Buscando usuario con email: ${targetEmail}...`);
  
  // 1. Buscar en la base de datos de usuarios
  const usersSnap = await db.ref('users').once('value');
  if (!usersSnap.exists()) {
    console.log('❌ Error: No se encontraron usuarios en la base de datos.');
    process.exit(1);
  }
  
  const users = usersSnap.val();
  let foundUid = null;
  let foundUser = null;
  
  for (const [uid, user] of Object.entries(users)) {
    if (user && user.profile && user.profile.email && user.profile.email.toLowerCase() === targetEmail.toLowerCase()) {
      foundUid = uid;
      foundUser = user;
      break;
    }
  }
  
  if (!foundUid) {
    console.log(`⚠️ Advertencia: No se encontró el usuario ${targetEmail} en users/ de Realtime Database.`);
    
    // Buscar en Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(targetEmail);
      foundUid = userRecord.uid;
      console.log(`✅ Usuario encontrado en Firebase Auth con UID: ${foundUid}`);
    } catch (err) {
      console.error('❌ Error: El usuario no existe en Firebase Auth tampoco:', err.message);
      process.exit(1);
    }
  } else {
    console.log(`✅ Usuario encontrado en Realtime Database con UID: ${foundUid}`);
  }
  
  // Verificar si tiene dispositivos registrados
  console.log('\n📱 Verificando dispositivos y tokens de notificación registrados...');
  const devicesSnap = await db.ref(`users/${foundUid}/devices`).once('value');
  if (!devicesSnap.exists()) {
    console.log(`\n⚠️  ATENCIÓN: El usuario con email ${targetEmail} no tiene ningún dispositivo (fcmToken) registrado en la base de datos.`);
    console.log('   Para solucionarlo, debes:');
    console.log('   1. Instalar la nueva versión del APK en tu celular Android.');
    console.log('   2. Abrir la app e iniciar sesión con la cuenta xsoly.1@gmail.com.');
    console.log('   3. Conceder los permisos de notificaciones emergentes cuando la app los solicite.');
    console.log('   4. (La app registrará el token automáticamente al iniciar sesión).');
    process.exit(0);
  } else {
    const devices = devicesSnap.val();
    console.log('   Dispositivos encontrados en la base de datos:');
    Object.entries(devices).forEach(([deviceId, device]) => {
      console.log(`     - Plataforma: ${device.platform} | Activo: ${device.active} | Último registro: ${new Date(device.updatedAt).toLocaleString()}`);
      console.log(`       Token (primeros caracteres): ${device.fcmToken ? device.fcmToken.substring(0, 20) + '...' : 'Ninguno'}`);
    });
  }
  
  // 2. Enviar notificación de prueba de petición de canción
  console.log('\n🚀 Enviando notificación push en segundo plano de prueba...');
  const fcmSender = require('../scripts/fcm-sender.cjs');
  try {
    const result = await fcmSender.sendSongRequestNotification(
      foundUid, 
      'Prueba de Segundo Plano 🚀', 
      'Soporte Antigravity'
    );
    console.log('   Envío procesado.');
    console.log('\n🎉 ¡Notificación de prueba enviada con éxito a través del SDK de Firebase!');
    console.log('   Revisa la barra de estado de tu celular Android.');
  } catch (err) {
    console.error('❌ Error al enviar la notificación push:', err.message);
  }
  
  process.exit(0);
}

runTest();
