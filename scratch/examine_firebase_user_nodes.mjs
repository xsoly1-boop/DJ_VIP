import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

async function main() {
  const db = admin.database();
  const snap = await db.ref('users').once('value');
  const val = snap.val() || {};

  console.log('--- EXAMINING USER NODES IN RTDB ---');
  for (const uid of Object.keys(val)) {
    const userNode = val[uid] || {};
    const subkeys = Object.keys(userNode);
    console.log(`User: ${uid}`);
    for (const key of subkeys) {
      if (key === 'events') {
        const evs = Object.keys(userNode.events || {});
        console.log(`   - events: [${evs.join(', ')}]`);
        for (const evId of evs) {
          const evData = userNode.events[evId] || {};
          console.log(`      * event ${evId} keys: [${Object.keys(evData).join(', ')}]`);
        }
      } else {
        const dataPreview = typeof userNode[key] === 'object' ? Object.keys(userNode[key]).join(', ') : userNode[key];
        console.log(`   - ${key}: [${dataPreview}]`);
      }
    }
  }
  process.exit(0);
}

main();
