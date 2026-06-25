// paymentService.js – abstraction over PayPal and MercadoPago SDKs
const paypal = require('@paypal/checkout-server-sdk');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const admin = require('firebase-admin');

const DEFAULT_PLANS = {
  free: { name: 'Plan Demo', price: 0, currency: 'MXN' },
  premium: { name: 'Plan Premium', price: 100, currency: 'MXN' },
  vip: { name: 'Plan VIP', price: 200, currency: 'MXN' },
  pro: { name: 'Plan PRO', price: 400, currency: 'MXN' },
  bonus: { name: 'Plan Bonus (Extra)', price: 50, currency: 'MXN' },
  eventual: { name: 'Eventual', price: 50, currency: 'MXN' }
};

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
    if (admin.apps.length === 0) {
      try {
        const fs = require('fs');
        const path = require('path');
        const mockDbPath = path.join(__dirname, 'scratch/mock_backend_db.json');
        if (fs.existsSync(mockDbPath)) {
          const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
          activePlan = db.users?.[uid]?.profile?.activePlan || db.users?.[uid]?.profile?.subscriptionStatus || 'free';
        }
      } catch (e) {}
    } else {
      try {
        const snapshot = await admin.database().ref(`users/${uid}/profile`).once('value');
        if (snapshot.exists()) {
          activePlan = snapshot.val().activePlan || snapshot.val().subscriptionStatus || 'free';
        }
      } catch (e) {
        console.error('Error fetching active plan in createSubscription:', e);
      }
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
        'https://dj-vip.vercel.app'
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
            success: `${redirectUrl}/`,
            failure: `${redirectUrl}/`,
            pending: `${redirectUrl}/`
          },
          auto_return: 'approved',
          external_reference: planId
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

module.exports = { createSubscription, updateSubscription, cancelSubscription };
