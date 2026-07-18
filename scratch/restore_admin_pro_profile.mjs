import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

const supabase = createClient(
  'https://lzbozouxqcsthysqnjij.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Ym96b3V4cWNzdGh5c3FuamlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM0NDA3MywiZXhwIjoyMDk5OTIwMDczfQ.5EqvQWd49xxKMS7TM6pbl7aqxcHT1UgEHnTi4u6jHSg'
);

const adminSupabaseId = '9f71a545-b58f-4382-9923-43f34a05be10';
const adminFirebaseId = 'WuOSSeOODRfxVnNpEVbc6S259f63';

const tsToMs = (v) => {
  if (!v) return null;
  if (typeof v === 'number') return v;
  return null;
};
const msToISO = (ms) => ms ? new Date(ms).toISOString() : null;

async function main() {
  console.log('📡 Obteniendo perfil PRO del administrador desde Firebase...');
  const db = admin.database();
  const snap = await db.ref(`users/${adminFirebaseId}/profile`).once('value');
  const profile = snap.val();

  if (!profile) {
    console.error('❌ No se encontró el perfil del administrador en Firebase.');
    process.exit(1);
  }

  console.log('✅ Perfil obtenido:', profile.displayName, '| Plan:', profile.activePlan);

  const base = {
    email:                     profile.email || 'dj@admin.com',
    display_name:              profile.displayName || 'Soporte',
    phone:                     profile.phone || null,
    active_plan:               profile.activePlan || 'pro',
    subscription_status:       profile.subscriptionStatus || 'pro',
    expires_at:                msToISO(tsToMs(profile.expiresAt)),
    device_id:                 profile.deviceId || null,
    logo_url:                  profile.logoUrl || null,
    demo_limit:                profile.demoLimit !== undefined ? parseInt(profile.demoLimit, 10) : 35,
    demo_limit_expires_at:     tsToMs(profile.demoLimitExpiresAt) || null,
    premium_limit:             profile.premiumLimit !== undefined ? parseInt(profile.premiumLimit, 10) : 80,
    premium_limit_expires_at:  tsToMs(profile.premiumLimitExpiresAt) || null,
    extra_requests:            profile.extraRequests !== undefined ? parseInt(profile.extraRequests, 10) : 0,
    extra_requests_expires_at: tsToMs(profile.extraRequestsExpiresAt) || null,
    strict_limit_enabled:      profile.strictLimitEnabled !== undefined ? Boolean(profile.strictLimitEnabled) : true,
    revenue:                   profile.revenue !== undefined ? parseFloat(profile.revenue) : 0.0
  };

  // Guardar todas las llaves dinámicas restantes (estilos, whatsapp, etc.) en custom_settings
  const custom_settings = {};
  for (const key of Object.keys(profile)) {
    if (![
      'email', 'displayName', 'display_name', 'phone', 'activePlan', 'subscriptionStatus', 'expiresAt', 'deviceId', 'logoUrl', 'demoLimit', 'demoLimitExpiresAt', 'premiumLimit', 'premiumLimitExpiresAt', 'extraRequests', 'extraRequestsExpiresAt', 'strictLimitEnabled', 'revenue'
    ].includes(key)) {
      custom_settings[key] = profile[key];
    }
  }
  base.custom_settings = custom_settings;

  console.log('📤 Subiendo perfil PRO a Supabase...');
  const { error } = await supabase
    .from('profiles')
    .update(base)
    .eq('id', adminSupabaseId);

  if (error) {
    console.error('❌ Error al actualizar el perfil en Supabase:', error.message);
  } else {
    console.log('🎉 ¡Perfil PRO del administrador restaurado con éxito en Supabase!');
  }
  process.exit(0);
}

main();
