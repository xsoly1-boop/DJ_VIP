const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

async function checkUsers() {
  console.log('Listing Firebase Auth users:');
  const listUsersResult = await admin.auth().listUsers(10);
  listUsersResult.users.forEach((userRecord) => {
    console.log({
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      disabled: userRecord.disabled
    });
  });
}

checkUsers().catch(console.error);
