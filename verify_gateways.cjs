const fs = require('fs');
const path = require('path');
require('dotenv').config();

const fetch = globalThis.fetch || require('node-fetch');
const admin = require('firebase-admin');

async function testPayPal(clientId, clientSecret, mode) {
  const url = mode === 'live' 
    ? 'https://api-m.paypal.com/v1/oauth2/token' 
    : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    if (response.status === 200) {
      const data = await response.json();
      return { success: true, scope: data.scope };
    } else {
      const errText = await response.text();
      return { success: false, status: response.status, error: errText };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function testMercadoPago(accessToken) {
  const url = 'https://api.mercadopago.com/v1/payment_methods';
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.status === 200) {
      return { success: true };
    } else {
      let errText = '';
      try {
        const errJson = await response.json();
        errText = JSON.stringify(errJson);
      } catch (e) {
        errText = await response.text();
      }
      return { success: false, status: response.status, error: errText };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function runDiagnostics() {
  console.log('\n🔍 INICIANDO DIAGNÓSTICO DE PASARELAS DE PAGO...');
  console.log('==================================================');

  let config = {};

  // 1. Intentar cargar desde Firebase si hay credenciales reales
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
    } catch(e) {}
  } else if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = require(serviceAccountPath);
    } catch(e) {}
  }

  const isRealFirebase = serviceAccount && serviceAccount.project_id !== 'djvip-local';

  if (isRealFirebase) {
    console.log(`📡 Conectando a Firebase para obtener la configuración online (Proyecto: ${serviceAccount.project_id})...`);
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
      });
      const snapshot = await admin.database().ref('config/payment_gateways').once('value');
      config = snapshot.val() || {};
      console.log('✅ Configuración online cargada con éxito desde Firebase Database.');
    } catch (e) {
      console.log(`⚠️ No se pudo conectar a Firebase: ${e.message}. Usando .env como fallback.`);
    }
  } else {
    console.log('ℹ️ No se detectaron credenciales de administrador de Firebase locales. Usando variables de .env...');
  }

  // Fallback a variables de .env
  const paypalClientId = config.paypalClientId || process.env.PAYPAL_CLIENT_ID;
  const paypalClientSecret = config.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET;
  const paypalMode = config.paypalMode || 'sandbox';

  const mpAccessToken = config.mercadopagoAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;
  const mpPublicKey = config.mercadopagoPublicKey || process.env.MERCADOPAGO_PUBLIC_KEY;

  console.log('\n--- 💳 TEST DE PAYPAL ---');
  if (!paypalClientId || paypalClientId === 'YOUR_PAYPAL_CLIENT_ID' || paypalClientId === '') {
    console.log('❌ PayPal no está configurado (Cliente ID vacío o placeholder).');
  } else {
    console.log(`Modo detectado: ${paypalMode.toUpperCase()}`);
    console.log(`Client ID: ${paypalClientId.substring(0, 8)}...`);
    console.log('Enviando solicitud de prueba a PayPal...');
    const result = await testPayPal(paypalClientId, paypalClientSecret, paypalMode);
    if (result.success) {
      console.log('✅ ¡CONEXIÓN EXITOSA CON PAYPAL!');
      console.log(`   Scope autorizado: ${result.scope}`);
    } else {
      console.log(`❌ ERROR DE CONEXIÓN CON PAYPAL (Código HTTP ${result.status || 'Conexión Fallida'}):`);
      console.log(`   Detalle: ${result.error}`);
    }
  }

  console.log('\n--- 💳 TEST DE MERCADO PAGO ---');
  if (!mpAccessToken || mpAccessToken === 'YOUR_MERCADOPAGO_ACCESS_TOKEN' || mpAccessToken === '') {
    console.log('❌ Mercado Pago no está configurado (Access Token vacío o placeholder).');
  } else {
    console.log(`Access Token: ${mpAccessToken.substring(0, 15)}...`);
    console.log('Enviando solicitud de prueba a Mercado Pago...');
    const result = await testMercadoPago(mpAccessToken);
    if (result.success) {
      console.log('✅ ¡CONEXIÓN EXITOSA CON MERCADO PAGO!');
      console.log('   Credenciales válidas y autorizadas.');
    } else {
      console.log(`❌ ERROR DE CONEXIÓN CON MERCADO PAGO (Código HTTP ${result.status || 'Conexión Fallida'}):`);
      console.log(`   Detalle: ${result.error}`);
    }
  }

  console.log('\n==================================================');
  console.log('🏁 DIAGNÓSTICO COMPLETADO.\n');
  
  if (isRealFirebase && admin.apps.length) {
    admin.app().delete();
  }
}

runDiagnostics();
