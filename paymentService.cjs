// paymentService.cjs – abstraction over PayPal and MercadoPago SDKs (CommonJS)
const paypal = require('@paypal/checkout-server-sdk');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const admin = require('firebase-admin');

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const USE_SUPABASE = !!supabaseUrl && !!supabaseServiceKey;
const supabase = USE_SUPABASE ? createClient(supabaseUrl, supabaseServiceKey) : null;

const DEFAULT_PLANS = {
  free: { name: 'Plan Demo', price: 0, currency: 'MXN' },
  premium: { name: 'Plan Premium', price: 100, currency: 'MXN' },
  vip: { name: 'Plan VIP', price: 200, currency: 'MXN' },
  pro: { name: 'Plan PRO', price: 450, currency: 'MXN' },
  pro_1d: { name: 'Plan Pro x 1 Día', price: 0, currency: 'MXN' },
  bonus: { name: 'Plan Bonus (Extra)', price: 50, currency: 'MXN' },
  eventual: { name: 'Eventual', price: 50, currency: 'MXN' }
};

// Helper to fetch DJ profile details from Supabase or Firebase
async function fetchUserProfile(uid) {
  if (USE_SUPABASE) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      if (error) {
        console.error(`[Supabase] Error fetching profile for user ${uid}:`, error);
        return null;
      }
      return {
        activePlan: data.active_plan,
        subscriptionStatus: data.subscription_status,
        extraRequests: data.extra_requests,
        extraRequestsExpiresAt: data.extra_requests_expires_at,
        demoLimit: data.demo_limit,
        premiumLimit: data.premium_limit,
        strictLimitEnabled: data.strict_limit_enabled
      };
    } catch (e) {
      console.error(`[Supabase] Exception in fetchUserProfile for ${uid}:`, e);
      return null;
    }
  } else {
    if (admin.apps.length > 0) {
      try {
        const snapshot = await admin.database().ref(`users/${uid}/profile`).once('value');
        return snapshot.exists() ? snapshot.val() : null;
      } catch (e) {
        console.error('Error fetching active plan from Firebase:', e);
        return null;
      }
    }
  }
  return null;
}

// Helper to save profile updates to Supabase or Firebase
async function saveProfileUpdates(uid, updates) {
  if (USE_SUPABASE) {
    try {
      const supabaseUpdates = {};
      if (updates.subscriptionStatus !== undefined) supabaseUpdates.subscription_status = updates.subscriptionStatus;
      if (updates.activePlan !== undefined) supabaseUpdates.active_plan = updates.activePlan;
      if (updates.expiresAt !== undefined) supabaseUpdates.expires_at = updates.expiresAt ? new Date(updates.expiresAt).toISOString() : null;
      if (updates.extraRequests !== undefined) supabaseUpdates.extra_requests = updates.extraRequests;
      if (updates.extraRequestsExpiresAt !== undefined) supabaseUpdates.extra_requests_expires_at = updates.extraRequestsExpiresAt;
      if (updates.strictLimitEnabled !== undefined) supabaseUpdates.strict_limit_enabled = updates.strictLimitEnabled;
      if (updates.revenue !== undefined) supabaseUpdates.revenue = updates.revenue;
      if (updates.logoUrl !== undefined) supabaseUpdates.logo_url = updates.logoUrl;
      
      const { error } = await supabase
        .from('profiles')
        .update(supabaseUpdates)
        .eq('id', uid);
      
      if (error) {
        console.error(`[Supabase] Error saving profile updates for ${uid}:`, error);
        throw error;
      }
      console.log(`[Supabase] Successfully updated profile for user ${uid}`);
    } catch (e) {
      console.error(`[Supabase] Exception in saveProfileUpdates for ${uid}:`, e);
      throw e;
    }
  } else {
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      await db.collection('users').doc(uid).update({ subscriptionStatus: updates.subscriptionStatus || updates.activePlan });
      await admin.database().ref(`users/${uid}/profile`).update(updates);
    }
  }
}

// Helper to fetch dynamic plan details
async function getPlanDetails(planId) {
  if (admin.apps.length === 0) {
    try {
      const fs = require('fs');
      const path = require('path');
      const mockDbPath = path.join(__dirname, 'scratch/mock_backend_db.json');
      if (fs.existsSync(mockDbPath)) {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        return db.config?.plans?.[planId] || null;
      }
    } catch (e) {}
    return null;
  }
  
  try {
    const snapshot = await admin.database().ref(`config/plans/${planId}`).once('value');
    return snapshot.val() || null;
  } catch (e) {
    console.error(`Error fetching dynamic plan details for ${planId}`, e);
    return null;
  }
}

// Helper to fetch gateways config dynamically from database or local fallback
async function getPaymentConfig() {
  if (admin.apps.length === 0) {
    try {
      const fs = require('fs');
      const path = require('path');
      const mockDbPath = path.join(__dirname, 'scratch/mock_backend_db.json');
      if (fs.existsSync(mockDbPath)) {
        const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
        return db.config?.payment_gateways || {};
      }
    } catch (e) {}
    return {};
  }
  
  try {
    const snapshot = await admin.database().ref('config/payment_gateways').once('value');
    return snapshot.val() || {};
  } catch (e) {
    console.error('Error fetching dynamic payment config', e);
    return {};
  }
}

// Helper to create a subscription (choose provider based on paymentMethod)
async function createSubscription({ userId, planId, paymentMethod, uid }) {
  const config = await getPaymentConfig();

  // Resolve user active plan dynamically to customize the bonus addon
  let activePlan = 'free';
  if (uid) {
    const profile = await fetchUserProfile(uid);
    if (profile) {
      activePlan = profile.activePlan || profile.subscriptionStatus || 'free';
    }
  }

  let planDetails = await getPlanDetails(planId);
  let planName = planDetails?.name || `Plan ${planId.toUpperCase()}`;
  let planDesc = planDetails?.description || DEFAULT_PLANS[planId]?.description || '';

  if (planId === 'bonus') {
    if (activePlan === 'premium') {
      planName = "Peticiones Extra (+20 Peticiones)";
      planDesc = "Agrega 20 peticiones adicionales a tu Plan Premium durante 30 días.";
    } else {
      planName = "Peticiones Extra (+15 Peticiones)";
      planDesc = "Agrega 15 peticiones adicionales a tu Plan Demo durante 30 días.";
    }
  }

  if (paymentMethod === 'paypal') {
    const clientId = config.paypalClientId || process.env.PAYPAL_CLIENT_ID;
    const clientSecret = config.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET;
    const mode = config.paypalMode || 'sandbox';

    if (!clientId || clientId === 'YOUR_PAYPAL_CLIENT_ID') {
      // Offline mock fallback if no credentials set
      return { id: 'PAYPAL-MOCK-SUB-' + Date.now(), status: 'APPROVAL_PENDING' };
    }

    const paypalEnv = mode === 'live'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

    const request = new paypal.subscriptions.SubscriptionsCreateRequest();
    request.requestBody({
      plan_id: planId,
      subscriber: { name: { given_name: 'User', surname: 'Demo' }, email_address: `${userId}@example.com` },
      application_context: { brand_name: 'DJ a la Carta', locale: 'es-AR', shipping_preference: 'NO_SHIPPING' }
    });
    const response = await paypalClient.execute(request);
    return response.result;
  } else if (paymentMethod === 'mercadopago') {
    const accessToken = config.mercadopagoAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken || accessToken === 'YOUR_MERCADOPAGO_ACCESS_TOKEN') {
      // Offline mock fallback if no credentials set
      return { id: 'MP-MOCK-SUB-' + Date.now(), init_point: 'http://localhost:5173' };
    }

    try {
      const client = new MercadoPagoConfig({
        accessToken: accessToken
      });
      const preferenceClient = new Preference(client);

      const price = parseFloat(planDetails?.price || DEFAULT_PLANS[planId]?.price || 0);
      const currency = planDetails?.currency || DEFAULT_PLANS[planId]?.currency || 'MXN';

      const redirectUrl = (
        process.env.PUBLIC_URL ||
        process.env.VITE_PUBLIC_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        'https://dj-vip.onrender.com'
      ).replace(/\/$/, '');


      const preference = {
        body: {
          items: [
            {
              title: planName,
              description: planDesc,
              quantity: 1,
              unit_price: price,
              currency_id: currency
            }
          ],
          payer: {
            email: `${userId}@example.com`
          },
          back_urls: {
            success: `${redirectUrl}/?payment_status=success`,
            failure: `${redirectUrl}/?payment_status=failure`,
            pending: `${redirectUrl}/?payment_status=pending`
          },
          auto_return: 'approved',
          external_reference: uid ? `${uid}:${planId}` : planId,
          notification_url: `${redirectUrl}/api/payments/notification`
        }
      };

      const response = await preferenceClient.create(preference);
      return { id: response.id, init_point: response.init_point };
    } catch (e) {
      console.error('MercadoPago preference creation error:', e);
      throw e;
    }
  } else {
    throw new Error('Unsupported payment method');
  }
}

async function updateSubscription({ subscriptionId, newPlanId }) {
  return { subscriptionId, newPlanId, status: 'updated' };
}

async function cancelSubscription({ subscriptionId }) {
  return { subscriptionId, status: 'cancelled' };
}

const fs = require('fs');
const path = require('path');

const isFirebaseInitialized = () => admin.apps.length > 0;

const getDbRef = (refPath) => {
  if (isFirebaseInitialized()) {
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
        val: () => current
      };
    }
  };
};

const getFirestoreMock = () => {
  if (isFirebaseInitialized()) {
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

const { Payment } = require('mercadopago');

async function handleNotification(payload, query) {
  const config = await getPaymentConfig();
  const accessToken = config.mercadopagoAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

  // Extract payment ID
  let paymentId = null;
  if (payload && payload.data && payload.data.id) {
    paymentId = payload.data.id;
  } else if (query && query.id && query.topic === 'payment') {
    paymentId = query.id;
  } else if (payload && payload.id && payload.type === 'payment') {
    paymentId = payload.id;
  }

  if (!paymentId) {
    console.log('[Webhook/IPN] No payment ID found in payload or query.');
    return { success: false, error: 'No payment ID found' };
  }

  console.log(`[Webhook/IPN] Processing notification for payment ID: ${paymentId}`);

  // Fetch payment from Mercado Pago to verify
  let paymentInfo = null;
  if (!accessToken || accessToken === 'YOUR_MERCADOPAGO_ACCESS_TOKEN') {
    // Simulated offline/sandbox mode when no token is present
    console.log('[Webhook/IPN] No real Mercado Pago access token configured. Simulating approved payment.');
    paymentInfo = {
      status: payload.status || 'approved',
      status_detail: payload.status_detail || 'accredited',
      external_reference: payload.external_reference || 'mock_uid:premium',
      transaction_amount: 100
    };
  } else {
    try {
      const client = new MercadoPagoConfig({ accessToken });
      const paymentClient = new Payment(client);
      paymentInfo = await paymentClient.get({ id: paymentId });
    } catch (e) {
      console.error(`[Webhook/IPN] Error fetching payment info from Mercado Pago for ${paymentId}:`, e.message);
      return { success: false, error: e.message };
    }
  }

  if (!paymentInfo) {
    return { success: false, error: 'Payment details could not be retrieved' };
  }

  const { status, status_detail, external_reference } = paymentInfo;
  console.log(`[Webhook/IPN] Payment ${paymentId} status: ${status} (${status_detail}), ref: ${external_reference}`);

  if (!external_reference || !external_reference.includes(':')) {
    console.log('[Webhook/IPN] Payment has no external_reference in format uid:planId. Skipping DB update.');
    return { success: true, message: 'Skipped - no user mapping' };
  }

  const [uid, planId] = external_reference.split(':');

  const db = getFirestoreMock();

  if (status === 'approved') {
    // Process successful payment / activation
    if (planId === 'bonus') {
      const profile = await fetchUserProfile(uid);
      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }
      const currentActivePlan = profile.activePlan || 'free';
      const addedRequests = currentActivePlan === 'free' ? 15 : (currentActivePlan === 'premium' ? 20 : 0);
      const currentExtra = profile.extraRequests ? parseInt(profile.extraRequests, 10) : 0;
      
      const newExtra = currentExtra + addedRequests;
      const extraExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      await saveProfileUpdates(uid, {
        subscriptionStatus: currentActivePlan,
        activePlan: currentActivePlan,
        extraRequests: newExtra,
        extraRequestsExpiresAt: extraExpiresAt
      });
      console.log(`[Webhook/IPN] Successfully added ${addedRequests} bonus requests to user ${uid}`);
      return { success: true, status: 'approved', planId };
    }

    // Normal plan activation — calculate duration
    let duration = 30;
    let durationUnit = 'days';
    if (planId === 'pro_1d') {
      duration = 24;
      durationUnit = 'hours';
    } else {
      const planDetails = await getPlanDetails(planId);
      if (planDetails) {
        duration = parseInt(planDetails.duration, 10) || 30;
        durationUnit = planDetails.durationUnit || 'days';
      }
    }

    let msToAdd = 0;
    if (durationUnit === 'hours' || durationUnit === 'horas') {
      msToAdd = duration * 60 * 60 * 1000;
    } else if (durationUnit === 'days' || durationUnit === 'días') {
      msToAdd = duration * 24 * 60 * 60 * 1000;
    } else if (durationUnit === 'months' || durationUnit === 'meses') {
      msToAdd = duration * 30 * 24 * 60 * 60 * 1000;
    } else {
      msToAdd = duration * 24 * 60 * 60 * 1000;
    }

    const activatedAt = Date.now();
    const expiresAt = activatedAt + msToAdd;

    const profileUpdates = {
      subscriptionStatus: planId,
      activePlan: planId,
      expiresAt
    };

    if (planId === 'pro_1d') {
      const existingProfile = await fetchUserProfile(uid);
      profileUpdates.previousActivePlan = existingProfile?.activePlan || 'free';
    }

    await saveProfileUpdates(uid, profileUpdates);
    console.log(`[Webhook/IPN] Successfully activated plan ${planId} for user ${uid}`);
    return { success: true, status: 'approved', planId };

  } else if (status === 'rejected' || status === 'cancelled') {
    // Process rejection / cancellation
    await saveProfileUpdates(uid, {
      subscriptionStatus: 'pending_payment'
    });
    console.log(`[Webhook/IPN] Payment rejected/cancelled for user ${uid}. Updated status.`);
    return { success: true, status, planId };

  } else {
    // Payment is pending/in process/etc.
    await saveProfileUpdates(uid, {
      subscriptionStatus: 'pending_validation'
    });
    console.log(`[Webhook/IPN] Payment status is ${status} for user ${uid}. Set status to pending_validation.`);
    return { success: true, status, planId };
  }
}

module.exports = { createSubscription, updateSubscription, cancelSubscription, handleNotification };
