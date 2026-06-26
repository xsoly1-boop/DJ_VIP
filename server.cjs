// server.cjs – minimal Express API for subscription management (CommonJS)
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const paymentService = require('./paymentService.cjs');
const adminRoutes = require('./adminRoutes.cjs');
const fcmSender = require('./scripts/fcm-sender.cjs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Root path status message
app.get('/', (req, res) => {
  res.send('🚀 DJVIP Subscription Backend API is running.');
});

// Endpoint de diagnóstico para verificar el estado de Firebase en Vercel
app.get('/api/firebase-status', async (req, res) => {
  try {
    const admin = require('firebase-admin');
    const initialized = admin.apps.length > 0;
    const hasServiceAccountEnv = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    
    let dbConnection = false;
    let dbError = null;
    
    if (initialized) {
      try {
        // Intentar una lectura rápida de prueba en Realtime Database
        await admin.database().ref('.info/connected').once('value');
        dbConnection = true;
      } catch (err) {
        dbError = err.message;
      }
    }

    res.json({
      success: true,
      firebaseInitialized: initialized,
      hasServiceAccountEnv,
      databaseConnected: dbConnection,
      databaseError: dbError,
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin routes (delete user, etc.)
app.use('/api/admin', adminRoutes);

// ─── Registro de token FCM desde la app Android ──────────────────────────────
// POST /api/register-fcm-token
// Body: { uid, fcmToken, platform }
app.post('/api/register-fcm-token', async (req, res) => {
  try {
    const { uid, fcmToken, platform = 'android' } = req.body;
    if (!uid || !fcmToken) {
      return res.status(400).json({ success: false, error: 'uid y fcmToken son requeridos' });
    }
    await fcmSender.registerFCMToken(uid, fcmToken, platform);
    res.json({ success: true, message: 'Token FCM registrado correctamente' });
  } catch (e) {
    console.error('[API] Error registrando token FCM:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/unregister-fcm-token
// Body: { uid, fcmToken }
app.post('/api/unregister-fcm-token', async (req, res) => {
  try {
    const { uid, fcmToken } = req.body;
    if (!uid || !fcmToken) {
      return res.status(400).json({ success: false, error: 'uid y fcmToken son requeridos' });
    }
    await fcmSender.unregisterFCMToken(uid, fcmToken);
    res.json({ success: true, message: 'Token FCM desregistrado correctamente' });
  } catch (e) {
    console.error('[API] Error desregistrando token FCM:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Petición de canción → notificación al DJ ────────────────────────────────
// POST /api/song-request
// Body: { djUid, songTitle, requestedBy }
app.post('/api/song-request', async (req, res) => {
  try {
    const { djUid, songTitle, requestedBy } = req.body;
    if (!djUid || !songTitle) {
      return res.status(400).json({ success: false, error: 'djUid y songTitle son requeridos' });
    }
    // Enviar notificación FCM al DJ en segundo plano (no bloqueante)
    fcmSender.sendSongRequestNotification(djUid, songTitle, requestedBy || 'El público')
      .catch(err => console.error('[API] Error notificación song_request:', err.message));

    res.json({ success: true, message: 'Petición registrada y notificación enviada' });
  } catch (e) {
    console.error('[API] Error en /api/song-request:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Webhook & IPN payment notifications handler from Mercado Pago
app.all('/api/payments/notification', async (req, res) => {
  try {
    const result = await paymentService.handleNotification(req.body, req.query);
    if (result.success) {
      return res.status(200).json({ success: true, message: result.message || 'Notification processed' });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (e) {
    console.error('[API Notification Error]:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Create a new subscription
app.post('/api/subscription/create', async (req, res) => {
  try {
    const { userId, planId, paymentMethod, uid } = req.body;
    const result = await paymentService.createSubscription({ userId, planId, paymentMethod, uid });
    res.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Update an existing subscription
app.post('/api/subscription/update', async (req, res) => {
  try {
    const { subscriptionId, newPlanId } = req.body;
    const result = await paymentService.updateSubscription({ subscriptionId, newPlanId });
    res.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Cancel a subscription
app.post('/api/subscription/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const result = await paymentService.cancelSubscription({ subscriptionId });
    res.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Subscription API listening on port ${PORT}`));
}
module.exports = app;
