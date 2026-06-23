// paymentService.cjs – abstraction over PayPal and MercadoPago SDKs (CommonJS)
const paypal = require('@paypal/checkout-server-sdk');
const mercadopago = require('mercadopago');
const admin = require('firebase-admin');

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
async function createSubscription({ userId, planId, paymentMethod }) {
  const config = await getPaymentConfig();

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
      if (typeof mercadopago.configure === 'function') {
        mercadopago.configure({
          access_token: accessToken,
        });
      } else {
        mercadopago.config = {
          access_token: accessToken,
        };
      }
    } catch (e) {
      console.warn('MercadoPago configuration error:', e.message);
    }

    const preference = {
      payer_email: `${userId}@example.com`,
      back_url: process.env.VITE_PUBLIC_URL || 'http://localhost:5173',
      external_reference: planId,
    };
    const response = await mercadopago.preferences.create(preference);
    return response.body;
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
