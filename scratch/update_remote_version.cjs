const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

async function updateRemoteVersion() {
  console.log('Writing remote version config to Firebase RTDB node /config/updates...');
  const updatesRef = db.ref('config/updates');
  await updatesRef.set({
    latestVersion: '1.0.0.39',
    apkUrl: 'https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk',
    dmgUrl: 'https://github.com/xsoly1-boop/DJ_VIP/releases/latest',
    releaseNotes: [
      'Reducción del ancho del menú lateral (sidebar) en pantalla de escritorio para optimizar el área útil del panel.',
      'Bordes blancos más nítidos y resplandor de luz optimizado en el skin Crystal.',
      'Efecto cristal translúcido extendido a las pantallas y componentes de carga.'
    ]
  });
  console.log('✅ Remote version config updated successfully to 1.0.0.39!');
  process.exit(0);
}

updateRemoteVersion().catch(err => {
  console.error('❌ Error updating remote version config:', err);
  process.exit(1);
});
