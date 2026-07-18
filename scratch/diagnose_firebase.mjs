// ============================================================
// Diagnóstico: Cuántos usuarios y qué datos hay en Firebase
// ============================================================
import admin from 'firebase-admin';
import { createRequire } from 'module';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);

// Cargar service account
const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

async function diagnose() {
  console.log('\n📊 DIAGNÓSTICO DE DATOS EN FIREBASE\n');
  console.log('═'.repeat(50));

  // 1. Usuarios en Firebase Auth
  console.log('\n🔐 Firebase Auth — Usuarios registrados:');
  let allUsers = [];
  let nextPageToken;
  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    allUsers = allUsers.concat(result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`   Total: ${allUsers.length} usuarios`);
  allUsers.forEach((u, i) => {
    console.log(`   [${i+1}] ${u.email || '(sin email)'} | UID: ${u.uid} | Creado: ${new Date(u.metadata.creationTime).toLocaleDateString('es-MX')}`);
  });

  // 2. Datos en Realtime Database
  console.log('\n📦 Firebase Realtime Database — Perfiles:');
  const db = admin.database();
  const usersSnap = await db.ref('users').once('value');
  const usersData = usersSnap.val() || {};
  const uids = Object.keys(usersData);

  console.log(`   Total UIDs con datos: ${uids.length}`);

  let withProfile = 0, withSubs = 0, withRequests = 0;
  uids.forEach(uid => {
    const node = usersData[uid];
    if (node.profile) {
      withProfile++;
      const p = node.profile;
      const plan = p.activePlan || p.subscriptionStatus || 'free';
      const name = p.displayName || p.email || uid;
      console.log(`   - ${name.substring(0,30).padEnd(30)} | Plan: ${plan.padEnd(12)} | Exp: ${p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('es-MX') : 'N/A'}`);
      if (p.activePlan && p.activePlan !== 'free') withSubs++;
    }
    if (node.requests) withRequests++;
  });

  console.log(`\n   Con perfil: ${withProfile}`);
  console.log(`   Con plan activo (no free): ${withSubs}`);
  console.log(`   Con peticiones guardadas: ${withRequests}`);

  // 3. Config
  console.log('\n⚙️  Firebase Config:');
  const configSnap = await db.ref('config').once('value');
  const config = configSnap.val() || {};
  const configKeys = Object.keys(config);
  console.log(`   Claves de configuración: ${configKeys.join(', ')}`);

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Diagnóstico completo.');
  console.log('\n🔑 DATOS SEGUROS — Firebase NO fue modificado.');
  console.log('   Podemos migrar todo a Supabase cuando quieras.\n');

  process.exit(0);
}

diagnose().catch(e => { console.error('Error:', e.message); process.exit(1); });
