// scripts/reset_db.cjs – Script to safely reset the platform database
// Goals:
// - Reset all users' subscription plans to 'free' (except admin master)
// - Reset platform finances (delete pending validations, clear transaction IDs)
// - Reset Top Global requested song counts
// - Clear event queues, histories, votes, support chats, and suggestions
// - Preserves registered users and accounts
// - Handles both production Firebase and local mock databases (mock_backend_db.json / mock_firestore.json)

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MASTER_ADMIN_EMAIL = 'dj@admin.com';
const MASTER_ADMIN_UID = 'uid-admin-master';

// Initialize Firebase Admin SDK
let admin = null;
let isFirebaseInitialized = false;

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
      });
      isFirebaseInitialized = true;
    } else if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
      });
      isFirebaseInitialized = true;
    }
  } else {
    isFirebaseInitialized = true;
  }
} catch (e) {
  console.warn('⚠️ No se pudieron inicializar las credenciales de Firebase en la nube. Corriendo en MODO MOCK LOCAL.');
}

// Main execution function
async function main() {
  console.log('\n==================================================================');
  console.log('🔄 INICIANDO SCRIPT DE RESTABLECIMIENTO DE BASE DE DATOS');
  console.log('==================================================================');
  
  if (isFirebaseInitialized) {
    console.log('📡 Modo: CONEXIÓN EN LA NUBE (Firebase Realtime Database & Firestore)');
    await resetCloudDatabase();
  } else {
    console.log('💻 Modo: SIMULACIÓN LOCAL (Archivos mock_backend_db.json & mock_firestore.json)');
    await resetMockDatabase();
  }
  
  console.log('\n==================================================================');
  console.log('🏁 RESTABLECIMIENTO COMPLETADO CON ÉXITO.');
  console.log('==================================================================\n');
  process.exit(0);
}

// Real Firebase reset logic
async function resetCloudDatabase() {
  const db = admin.database();
  const firestore = admin.firestore();

  // --- 1. RESTABLECER USUARIOS Y PLANES (RTDB) ---
  console.log('\n1. Restableciendo planes y perfiles de usuarios en Realtime Database...');
  const usersSnap = await db.ref('users').once('value');
  if (usersSnap.exists()) {
    const users = usersSnap.val();
    for (const uid of Object.keys(users)) {
      const profile = users[uid].profile || {};
      const email = profile.email || '';
      
      const isAdmin = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || uid === MASTER_ADMIN_UID;
      
      if (isAdmin) {
        console.log(`   👑 Preservando plan PRO del Admin Master (${email})`);
        await db.ref(`users/${uid}/profile`).update({
          subscriptionStatus: 'pro',
          activePlan: 'pro',
          selectedPlan: 'pro',
          expiresAt: 0,
          activatedAt: Date.now(),
          extraRequests: 0,
          extraRequestsExpiresAt: 0,
          gateway: null,
          transactionId: null,
          submittedAt: null,
          paymentRejectedReason: null
        });
      } else {
        console.log(`   👤 Restableciendo plan a DEMO (free) para el usuario: ${email || uid}`);
        await db.ref(`users/${uid}/profile`).update({
          subscriptionStatus: 'free',
          activePlan: 'free',
          selectedPlan: 'free',
          expiresAt: 0,
          activatedAt: 0,
          extraRequests: 0,
          extraRequestsExpiresAt: 0,
          gateway: null,
          transactionId: null,
          submittedAt: null,
          paymentRejectedReason: null
        });
      }

      // --- Limpiar colas de reproducción, historial y votos de eventos ---
      // Mantener solo el default-event, vaciar sus peticiones
      const events = users[uid].events || {};
      for (const eventId of Object.keys(events)) {
        if (eventId !== 'default-event') {
          // Eliminar evento customizado
          await db.ref(`users/${uid}/events/${eventId}`).remove();
        } else {
          // Limpiar peticiones en el evento predeterminado
          await db.ref(`users/${uid}/events/default-event/requests`).remove();
          await db.ref(`users/${uid}/events/default-event/played_requests`).remove();
        }
      }

      // Limpiar índice de eventos (mantener solo default-event)
      await db.ref(`users/${uid}/events_index`).set({
        'default-event': {
          title: 'Evento Demo',
          djName: profile.djName || profile.displayName || 'DJ',
          createdAt: Date.now()
        }
      });

      // Eliminar colas secundarias de peticiones, votos e historial antiguos
      await db.ref(`users/${uid}/queue`).remove();
      await db.ref(`users/${uid}/history`).remove();
      await db.ref(`users/${uid}/votes`).remove();
    }
  }

  // --- 2. RESTABLECER EN EVENTOS REGISTRY ---
  console.log('\n2. Limpiando registro global de eventos...');
  const registrySnap = await db.ref('events_registry').once('value');
  if (registrySnap.exists()) {
    const registry = registrySnap.val();
    for (const slug of Object.keys(registry)) {
      if (!slug.startsWith('default-event-')) {
        await db.ref(`events_registry/${slug}`).remove();
      }
    }
  }

  // --- 3. RESTABLECER TOP GLOBAL (AUTOCOMPLETE) ---
  console.log('\n3. Restableciendo votos globales de canciones (Melodías más pedidas)...');
  const autocompleteSnap = await db.ref('autocomplete_songs').once('value');
  if (autocompleteSnap.exists()) {
    const songs = autocompleteSnap.val();
    for (const songId of Object.keys(songs)) {
      await db.ref(`autocomplete_songs/${songId}/globalRequests`).set(0);
    }
  }

  // --- 4. RESTABLECER FINANZAS (SUSCRIPCIONES PENDIENTES) ---
  console.log('\n4. Restableciendo finanzas e ingresos a cero...');
  await db.ref('pending_subscriptions').remove();

  // --- 5. LIMPIAR SOPORTE Y RETROALIMENTACIÓN ---
  console.log('\n5. Limpiando chats de soporte y sugerencias de retroalimentación...');
  await db.ref('support_chats').remove();
  await db.ref('suggestions').remove();

  // --- 6. RESTABLECER FIRESTORE ---
  console.log('\n6. Restableciendo estados de suscripción en Cloud Firestore...');
  try {
    const usersCol = await firestore.collection('users').get();
    for (const doc of usersCol.docs) {
      const data = doc.data();
      const email = data.email || '';
      
      const isAdmin = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || doc.id === MASTER_ADMIN_UID;
      
      if (isAdmin) {
        await firestore.collection('users').doc(doc.id).update({
          subscriptionStatus: 'pro'
        });
      } else {
        await firestore.collection('users').doc(doc.id).update({
          subscriptionStatus: 'free'
        });
      }
    }
    console.log('   ✅ Colección de Firestore restablecida.');
  } catch (err) {
    console.error('   ❌ Error al actualizar Firestore (verifique si la API de Firestore está habilitada):', err.message);
  }
}

// Local mock database reset logic
async function resetMockDatabase() {
  const mockDbPath = path.join(__dirname, '../scratch/mock_backend_db.json');
  const mockFsPath = path.join(__dirname, '../scratch/mock_firestore.json');

  // --- 1. PROCESAR RTDB MOCK ---
  if (fs.existsSync(mockDbPath)) {
    console.log('\n1. Restableciendo mock_backend_db.json...');
    const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
    
    // Restablecer usuarios y colas
    if (db.users) {
      for (const uid of Object.keys(db.users)) {
        const profile = db.users[uid].profile || {};
        const email = profile.email || '';
        
        const isAdmin = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || uid === MASTER_ADMIN_UID;
        
        if (isAdmin) {
          db.users[uid].profile = {
            ...profile,
            subscriptionStatus: 'pro',
            activePlan: 'pro',
            selectedPlan: 'pro',
            expiresAt: 0,
            extraRequests: 0,
            extraRequestsExpiresAt: 0,
            gateway: null,
            transactionId: null,
            submittedAt: null,
            paymentRejectedReason: null
          };
        } else {
          db.users[uid].profile = {
            ...profile,
            subscriptionStatus: 'free',
            activePlan: 'free',
            selectedPlan: 'free',
            expiresAt: 0,
            activatedAt: 0,
            extraRequests: 0,
            extraRequestsExpiresAt: 0,
            gateway: null,
            transactionId: null,
            submittedAt: null,
            paymentRejectedReason: null
          };
        }

        // Limpiar eventos custom
        if (db.users[uid].events) {
          const cleanEvents = {};
          if (db.users[uid].events['default-event']) {
            cleanEvents['default-event'] = {
              settings: db.users[uid].events['default-event'].settings || {}
            };
          }
          db.users[uid].events = cleanEvents;
        }

        // Limpiar eventos_index
        db.users[uid].events_index = {
          'default-event': {
            title: 'Evento Demo',
            djName: profile.djName || profile.displayName || 'DJ',
            createdAt: Date.now()
          }
        };

        // Borrar colas, historial y votos
        delete db.users[uid].queue;
        delete db.users[uid].history;
        delete db.users[uid].votes;
      }
    }

    // Limpiar registro global de eventos
    if (db.events_registry) {
      const cleanRegistry = {};
      for (const slug of Object.keys(db.events_registry)) {
        if (slug.startsWith('default-event-')) {
          cleanRegistry[slug] = db.events_registry[slug];
        }
      }
      db.events_registry = cleanRegistry;
    }

    // Reset Autocomplete Song votes
    if (db.autocomplete_songs) {
      for (const songId of Object.keys(db.autocomplete_songs)) {
        if (db.autocomplete_songs[songId]) {
          db.autocomplete_songs[songId].globalRequests = 0;
        }
      }
    }

    // Borrar finanzas, chats y sugerencias
    delete db.pending_subscriptions;
    delete db.support_chats;
    delete db.suggestions;

    fs.writeFileSync(mockDbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('   ✅ mock_backend_db.json restablecido.');
  } else {
    console.log('   ℹ️ No se encontró mock_backend_db.json.');
  }

  // --- 2. PROCESAR FIRESTORE MOCK ---
  if (fs.existsSync(mockFsPath)) {
    console.log('\n2. Restableciendo mock_firestore.json...');
    const fsData = JSON.parse(fs.readFileSync(mockFsPath, 'utf8'));

    if (fsData.users) {
      for (const uid of Object.keys(fsData.users)) {
        const user = fsData.users[uid] || {};
        const email = user.email || '';
        
        const isAdmin = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || uid === MASTER_ADMIN_UID;
        
        if (isAdmin) {
          fsData.users[uid].subscriptionStatus = 'pro';
        } else {
          fsData.users[uid].subscriptionStatus = 'free';
        }
      }
    }

    fs.writeFileSync(mockFsPath, JSON.stringify(fsData, null, 2), 'utf8');
    console.log('   ✅ mock_firestore.json restablecido.');
  } else {
    console.log('   ℹ️ No se encontró mock_firestore.json.');
  }
}

// Execute script
main().catch(err => {
  console.error('\n❌ ERROR EN LA EJECUCIÓN DEL SCRIPT:', err);
  process.exit(1);
});
