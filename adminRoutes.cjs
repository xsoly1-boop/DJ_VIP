// adminRoutes.cjs – admin API routes for user management (CommonJS)
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Fallback de seguridad para el secret de administrador master en desarrollo y producción
if (!process.env.VITE_ADMIN_MASTER_SECRET) {
  process.env.VITE_ADMIN_MASTER_SECRET = 'supersecret123';
}

// Initialize Firebase Admin SDK
let firebaseInitError = null;
const admin = require('firebase-admin');
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
      });
    } else {
      const serviceAccount = require('./serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
      });
    }
  } catch (e) {
    console.error('Firebase admin initialization failed: ', e);
    firebaseInitError = e;
  }
}

// MOCK HELPERS FOR LOCAL DEVELOPMENT (runs offline if firebase account cert fails)
const isFirebaseInitialized = admin.apps.length > 0;

const getDbRef = (refPath) => {
  if (isFirebaseInitialized) {
    return admin.database().ref(refPath);
  }
  
  const mockDbPath = path.join(__dirname, 'scratch/mock_backend_db.json');
  
  const readDb = () => {
    try {
      if (fs.existsSync(mockDbPath)) {
        return JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      }
    } catch (e) {}
    return {};
  };
  
  const writeDb = (data) => {
    try {
      const dir = path.dirname(mockDbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
  };

  return {
    set: async (value) => {
      const db = readDb();
      const parts = refPath.split('/').filter(Boolean);
      let current = db;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      writeDb(db);
    },
    update: async (updates) => {
      const db = readDb();
      const parts = refPath.split('/').filter(Boolean);
      let current = db;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      const lastPart = parts[parts.length - 1];
      current[lastPart] = { ...(current[lastPart] || {}), ...updates };
      writeDb(db);
    },
    once: async (type) => {
      const db = readDb();
      const parts = refPath.split('/').filter(Boolean);
      let current = db;
      for (let i = 0; i < parts.length; i++) {
        if (!current) break;
        current = current[parts[i]];
      }
      return {
        exists: () => current !== undefined && current !== null,
        val: () => current,
        forEach: (callback) => {
          if (current && typeof current === 'object') {
            Object.entries(current).forEach(([key, val]) => {
              callback({
                key,
                val: () => val
              });
            });
          }
        }
      };
    },
    remove: async () => {
      const db = readDb();
      const parts = refPath.split('/').filter(Boolean);
      let current = db;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current) break;
        current = current[parts[i]];
      }
      if (current) {
        delete current[parts[parts.length - 1]];
      }
      writeDb(db);
    }
  };
};

const getFirestoreMock = () => {
  if (isFirebaseInitialized) {
    return admin.firestore();
  }
  
  const mockFsPath = path.join(__dirname, 'scratch/mock_firestore.json');
  
  const readFs = () => {
    try {
      if (fs.existsSync(mockFsPath)) {
        return JSON.parse(fs.readFileSync(mockFsPath, 'utf8'));
      }
    } catch (e) {}
    return { subscriptions: {}, users: {} };
  };
  
  const writeFs = (data) => {
    try {
      const dir = path.dirname(mockFsPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(mockFsPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
  };
  
  return {
    collection: (colName) => {
      return {
        get: async () => {
          const db = readFs();
          const col = db[colName] || {};
          const docs = Object.entries(col).map(([id, data]) => ({
            id,
            data: () => data
          }));
          return {
            forEach: (callback) => docs.forEach(callback)
          };
        },
        doc: (docId) => {
          return {
            update: async (updates) => {
              const db = readFs();
              if (!db[colName]) db[colName] = {};
              db[colName][docId] = { ...(db[colName][docId] || {}), ...updates };
              writeFs(db);
            },
            delete: async () => {
              const db = readFs();
              if (db[colName]) {
                delete db[colName][docId];
              }
              writeFs(db);
            },
            get: async () => {
              const db = readFs();
              const doc = db[colName]?.[docId];
              return {
                exists: doc !== undefined,
                data: () => doc
              };
            }
          };
        }
      };
    }
  };
};

const deleteUserMock = async (uid) => {
  if (isFirebaseInitialized) {
    return admin.auth().deleteUser(uid);
  }
  console.log(`Mock mode: deleted auth user ${uid}`);
};

/**
 * Delete a user account and associated Firestore data.
 * Expected payload: { uid: string, secret: string }
 */
router.post('/deleteUser', async (req, res) => {
  const { uid, secret } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  if (!uid) {
    return res.status(400).json({ success: false, error: 'Missing uid' });
  }
  if (!isFirebaseInitialized && process.env.VERCEL) {
    return res.status(500).json({ 
      success: false, 
      error: `El backend en Vercel no está conectado a Firebase (falta configurar o corregir la variable FIREBASE_SERVICE_ACCOUNT en el dashboard de Vercel). Detalle del error: ${firebaseInitError ? firebaseInitError.message : 'No se detectó la variable de entorno o no se pudo cargar.'}` 
    });
  }
  try {
    // Delete Auth user (tolerante a si el usuario no existe en Firebase Auth)
    try {
      await deleteUserMock(uid);
    } catch (authErr) {
      console.warn(`Auth user ${uid} not found or already deleted from Firebase Auth:`, authErr.message);
    }
    // Delete Firestore user document (if exists)
    try {
      const db = getFirestoreMock();
      await db.collection('users').doc(uid).delete();
    } catch (fsErr) {
      console.warn(`Could not delete user ${uid} from Firestore (might be disabled):`, fsErr.message);
    }
    
    // Delete Realtime Database nodes
    await getDbRef(`users/${uid}`).remove();
    await getDbRef(`events_registry/default-event-${uid}`).remove();

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Subscription Management Endpoints

// List all subscriptions
router.post('/listSubscriptions', async (req, res) => {
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  const { secret } = req.body;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  try {
    const db = getFirestoreMock();
    const snapshot = await db.collection('subscriptions').get();
    const subs = [];
    snapshot.forEach(doc => subs.push({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, subscriptions: subs });
  } catch (e) {
    console.error('Error listing subscriptions', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Update a subscription document in the 'subscriptions' collection
router.post('/updateSubscription', async (req, res) => {
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  const { secret, subscriptionId, updates } = req.body;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  if (!subscriptionId || !updates) {
    return res.status(400).json({ success: false, error: 'Missing subscriptionId or updates' });
  }
  try {
    const db = getFirestoreMock();
    const docRef = db.collection('subscriptions').doc(subscriptionId);
    const docSnap = await docRef.get();
    let uid = null;
    if (docSnap && docSnap.exists) {
      const data = docSnap.data();
      uid = data ? (data.uid || data.userId) : null;
    }
    if (!uid) {
      uid = subscriptionId;
    }

    await docRef.update(updates);

    // Propagate plan updates to Realtime Database users/${uid}/profile
    const newPlan = updates.plan || updates.type || updates.selectedPlan;
    if (uid && newPlan) {
      let duration = 30;
      let durationUnit = 'days';
      try {
        const plansSnap = await getDbRef('config/plans').once('value');
        if (plansSnap.exists()) {
          const plans = plansSnap.val();
          const planDetails = plans[newPlan];
          if (planDetails) {
            duration = parseInt(planDetails.duration, 10) || 30;
            durationUnit = planDetails.durationUnit || 'days';
          }
        }
      } catch (e) {
        console.warn("Could not load plan duration from DB:", e);
      }

      let msToAdd = 0;
      if (newPlan !== 'free') {
        if (durationUnit === 'hours' || durationUnit === 'horas') {
          msToAdd = duration * 60 * 60 * 1000;
        } else if (durationUnit === 'days' || durationUnit === 'días') {
          msToAdd = duration * 24 * 60 * 60 * 1000;
        } else if (durationUnit === 'months' || durationUnit === 'meses') {
          msToAdd = duration * 30 * 24 * 60 * 60 * 1000;
        } else {
          msToAdd = duration * 24 * 60 * 60 * 1000;
        }
      }
      const activatedAt = newPlan === 'free' ? 0 : Date.now();
      const expiresAt = msToAdd > 0 ? (activatedAt + msToAdd) : 0;

      const rtdbUpdates = {
        subscriptionStatus: newPlan,
        activePlan: newPlan,
        selectedPlan: newPlan,
        activatedAt,
        expiresAt
      };

      if (newPlan === 'free') {
        rtdbUpdates.paymentRejectedReason = null;
        rtdbUpdates.transactionId = null;
        rtdbUpdates.gateway = null;
        rtdbUpdates.submittedAt = null;
      }

      await getDbRef(`users/${uid}/profile`).update(rtdbUpdates);
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Error updating subscription', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Delete a subscription
router.post('/deleteSubscription', async (req, res) => {
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  const { secret, subscriptionId } = req.body;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  if (!subscriptionId) {
    return res.status(400).json({ success: false, error: 'Missing subscriptionId' });
  }
  try {
    const db = getFirestoreMock();
    const docRef = db.collection('subscriptions').doc(subscriptionId);
    const docSnap = await docRef.get();
    let uid = null;
    if (docSnap && docSnap.exists) {
      const data = docSnap.data();
      uid = data ? (data.uid || data.userId) : null;
    }
    if (!uid) {
      uid = subscriptionId;
    }

    await docRef.delete();

    // Reset user to free plan in RTDB
    if (uid) {
      await getDbRef(`users/${uid}/profile`).update({
        subscriptionStatus: 'free',
        activePlan: 'free',
        selectedPlan: 'free',
        activatedAt: 0,
        expiresAt: 0,
        paymentRejectedReason: null,
        transactionId: null,
        gateway: null,
        submittedAt: null
      });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting subscription', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Update user subscription status
router.post('/updateUserSubscriptionStatus', async (req, res) => {
  const { uid, secret, status } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  if (!uid || !status) {
    return res.status(400).json({ success: false, error: 'Missing uid or status' });
  }
  try {
    const db = getFirestoreMock();

    if (status === 'bonus') {
      const profileSnap = await getDbRef(`users/${uid}/profile`).once('value');
      if (!profileSnap.exists()) {
        return res.status(404).json({ success: false, error: 'User profile not found' });
      }
      const profile = profileSnap.val();
      const currentActivePlan = profile.activePlan || 'free';
      const addedRequests = currentActivePlan === 'free' ? 15 : (currentActivePlan === 'premium' ? 20 : 0);
      const currentExtra = profile.extraRequests ? parseInt(profile.extraRequests, 10) : 0;
      
      const newExtra = currentExtra + addedRequests;
      const extraExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      await db.collection('users').doc(uid).update({ subscriptionStatus: currentActivePlan });
      await getDbRef(`users/${uid}/profile`).update({
        subscriptionStatus: currentActivePlan,
        extraRequests: newExtra,
        extraRequestsExpiresAt: extraExpiresAt,
        paymentRejectedReason: null,
        transactionId: null,
        gateway: null,
        submittedAt: null
      });
      return res.json({ success: true });
    }

    await db.collection('users').doc(uid).update({ subscriptionStatus: status });

    // Also update Realtime Database profile
    let duration = 30;
    let durationUnit = 'days';
    try {
      const plansSnap = await getDbRef('config/plans').once('value');
      if (plansSnap.exists()) {
        const plans = plansSnap.val();
        const planDetails = plans[status];
        if (planDetails) {
          duration = parseInt(planDetails.duration, 10) || 30;
          durationUnit = planDetails.durationUnit || 'days';
        }
      }
    } catch (e) {
      console.warn("Could not load plan duration from DB:", e);
    }

    let msToAdd = 0;
    if (status !== 'free') {
      if (durationUnit === 'hours' || durationUnit === 'horas') {
        msToAdd = duration * 60 * 60 * 1000;
      } else if (durationUnit === 'days' || durationUnit === 'días') {
        msToAdd = duration * 24 * 60 * 60 * 1000;
      } else if (durationUnit === 'months' || durationUnit === 'meses') {
        msToAdd = duration * 30 * 24 * 60 * 60 * 1000;
      } else {
        msToAdd = duration * 24 * 60 * 60 * 1000;
      }
    }

    const activatedAt = status === 'free' ? 0 : Date.now();
    const expiresAt = msToAdd > 0 ? (activatedAt + msToAdd) : 0;

    const rtdbUpdates = {
      subscriptionStatus: status,
      activePlan: status,
      selectedPlan: status,
      activatedAt,
      expiresAt
    };

    if (status === 'free') {
      rtdbUpdates.paymentRejectedReason = null;
      rtdbUpdates.transactionId = null;
      rtdbUpdates.gateway = null;
      rtdbUpdates.submittedAt = null;
    }

    await getDbRef(`users/${uid}/profile`).update(rtdbUpdates);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/getUserSubscription', async (req, res) => {
  const { uid, secret } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  try {
    const db = getFirestoreMock();
    const doc = await db.collection('users').doc(uid).get();
    return res.json({ success: true, subscriptionStatus: doc.data()?.subscriptionStatus });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Configuración de Pasarelas de Pago Dinámicas (PayPal / Mercado Pago)
router.post('/savePaymentConfig', async (req, res) => {
  const { secret, config } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  if (!config) {
    return res.status(400).json({ success: false, error: 'Missing config' });
  }
  try {
    const db = getDbRef('config/payment_gateways');
    await db.set(config);
    
    // Guardar copia de campos públicos accesibles por los DJs
    const publicDb = getDbRef('config/public_payment_info');
    await publicDb.set({
      paypalClientId: config.paypalClientId || '',
      mercadopagoPublicKey: config.mercadopagoPublicKey || '',
      adminClabe: config.adminClabe || ''
    });

    return res.json({ success: true });
  } catch (e) {
    console.error('Error saving payment config', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/getPaymentConfig', async (req, res) => {
  const { secret } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  try {
    const db = getDbRef('config/payment_gateways');
    const snapshot = await db.once('value');
    return res.json({ success: true, config: snapshot.val() || {} });
  } catch (e) {
    console.error('Error getting payment config', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Listar suscripciones pendientes de validación
router.post('/listPendingSubscriptions', async (req, res) => {
  const { secret } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  try {
    const db = getDbRef('pending_subscriptions');
    const snapshot = await db.once('value');
    const list = [];
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        list.push({ uid: child.key, ...child.val() });
      });
    }
    return res.json({ success: true, pendingSubscriptions: list });
  } catch (e) {
    console.error('Error listing pending subscriptions', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Aprobar una suscripción pendiente
router.post('/approveSubscription', async (req, res) => {
  const { secret, uid, plan } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  if (!uid || !plan) {
    return res.status(400).json({ success: false, error: 'Missing uid or plan' });
  }
  try {
    if (plan === 'bonus') {
      const profileSnap = await getDbRef(`users/${uid}/profile`).once('value');
      if (!profileSnap.exists()) {
        return res.status(404).json({ success: false, error: 'User profile not found' });
      }
      const profile = profileSnap.val();
      const currentActivePlan = profile.activePlan || 'free';
      const addedRequests = currentActivePlan === 'free' ? 15 : (currentActivePlan === 'premium' ? 20 : 0);
      const currentExtra = profile.extraRequests ? parseInt(profile.extraRequests, 10) : 0;
      
      const newExtra = currentExtra + addedRequests;
      const extraExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      await getDbRef(`users/${uid}/profile`).update({
        subscriptionStatus: currentActivePlan,
        extraRequests: newExtra,
        extraRequestsExpiresAt: extraExpiresAt,
        paymentRejectedReason: null,
        transactionId: null,
        gateway: null,
        submittedAt: null
      });

      // Remove from pending validation list
      await getDbRef(`pending_subscriptions/${uid}`).remove();

      return res.json({ success: true });
    }

    let duration = 30; // fallback duration: 30
    let durationUnit = 'days'; // fallback unit: days
    try {
      const plansSnap = await getDbRef('config/plans').once('value');
      if (plansSnap.exists()) {
        const plans = plansSnap.val();
        const planDetails = plans[plan];
        if (planDetails) {
          duration = parseInt(planDetails.duration, 10) || 30;
          durationUnit = planDetails.durationUnit || 'days';
        }
      }
    } catch (e) {
      console.warn("Could not load plan duration from DB, using fallback 30 days:", e);
    }
    
    let msToAdd = 0;
    if (durationUnit === 'hours' || durationUnit === 'horas') {
      msToAdd = duration * 60 * 60 * 1000;
    } else if (durationUnit === 'days' || durationUnit === 'días') {
      msToAdd = duration * 24 * 60 * 60 * 1000;
    } else if (durationUnit === 'months' || durationUnit === 'meses') {
      msToAdd = duration * 30 * 24 * 60 * 60 * 1000; // approximation of 30 days
    } else {
      msToAdd = duration * 24 * 60 * 60 * 1000;
    }
    
    const activatedAt = Date.now();
    const expiresAt = activatedAt + msToAdd;

    // 1. Actualizar el perfil del usuario a activo con el plan seleccionado y expiración
    await getDbRef(`users/${uid}/profile`).update({
      subscriptionStatus: plan,
      activePlan: plan,
      activatedAt,
      expiresAt
    });
    
    // 2. Eliminar de la lista de pendientes
    await getDbRef(`pending_subscriptions/${uid}`).remove();
    
    return res.json({ success: true });
  } catch (e) {
    console.error('Error approving subscription', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Rechazar una suscripción pendiente
router.post('/rejectSubscription', async (req, res) => {
  const { secret, uid } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  if (!uid) {
    return res.status(400).json({ success: false, error: 'Missing uid' });
  }
  try {
    // 1. Regresar al usuario a estado de pago pendiente
    await getDbRef(`users/${uid}/profile`).update({
      subscriptionStatus: 'pending_payment',
      paymentRejectedReason: 'El comprobante fue rechazado por el administrador. Por favor reintente o contacte a soporte.'
    });
    
    // 2. Eliminar de la lista de pendientes
    await getDbRef(`pending_subscriptions/${uid}`).remove();
    
    return res.json({ success: true });
  } catch (e) {
    console.error('Error rejecting subscription', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
