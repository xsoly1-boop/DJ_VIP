const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

const STEAM_UID = 'EB1irGfMGNXNTB7khTCpsEB1y2s1';
const NEW_EMAIL = 'miyagisteam@gmail.com';
const OLD_EMAIL = 'miyagisteam@gmail.ccom';

async function runCorrection() {
  console.log(`\nStarting correction for Steam account (UID: ${STEAM_UID})...`);

  // 1. Update in Firebase Auth
  console.log(`1. Updating email in Firebase Auth to: ${NEW_EMAIL}...`);
  await admin.auth().updateUser(STEAM_UID, {
    email: NEW_EMAIL,
    emailVerified: false // Reset email verification status since email changed
  });
  console.log('✅ Firebase Auth updated successfully.');

  // 2. Update in Firebase Realtime Database
  console.log('2. Updating email in Firebase Database profile...');
  await admin.database().ref(`users/${STEAM_UID}/profile`).update({
    email: NEW_EMAIL
  });
  console.log('✅ Firebase Database profile updated successfully.');

  // 3. Confirm details
  const updatedUser = await admin.auth().getUser(STEAM_UID);
  const updatedSnap = await admin.database().ref(`users/${STEAM_UID}/profile`).once('value');
  const updatedProfile = updatedSnap.val();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 CONFIRMACIÓN DE ACTUALIZACIÓN');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Auth Email:', updatedUser.email);
  console.log('Database Profile Email:', updatedProfile.email);
  console.log('═══════════════════════════════════════════════════════\n');
}

runCorrection().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error during correction:', err);
  process.exit(1);
});
