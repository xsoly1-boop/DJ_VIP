const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

const ADMIN_UID = 'WuOSSeOODRfxVnNpEVbc6S259f63';
const NEW_PASSWORD = 'admin2401';

async function updateAdminPassword() {
  console.log(`Updating password for Admin Master (${ADMIN_UID})...`);
  await admin.auth().updateUser(ADMIN_UID, {
    password: NEW_PASSWORD
  });
  console.log('✅ Admin Master password updated successfully.');
}

updateAdminPassword().then(() => process.exit(0)).catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
