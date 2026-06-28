const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const sa = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

async function applyRules() {
  const rulesPath = path.join(__dirname, '../database.rules.json');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  console.log('Reading rules from:', rulesPath);
  
  console.log('Applying database rules to Firebase...');
  await admin.database().setRules(rulesContent);
  console.log('✅ Database rules applied successfully!');
}

applyRules().then(() => process.exit(0)).catch(err => {
  console.error('❌ Failed to apply rules:', err);
  process.exit(1);
});
