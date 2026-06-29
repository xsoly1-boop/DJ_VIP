// adminRoutes.cjs – admin API routes for user management (CommonJS)
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
try { require('dotenv').config(); } catch (e) {}

// FCM — Notificaciones push en segundo plano
const fcmSender = require('./scripts/fcm-sender.cjs');

// Fallback de seguridad para el secret de administrador master en desarrollo y producción
if (!process.env.VITE_ADMIN_MASTER_SECRET) {
  process.env.VITE_ADMIN_MASTER_SECRET = 'najera2401';
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

// Database Migration for plans configuration
const migratePlansConfig = async () => {
  try {
    const plansRef = getDbRef('config/plans');
    const snapshot = await plansRef.once('value');
    let plans = {};
    let needsUpdate = false;
    
    if (snapshot.exists()) {
      plans = snapshot.val() || {};
    } else {
      // Seed with local default plans if empty
      plans = {
        free: {
          name: "Plan Demo",
          price: "0",
          billing: "6 meses",
          currency: "MXN",
          description: "La puerta de entrada al control de tus eventos. Prueba la potencia de DJVIP y experimenta la interacción en tiempo real con tu público de forma 100% gratuita.",
          maxRequests: 35,
          duration: 6,
          durationUnit: "meses",
          benefits: [
            "Acceso a la plataforma interactiva",
            "Generador de QR estándar para tu cabina",
            "Hasta 35 peticiones de canciones por evento",
            "Cola de peticiones en tiempo real para visualizar solicitudes"
          ],
          restrictions: [
            "Vigencia del plan limitada a 6 meses",
            "Límite estricto de 35 peticiones por evento",
            "Sin personalización visual (Logotipo y marca de DJVIP obligatorios)",
            "Bloqueo de limpieza y reinicio de eventos por 8 horas"
          ]
        },
        premium: {
          name: "Plan Premium",
          price: "100",
          billing: "6 meses",
          currency: "MXN",
          description: "Lleva tus eventos al siguiente nivel con mayores límites y personalización. Ideal para DJs profesionales que quieren destacar su marca personal.",
          maxRequests: 80,
          duration: 6,
          durationUnit: "meses",
          benefits: [
            "Todo lo incluido en el Plan Demo",
            "Hasta 80 peticiones de canciones por evento",
            "Personalización de Marca Blanca (Vincula tu logotipo mediante URL externa)",
            "Acceso a QR personalizado con estilos avanzados",
            "Soporte estándar vía correo electrónico"
          ],
          restrictions: [
            "No permite subir imágenes locales para el logotipo (requiere URL externa)",
            "Bloqueo de limpieza y reinicio de eventos por 8 horas"
          ]
        },
        vip: {
          name: "Plan VIP",
          price: "200",
          billing: "6 meses",
          currency: "MXN",
          description: "La experiencia definitiva de personalización e interacción ilimitada. Diseñado para DJs de élite y eventos masivos que exigen el máximo rendimiento sin límites.",
          maxRequests: 0,
          duration: 6,
          durationUnit: "meses",
          benefits: [
            "Todo lo incluido en el Plan Premium",
            "Peticiones de canciones ILIMITADAS (sin tope por evento)",
            "Marca Blanca Completa (Personalización del nombre, tipografías y tamaños en pantalla)",
            "Descarga de respaldos y listas de reproducción del evento en tiempo real",
            "Soporte prioritario y rápido"
          ],
          restrictions: [
            "La subida directa de logotipo local (Opción A) requiere habilitación de seguridad por el Admin Master"
          ]
        },
        pro: {
          name: "Plan PRO",
          price: "450",
          billing: "12 meses",
          currency: "MXN",
          description: "La herramienta definitiva para productoras de eventos, discotecas y agencias que gestionan múltiples cabinas y DJs en paralelo.",
          maxRequests: 0,
          duration: 12,
          durationUnit: "meses",
          benefits: [
            "Se el primero en recibir y probar todas las novedades y actualizaciones.",
            "Multieventos activos y simultáneos en paralelo",
            "Soporte VIP dedicado con asistencia prioritaria 24/7",
            "Reportes estadísticos y analíticas avanzadas del comportamiento del público",
            "Personalización multi-marca para diferentes DJs"
          ],
          restrictions: [
            "Ninguna"
          ]
        },
        pro_1d: {
          name: "Pro x 1 Día",
          price: "0",
          billing: "24 horas",
          currency: "MXN",
          description: "Prueba el poder total del Plan PRO durante 24 horas. Disfruta de multieventos y todas las herramientas exclusivas sin límites por un día entero.",
          maxRequests: 0,
          duration: 24,
          durationUnit: "horas",
          benefits: [
            "Todos los beneficios del Plan PRO por 24 horas",
            "Multieventos activos y simultáneos en paralelo",
            "Soporte VIP dedicado con asistencia prioritaria 24/7",
            "Reportes estadísticos y analíticas avanzadas del comportamiento del público",
            "Personalización de marca al 100% y logotipos ilimitados"
          ],
          restrictions: [
            "Vigencia estricta de 24 horas",
            "Disponible para contratar solo una vez por usuario"
          ]
        },
        bonus: {
          name: "Plan Bonus (Extra)",
          price: "50",
          billing: "30 días",
          currency: "MXN",
          description: "El potenciador ideal para tus eventos especiales. Añade peticiones adicionales de forma inmediata a tus planes activos sin cambiar de suscripción.",
          maxRequests: 0,
          duration: 30,
          durationUnit: "días",
          benefits: [
            "+15 peticiones adicionales por evento para usuarios del Plan Demo",
            "+20 peticiones adicionales por evento para usuarios del Plan Premium",
            "Suma acumulativa e inmediata sobre tus límites actuales",
            "Activación instantánea y vigencia extendida de 30 días naturales"
          ],
          restrictions: [
            "Requiere contar con un Plan Demo o Plan Premium activo en la plataforma"
          ]
        },
        eventual: {
          name: "Eventual",
          price: "50",
          billing: "24 horas",
          currency: "MXN",
          description: "Poder ilimitado por un día. Perfecto para DJs invitados, festivals o eventos corporativos de una sola jornada que requieren máxima capacidad temporal.",
          maxRequests: 0,
          duration: 24,
          durationUnit: "horas",
          benefits: [
            "Acceso ilimitado a todas las herramientas VIP por 24 horas",
            "Peticiones de canciones ilimitadas durante el evento",
            "Acceso a QR personalizado y personalización visual básica",
            "Activación exprés sin contratos a largo plazo"
          ],
          restrictions: [
            "El acceso expira automáticamente transcurridas 24 horas desde la activación"
          ]
        }
      };
      needsUpdate = true;
    }

    // Check individual values
    if (plans.pro && plans.pro.price !== "450") {
      plans.pro.price = "450";
      needsUpdate = true;
    }
    if (plans.pro_1d && plans.pro_1d.price !== "0") {
      plans.pro_1d.price = "0";
      needsUpdate = true;
    }
    if (plans.free) {
      if (plans.free.billing !== "6 meses") {
        plans.free.billing = "6 meses";
        needsUpdate = true;
      }
      if (plans.free.duration !== 6) {
        plans.free.duration = 6;
        needsUpdate = true;
      }
      if (plans.free.durationUnit !== "meses") {
        plans.free.durationUnit = "meses";
        needsUpdate = true;
      }
      if (!plans.free.restrictions) {
        plans.free.restrictions = [];
      }
      const index = plans.free.restrictions.indexOf("Vigencia del plan limitada a 6 meses");
      if (index === -1) {
        plans.free.restrictions.unshift("Vigencia del plan limitada a 6 meses");
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await plansRef.set(plans);
      console.log('✅ [Migration] Database plan configurations updated/seeded successfully.');
    } else {
      console.log('✅ [Migration] Database plan configurations are up-to-date.');
    }
  } catch (err) {
    console.error('❌ [Migration] Error during plans database migration:', err);
  }
};
migratePlansConfig();

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
        activePlan: currentActivePlan,
        selectedPlan: currentActivePlan,
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
    const profileSnap = await getDbRef(`users/${uid}/profile`).once('value');
    const profile = profileSnap.exists() ? profileSnap.val() : {};

    let duration = 30;
    let durationUnit = 'days';
    if (status === 'pro_1d') {
      duration = 24;
      durationUnit = 'hours';
    } else {
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

    if (status === 'pro_1d') {
      rtdbUpdates.previousActivePlan = profile.activePlan || 'free';
      rtdbUpdates.pro1dUsed = true;
    }

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
      adminClabe: config.adminClabe || '',
      paypalEnabled: config.paypalEnabled !== false,
      mercadopagoEnabled: config.mercadopagoEnabled !== false,
      transferEnabled: config.transferEnabled !== false
    });

    return res.json({ success: true });
  } catch (e) {
    console.error('Error saving payment config', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Endpoint para obtener la lista de usuarios completa para el Admin Master
router.post('/getUsersData', async (req, res) => {
  const { secret } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  try {
    const db = getDbRef('users');
    const snapshot = await db.once('value');
    return res.json({ success: true, users: snapshot.val() || {} });
  } catch (err) {
    console.error('Error in getUsersData:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint auxiliar para enviar notificaciones SMS (especialmente en desarrollo/modo local)
router.post('/sendNotificationSMS', async (req, res) => {
  const { secret, type, payload } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  // Permitir localhost sin contraseña para simplicidad de desarrollo mock
  if (secret !== adminSecret && req.hostname !== 'localhost' && req.hostname !== '127.0.0.1') {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  try {
    const { sendAdminSMS } = require('./smsService.cjs');
    
    let twilioConfig = {};
    try {
      const twilioSnap = await getDbRef('config/twilio').once('value');
      if (twilioSnap.exists()) {
        twilioConfig = twilioSnap.val() || {};
      }
    } catch (err) {
      console.warn("Could not load twilio config from DB:", err);
    }

    let message = '';
    if (type === 'pending_subscription') {
      const planName = (payload.selectedPlan || 'premium').toUpperCase();
      const djName = payload.displayName || payload.email || 'DJ';
      message = `🔔 DJVIP: Nueva suscripción pendiente de validación. DJ: ${djName} (Plan: ${planName}). Comprobante: ${payload.transactionId || '—'}`;
    } else if (type === 'support_chat') {
      message = `💬 Soporte PRO: El DJ "${payload.senderName || 'DJ'}" escribió:\n"${payload.text}"`;
    } else if (type === 'suggestion') {
      message = `💡 DJVIP: Nueva sugerencia de "${payload.djName || payload.email || 'DJ'}":\n"${payload.text}"`;
    } else {
      message = payload.message || '';
    }

    if (message) {
      await sendAdminSMS(message, twilioConfig);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error sending SMS notification:', err);
    return res.status(500).json({ success: false, error: err.message });
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

// Restablecer a cero las finanzas / ingresos de la plataforma
router.post('/resetRevenue', async (req, res) => {
  const { secret } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  try {
    const currentTimestamp = Date.now();
    // Guardar marca de tiempo del reset en la configuración general
    await getDbRef('config/revenueResetTimestamp').set(currentTimestamp);

    // Eliminar todas las suscripciones pendientes de validación
    await getDbRef('pending_subscriptions').remove();

    return res.json({ success: true, message: 'Finances reset successfully', timestamp: currentTimestamp });
  } catch (e) {
    console.error('Error resetting revenue data', e);
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

    // 🔔 FCM — Notificar a admins si hay suscripciones pendientes nuevas
    if (list.length > 0) {
      const latest = list[list.length - 1];
      fcmSender.sendSubscriptionPendingNotification(
        latest.username || latest.uid || 'Un DJ',
        latest.plan || latest.planId || 'Plan',
        latest.uid || ''
      ).catch(err => console.error('[FCM] Error notif subscription_pending:', err.message));
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
        activePlan: currentActivePlan,
        selectedPlan: currentActivePlan,
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
    if (plan === 'pro_1d') {
      duration = 24;
      durationUnit = 'hours';
    } else {
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
    const profileSnap = await getDbRef(`users/${uid}/profile`).once('value');
    const profile = profileSnap.exists() ? profileSnap.val() : {};

    const rtdbUpdates = {
      subscriptionStatus: plan,
      activePlan: plan,
      activatedAt,
      expiresAt
    };

    if (plan === 'pro_1d') {
      rtdbUpdates.previousActivePlan = profile.activePlan || 'free';
      rtdbUpdates.pro1dUsed = true;
    }

    await getDbRef(`users/${uid}/profile`).update(rtdbUpdates);
    
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

let serverStartTime = Date.now();

function setupSmsListeners() {
  if (!isFirebaseInitialized) {
    console.log('⚠️ SMS/FCM Listeners skipped: Firebase Admin SDK not initialized.');
    return;
  }
  console.log('📡 Configurando SMS y FCM Listeners en Firebase Realtime Database...');
  
  // 1. Nuevas suscripciones pendientes
  admin.database().ref('pending_subscriptions').on('child_added', async (snapshot) => {
    const sub = snapshot.val();
    if (sub && sub.submittedAt && sub.submittedAt > serverStartTime) {
      const planName = (sub.selectedPlan || 'premium').toUpperCase();
      const djName = sub.displayName || sub.email || 'DJ';
      const djUid = sub.uid || snapshot.key;
      
      let twilioConfig = {};
      try {
        const twilioSnap = await admin.database().ref('config/twilio').once('value');
        if (twilioSnap.exists()) {
          twilioConfig = twilioSnap.val() || {};
        }
      } catch (e) {
        console.error("Error reading twilio config in pending_subscriptions listener:", e);
      }

      // SMS Twilio
      const { sendAdminSMS } = require('./smsService.cjs');
      const msg = `🔔 DJVIP: Nueva suscripción pendiente de validación. DJ: ${djName} (Plan: ${planName}). Comprobante: ${sub.transactionId || '—'}`;
      sendAdminSMS(msg, twilioConfig).catch(console.error);

      // 🔔 FCM Push - Deshabilitado en el listener para evitar duplicación (ya se envía vía la API REST POST /submitSubscriptionRequest)
      /* console.log(`[DB Listener] ✅ Suscripción pendiente detectada en DB → DJ: ${djName}`);
      fcmSender.sendSubscriptionPendingNotification(djName, planName, djUid)
        .catch(err => console.error('[FCM DB Listener] Error en notif subscription_pending:', err.message)); */
    }
  });
  
  // 2. Chat de Soporte PRO (mensajes de usuarios)
  admin.database().ref('support_chats').on('child_added', (chatSnap) => {
    const userUid = chatSnap.key;
    chatSnap.ref.child('messages').on('child_added', async (msgSnap) => {
      const msg = msgSnap.val();
      if (msg && msg.senderId !== 'uid-admin-master' && msg.timestamp && msg.timestamp > serverStartTime) {
        let twilioConfig = {};
        try {
          const twilioSnap = await admin.database().ref('config/twilio').once('value');
          if (twilioSnap.exists()) {
            twilioConfig = twilioSnap.val() || {};
          }
        } catch (e) {
          console.error("Error reading twilio config in support_chats listener:", e);
        }

        // SMS Twilio
        const { sendAdminSMS } = require('./smsService.cjs');
        const body = `💬 Soporte PRO: El DJ "${msg.senderName || 'DJ'}" escribió: "${msg.text}"`;
        sendAdminSMS(body, twilioConfig).catch(console.error);

        // 🔔 FCM Push - Deshabilitado en el listener para evitar duplicación (ya se envía vía la API REST POST /sendSupportMessage)
        /* console.log(`[DB Listener] 💬 Soporte PRO detectado en DB → De: ${msg.senderName || 'DJ'}`);
        fcmSender.sendSupportMessageNotification(msg.senderName || 'Un DJ', msg.text, userUid)
          .catch(err => console.error('[FCM DB Listener] Error en notif support_message:', err.message)); */
      }
    });
  });
  
  // 3. Sugerencias / Retroalimentación
  admin.database().ref('suggestions').on('child_added', (userSnap) => {
    userSnap.ref.on('child_added', async (sugSnap) => {
      const sug = sugSnap.val();
      if (sug && sug.submittedAt && sug.submittedAt > serverStartTime) {
        let twilioConfig = {};
        try {
          const twilioSnap = await admin.database().ref('config/twilio').once('value');
          if (twilioSnap.exists()) {
            twilioConfig = twilioSnap.val() || {};
          }
        } catch (e) {
          console.error("Error reading twilio config in suggestions listener:", e);
        }

        const { sendAdminSMS } = require('./smsService.cjs');
        const body = `💡 DJVIP: Nueva sugerencia de "${sug.djName || sug.email || 'DJ'}": "${sug.text}"`;
        sendAdminSMS(body, twilioConfig).catch(console.error);
      }
    });
  });

  // 4. Nuevo usuario registrado y 5. Peticiones de canciones del público
  const notifiedNewUsers = new Set();
  admin.database().ref('users').on('child_added', (userSnap) => {
    const uid = userSnap.key;

    // 4. Perfil del nuevo usuario (nuevo registro)
    userSnap.ref.child('profile').on('value', async (profileSnap) => {
      const profile = profileSnap.val();
      if (profile && profile.createdAt && profile.createdAt > serverStartTime && profile.email !== 'dj@admin.com' && !notifiedNewUsers.has(uid)) {
        notifiedNewUsers.add(uid);
        
        let twilioConfig = {};
        try {
          const twilioSnap = await admin.database().ref('config/twilio').once('value');
          if (twilioSnap.exists()) {
            twilioConfig = twilioSnap.val() || {};
          }
        } catch (e) {
          console.error("Error reading twilio config in new user listener:", e);
        }

        // SMS Twilio
        const { sendAdminSMS } = require('./smsService.cjs');
        const body = `🎧 DJVIP: Nuevo DJ registrado: "${profile.displayName || 'DJ'}" (${profile.email})`;
        sendAdminSMS(body, twilioConfig).catch(console.error);

        // 🔔 FCM Push - Deshabilitado en el listener para evitar duplicación (ya se envía vía la API REST POST /notifyNewUser)
        /* console.log(`[DB Listener] 👤 Nuevo DJ registrado detectado en DB → Nombre: ${profile.displayName || 'DJ'}`);
        fcmSender.sendNewUserNotification(profile.displayName || profile.email, profile.email, uid)
          .catch(err => console.error('[FCM DB Listener] Error en notif new_user_registered:', err.message)); */
      }
    });

    // 5. Peticiones de canciones para este DJ en todos sus eventos activos
    // Deshabilitado en el listener para evitar duplicación (ya se envía vía la API REST POST /api/song-request en FirebaseContext / server.cjs)
    /* userSnap.ref.child('events').on('child_added', (eventSnap) => {
      eventSnap.ref.child('requests').on('child_added', async (requestSnap) => {
        const reqData = requestSnap.val();
        if (reqData && reqData.timestamp && reqData.timestamp > serverStartTime) {
          const songTitle = reqData.songName || reqData.title || 'Una canción';
          const requestedBy = reqData.userName || reqData.requestedBy || 'El público';
          
          console.log(`[DB Listener] 🎵 Petición de canción detectada en DB → DJ UID: ${uid} | "${songTitle}" por ${requestedBy}`);
          fcmSender.sendSongRequestNotification(uid, songTitle, requestedBy)
            .catch(err => console.error('[FCM DB Listener] Error en notif song_request:', err.message));
        }
      });
    }); */
  });

  // 5. Verificación de resúmenes periódicos de suscripciones
  const checkSummarySchedule = async () => {
    try {
      const now = Date.now();
      const summaryRef = admin.database().ref('config/summary_notifications');
      const summarySnap = await summaryRef.once('value');
      const val = summarySnap.val() || {};
      
      const lastWeekly = val.last_weekly_sent || 0;
      const lastMonthly = val.last_monthly_sent || 0;
      
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
      
      let updated = false;
      const updates = {};
      
      if (lastWeekly === 0) {
        updates.last_weekly_sent = now;
        updated = true;
      } else if (now - lastWeekly >= ONE_WEEK) {
        await generateAndSendSummary('Semanal');
        updates.last_weekly_sent = now;
        updated = true;
      }
      
      if (lastMonthly === 0) {
        updates.last_monthly_sent = now;
        updated = true;
      } else if (now - lastMonthly >= ONE_MONTH) {
        await generateAndSendSummary('Mensual');
        updates.last_monthly_sent = now;
        updated = true;
      }
      
      if (updated) {
        await summaryRef.update(updates);
      }
    } catch (e) {
      console.error("Error in checkSummarySchedule:", e);
    }
  };

  const generateAndSendSummary = async (type) => {
    try {
      const usersSnap = await admin.database().ref('users').once('value');
      if (!usersSnap.exists()) return;
      const users = usersSnap.val();
      
      let totalDjs = 0;
      let activePaying = 0;
      let totalRevenue = 0;
      const byPlan = { premium: 0, vip: 0, pro: 0, bonus: 0, eventual: 0 };
      
      let plansConfig = {};
      const plansSnap = await admin.database().ref('config/plans').once('value');
      if (plansSnap.exists()) {
        plansConfig = plansSnap.val() || {};
      }
      
      Object.entries(users).forEach(([uid, u]) => {
        if (uid === 'uid-admin-master' || !u || typeof u !== 'object') return;
        const profile = u.profile;
        if (!profile || profile.email === 'dj@admin.com' || profile.email === 'misturyflash@yahoo.com.mx') return;
        
        totalDjs++;
        
        const plan = profile.activePlan;
        let hasPaid = false;
        if (plan && plan !== 'free' && byPlan[plan] !== undefined) {
          byPlan[plan]++;
          const price = parseFloat(plansConfig?.[plan]?.price || 0);
          totalRevenue += price;
          hasPaid = true;
        }
        
        const extraRequests = profile.extraRequests ? parseInt(profile.extraRequests, 10) : 0;
        const extraRequestsExpiresAt = profile.extraRequestsExpiresAt ? parseInt(profile.extraRequestsExpiresAt, 10) : 0;
        if (extraRequests > 0 && extraRequestsExpiresAt >= Date.now()) {
          byPlan.bonus++;
          const bonusPrice = parseFloat(plansConfig?.bonus?.price || 50);
          totalRevenue += bonusPrice;
          hasPaid = true;
        }
        
        if (hasPaid) {
          activePaying++;
        }
      });
      
      let twilioConfig = {};
      try {
        const twilioSnap = await admin.database().ref('config/twilio').once('value');
        if (twilioSnap.exists()) {
          twilioConfig = twilioSnap.val() || {};
        }
      } catch (e) {
        console.error("Error reading twilio config in summary:", e);
      }
      
      const { sendAdminSMS } = require('./smsService.cjs');
      const msg = `📊 DJVIP: Resumen ${type} de Suscripciones. Total DJs: ${totalDjs}. Activos de Pago: ${activePaying}. Desglose: Prem: ${byPlan.premium}, VIP: ${byPlan.vip}, PRO: ${byPlan.pro}, Eventual: ${byPlan.eventual}, Bonus: ${byPlan.bonus}. Recaudado Estimado: $${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN.`;
      
      await sendAdminSMS(msg, twilioConfig);
      console.log(`✅ [Summary] ${type} subscription summary SMS sent successfully.`);
    } catch (e) {
      console.error(`Error generating ${type} summary:`, e);
    }
  };

  // Iniciar resúmenes periódicos
  checkSummarySchedule();
  setInterval(checkSummarySchedule, 3600000);
}

// Iniciar listeners
setupSmsListeners();

// Guardar la configuración de planes desde el panel admin
router.post('/savePlansConfig', async (req, res) => {
  const { secret, newPlansConfig } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (secret !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Invalid admin secret' });
  }
  if (!newPlansConfig) {
    return res.status(400).json({ success: false, error: 'Missing newPlansConfig' });
  }
  try {
    const plansRef = getDbRef('config/plans');
    await plansRef.set(newPlansConfig);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error saving plans config', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Registro de suscripción pendiente (trigger FCM a admins) ──────────────────
// POST /api/admin/submitSubscriptionRequest
// Body: { uid, username, plan, secret }
router.post('/submitSubscriptionRequest', async (req, res) => {
  const { uid, username, plan, secret } = req.body;
  if (!uid || !username || !plan) {
    return res.status(400).json({ success: false, error: 'Missing uid, username, or plan' });
  }
  try {
    // Guardar solicitud en pending_subscriptions usando update para conservar los campos detallados del frontend
    await getDbRef(`pending_subscriptions/${uid}`).update({
      uid,
      username,
      plan,
      submittedAt: Date.now(),
      status: 'pending'
    });

    // 🔔 FCM — Notificar a todos los admins de la nueva suscripción pendiente
    fcmSender.sendSubscriptionPendingNotification(username, plan, uid)
      .catch(err => console.error('[FCM] Error notif subscription_pending:', err.message));

    return res.json({ success: true, message: 'Solicitud enviada al administrador.' });
  } catch (e) {
    console.error('Error en submitSubscriptionRequest:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Mensaje de Soporte PRO (trigger FCM a admins) ──────────────────────────
// POST /api/admin/sendSupportMessage
// Body: { uid, username, message }
router.post('/sendSupportMessage', async (req, res) => {
  const { uid, username, message } = req.body;
  if (!uid || !message) {
    return res.status(400).json({ success: false, error: 'Missing uid or message' });
  }
  try {
    // Guardar mensaje en Realtime Database
    const msgRef = getDbRef(`support_messages/${uid}`);
    await msgRef.push({
      from: username || uid,
      message,
      timestamp: Date.now(),
      read: false
    });

    // 🔔 FCM — Notificar a todos los admins del nuevo mensaje
    fcmSender.sendSupportMessageNotification(username || 'Un DJ', message, uid)
      .catch(err => console.error('[FCM] Error notif support_message:', err.message));

    return res.json({ success: true, message: 'Mensaje de soporte enviado.' });
  } catch (e) {
    console.error('Error en sendSupportMessage:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Nuevo usuario registrado (trigger FCM a admins) ────────────────────────
// POST /api/admin/notifyNewUser
// Body: { uid, username, email }
router.post('/notifyNewUser', async (req, res) => {
  const { uid, username, email } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ success: false, error: 'Missing uid or email' });
  }
  try {
    // 🔔 FCM — Notificar a todos los admins del nuevo registro
    fcmSender.sendNewUserNotification(username || email, email, uid)
      .catch(err => console.error('[FCM] Error notif new_user_registered:', err.message));

    return res.json({ success: true });
  } catch (e) {
    console.error('Error en notifyNewUser:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/registerDevice', async (req, res) => {
  const { uid, deviceId } = req.body;
  const adminSecret = process.env.VITE_ADMIN_MASTER_SECRET;
  if (!uid || !deviceId) {
    return res.status(400).json({ success: false, error: 'Missing uid or deviceId' });
  }
  // Optional secret check can be added if needed
  try {
    const db = admin.database();
    // Check if deviceId already linked to another user
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    let conflictUid = null;
    snapshot.forEach(userSnap => {
      const data = userSnap.val();
      if (data && data.deviceId === deviceId && userSnap.key !== uid) {
        conflictUid = userSnap.key;
      }
    });
    if (conflictUid) {
      return res.status(409).json({ success: false, error: 'DEVICE_ALREADY_REGISTERED' });
    }
    // Save deviceId under the user profile
    await db.ref(`users/${uid}/deviceId`).set(deviceId);
    return res.json({ success: true });
  } catch (e) {
    console.error('Error in /registerDevice:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/notify-update', async (req, res) => {
  const { versionName, releaseNotes } = req.body;
  if (!versionName) {
    return res.status(400).json({ success: false, error: 'Falta el parámetro versionName.' });
  }
  
  try {
    const result = await fcmSender.sendGlobalUpdateNotification(versionName, releaseNotes);
    return res.json({ success: true, result });
  } catch (e) {
    console.error('Error en /notify-update:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

router.getDbRef = getDbRef;
router.getFirestoreMock = getFirestoreMock;

module.exports = router;
