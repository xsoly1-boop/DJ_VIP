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
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Root path status message
app.get('/', (req, res) => {
  res.send('🚀 DJVIP Subscription Backend API is running.');
});

// Endpoint de diagnóstico para verificar el estado de Supabase y Render
app.get('/api/supabase-status', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    let dbConnection = false;
    let dbError = null;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        const { error } = await client.from('profiles').select('id').limit(1);
        if (error) {
          dbError = error.message;
        } else {
          dbConnection = true;
        }
      } catch (err) {
        dbError = err.message;
      }
    }

    res.json({
      success: true,
      supabaseInitialized: !!(supabaseUrl && supabaseAnonKey),
      hasServiceRoleKey,
      databaseConnected: dbConnection,
      databaseError: dbError,
      environment: process.env.NODE_ENV || 'production',
      hosting: 'Render.com'
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

// ── AI Audio Recognition ────────────────────────────────────────────────────
// POST /api/identify-audio
// Receives a Base64-encoded audio blob and identifies the song via AudD API.
// If AUDD_API_TOKEN is not set, runs in demo mode (simulates identification).
app.post('/api/identify-audio', async (req, res) => {
  try {
    const { audio, mime } = req.body;
    if (!audio) return res.status(400).json({ success: false, error: 'No audio data received.' });

    const token = process.env.AUDD_API_TOKEN;

    // ── DEMO MODE (no token configured) ──────────────────────────────────
    if (!token) {
      const demos = [
        { title: 'Ella Baila Sola', artist: 'Eslabon Armado & Peso Pluma', album: 'Ella Baila Sola', genre: 'Corridos Tumbados' },
        { title: 'Golden Hour', artist: 'JVKE', album: 'this is what ____ feels like', genre: 'Pop' },
        { title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', genre: 'Pop' },
        { title: 'La Bebe (Remix)', artist: 'Yng Lvcas & Peso Pluma', album: 'La Bebe Remix', genre: 'Urbano' },
        { title: 'As It Was', artist: 'Harry Styles', album: "Harry's House", genre: 'Pop' },
      ];
      await new Promise(r => setTimeout(r, 2000));
      const song = demos[Math.floor(Math.random() * demos.length)];
      return res.json({ success: true, demo: true, result: song });
    }

    // ── PRODUCTION MODE (AudD API + Humming Fallback) ─────────────────────
    const audioBuffer = Buffer.from(audio, 'base64');

    let ext = 'webm';
    let contentType = 'audio/webm';
    if (mime) {
      if (mime.includes('mp4')) { ext = 'mp4'; contentType = 'audio/mp4'; }
      else if (mime.includes('aac')) { ext = 'aac'; contentType = 'audio/aac'; }
      else if (mime.includes('wav')) { ext = 'wav'; contentType = 'audio/wav'; }
      else if (mime.includes('ogg')) { ext = 'ogg'; contentType = 'audio/ogg'; }
      else if (mime.includes('mp3') || mime.includes('mpeg')) { ext = 'mp3'; contentType = 'audio/mpeg'; }
    }

    const buildMultipart = (fileName, cType) => {
      const bMark = `----DJVIPBoundary${Date.now()}`;
      const parts = [];
      parts.push(Buffer.from(
        `--${bMark}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${cType}\r\n\r\n`
      ));
      parts.push(audioBuffer);
      parts.push(Buffer.from(`\r\n--${bMark}--\r\n`));
      return { boundary: bMark, multipartBody: Buffer.concat(parts) };
    };

    // 1. Probar reconocimiento estándar de huella digital de audio
    const mainMp = buildMultipart(`audio.${ext}`, contentType);
    const auddRes = await fetch(
      `https://api.audd.io/?api_token=${token}&return=title,artist,album,release_date,timecode,label&method=recognize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${mainMp.boundary}`,
          'Content-Length': mainMp.multipartBody.length.toString(),
        },
        body: mainMp.multipartBody,
      }
    );

    const data = await auddRes.json();
    console.log('[AudD Standard API Response]', data);

    if (data.status === 'success' && data.result) {
      const r = data.result;
      return res.json({
        success: true,
        demo: false,
        result: {
          title:   r.title || 'Canción Desconocida',
          artist:  r.artist || 'Artista Desconocido',
          album:   r.album || '',
          timecode: r.timecode,
          label:   r.label,
        }
      });
    }

    // 2. Si la huella digital no coincide, probar la API de Tarareo/Voz (Humming API)
    try {
      const humMp = buildMultipart(`audio.${ext}`, contentType);
      const hummingRes = await fetch(
        `https://api.audd.io/humming/?api_token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${humMp.boundary}`,
            'Content-Length': humMp.multipartBody.length.toString(),
          },
          body: humMp.multipartBody,
        }
      );
      const humData = await hummingRes.json();
      console.log('[AudD Humming API Response]', humData);

      if (humData.status === 'success' && humData.result && humData.result.list && humData.result.list.length > 0) {
        const top = humData.result.list[0];
        const titleParts = (top.title || '').split(' - ');
        const artist = titleParts.length > 1 ? titleParts[0].trim() : 'Artista Desconocido';
        const title = titleParts.length > 1 ? titleParts.slice(1).join(' - ').trim() : top.title;

        return res.json({
          success: true,
          demo: false,
          result: {
            title: title || 'Canción Reconocida',
            artist: artist,
            album: 'Identificado por Voz / Tarareo',
            score: top.score || null
          }
        });
      }
    } catch (humErr) {
      console.warn('[AudD Humming Fallback Error]', humErr);
    }

    const detail = data.error?.message || 'sin coincidencia en catálogo';
    return res.json({ 
      success: false, 
      error: `No se logró reconocer la canción (${detail}). Acerca el micrófono a los altavoces o tararea más fuerte.` 
    });
  } catch (e) {
    console.error('[identify-audio]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Subscription API listening on port ${PORT}`));
}
module.exports = app;
