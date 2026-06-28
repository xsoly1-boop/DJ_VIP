const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

const NEW_PASSWORD = 'abby2401';
const USERS_TO_UPDATE = [
  { name: 'Steam', uid: 'EB1irGfMGNXNTB7khTCpsEB1y2s1', email: 'miyagisteam@gmail.com' },
  { name: 'anifilms', uid: 'nYiPomzgMoezQ6WvifJzwEvCU8y1', email: 'anifilms@gmail.com' },
  { name: 'xsoly', uid: 'q7vXbTQnQqM7kbvOKT09jsDN2p42', email: 'xsoly.1@gmail.com' }
];

async function updatePasswords() {
  console.log('\nStarting password updates for targeted users...');
  for (const user of USERS_TO_UPDATE) {
    try {
      console.log(`Updating password for ${user.name} (${user.email})...`);
      await admin.auth().updateUser(user.uid, {
        password: NEW_PASSWORD
      });
      console.log(`✅ Success for ${user.name}`);
    } catch (err) {
      console.error(`❌ Failed to update ${user.name}:`, err.message);
    }
  }
  console.log('\nAll updates complete.');
}

updatePasswords().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
