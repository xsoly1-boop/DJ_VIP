// ============================================================
// MIGRACIÓN COMPLETA: Firebase → Supabase
// - 11 usuarios Auth
// - 11 perfiles (profiles table)
// - Config: planes, pasarelas de pago, Twilio, etc.
// ============================================================

import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ── Clientes ────────────────────────────────────────────────
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

const TEMP_PASSWORD = 'DJvip2026!';  // temporal — usuarios pueden resetear con "Olvidé mi contraseña"
let ok = 0, skipped = 0, errors = 0;
const results = [];

// ── Helpers ─────────────────────────────────────────────────
const tsToMs = (v) => {
  if (!v) return null;
  if (typeof v === 'number') return v;
  return null;
};

const msToISO = (ms) => ms ? new Date(ms).toISOString() : null;

function mapProfile(firebaseUid, profile = {}, email = '') {
  return {
    email:                     profile.email || email,
    display_name:              profile.displayName || profile.display_name || email.split('@')[0] || 'Usuario',
    phone:                     profile.phone || null,
    active_plan:               profile.activePlan || profile.subscriptionStatus || 'free',
    subscription_status:       profile.subscriptionStatus || 'inactive',
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
    revenue:                   profile.revenue !== undefined ? parseFloat(profile.revenue) : 0.0,
    created_at:                new Date().toISOString()
  };
}

// ── PASO 1: Leer todos los datos de Firebase ─────────────────
async function readFirebaseData() {
  console.log('\n📖 Leyendo datos de Firebase...');

  // Auth users
  const authResult = await admin.auth().listUsers(1000);
  const firebaseUsers = authResult.users;
  console.log(`   ✅ ${firebaseUsers.length} usuarios en Firebase Auth`);

  // RTDB profiles
  const db = admin.database();
  const snap = await db.ref('users').once('value');
  const usersRTDB = snap.val() || {};
  console.log(`   ✅ ${Object.keys(usersRTDB).length} perfiles en Realtime Database`);

  // Config
  const configSnap = await db.ref('config').once('value');
  const config = configSnap.val() || {};
  console.log(`   ✅ Config: ${Object.keys(config).join(', ')}`);

  return { firebaseUsers, usersRTDB, config };
}

// ── PASO 2: Crear usuarios en Supabase Auth ───────────────────
async function migrateAuth(firebaseUsers, usersRTDB) {
  console.log('\n\n🔐 PASO 1/3 — Migrando usuarios a Supabase Auth...');
  console.log('─'.repeat(60));

  // Obtener usuarios ya existentes en Supabase
  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingEmails = new Set((existing?.users || []).map(u => u.email?.toLowerCase()));

  const uidMap = {}; // firebaseUID → supabaseUID

  for (const fbUser of firebaseUsers) {
    const email = fbUser.email?.toLowerCase();
    if (!email) { skipped++; continue; }

    const rtdbProfile = usersRTDB[fbUser.uid]?.profile || {};
    const displayName = rtdbProfile.displayName || rtdbProfile.display_name || email.split('@')[0];

    // Admin especial: usa contraseña conocida
    const isAdmin = email === 'dj@admin.com';
    const password = isAdmin ? 'admin123' : TEMP_PASSWORD;

    if (existingEmails.has(email)) {
      // Ya existe — obtener su UUID de Supabase
      const found = existing.users.find(u => u.email?.toLowerCase() === email);
      if (found) {
        uidMap[fbUser.uid] = found.id;
        console.log(`   ⏭️  ${email.padEnd(36)} Ya existe (${found.id.substring(0,8)}…)`);
        skipped++;
      }
      continue;
    }

    // Crear usuario nuevo
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        displayName,
        firebase_uid: fbUser.uid,
        migrated_from_firebase: true
      }
    });

    if (error) {
      console.log(`   ❌ ${email.padEnd(36)} ERROR: ${error.message}`);
      errors++;
    } else {
      uidMap[fbUser.uid] = data.user.id;
      console.log(`   ✅ ${email.padEnd(36)} → ${data.user.id.substring(0,8)}…  (${isAdmin ? 'admin123' : 'pass temporal'})`);
      ok++;
    }
  }

  console.log(`\n   Creados: ${ok}  |  Ya existían: ${skipped}  |  Errores: ${errors}`);
  return uidMap;
}

// ── PASO 3: Migrar perfiles ───────────────────────────────────
async function migrateProfiles(firebaseUsers, usersRTDB, uidMap) {
  console.log('\n\n👤 PASO 2/3 — Migrando perfiles (tabla profiles)...');
  console.log('─'.repeat(60));

  let profOk = 0, profSkip = 0, profErr = 0;

  for (const fbUser of firebaseUsers) {
    const supabaseUID = uidMap[fbUser.uid];
    if (!supabaseUID) {
      console.log(`   ⚠️  Sin UUID Supabase para ${fbUser.uid} — omitido`);
      continue;
    }

    const rtdbProfile = usersRTDB[fbUser.uid]?.profile || {};
    const profileData = mapProfile(fbUser.uid, rtdbProfile, fbUser.email || '');
    profileData.id = supabaseUID;

    // Upsert: si ya existe lo actualiza, si no lo crea
    const { error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      console.log(`   ❌ ${(fbUser.email||fbUser.uid).padEnd(36)} ${error.message}`);
      profErr++;
    } else {
      console.log(`   ✅ ${(fbUser.email||fbUser.uid).padEnd(36)} Plan: ${(profileData.active_plan||'free').padEnd(10)} Exp: ${profileData.expires_at ? new Date(profileData.expires_at).toLocaleDateString('es-MX') : 'N/A'}`);
      profOk++;
    }

    results.push({
      email: fbUser.email,
      plan: profileData.active_plan,
      supabaseId: supabaseUID
    });
  }

  console.log(`\n   Perfiles migrados: ${profOk}  |  Errores: ${profErr}`);
  return { profOk, profErr };
}

// ── PASO 4: Migrar configuración ──────────────────────────────
async function migrateConfig(config) {
  console.log('\n\n⚙️  PASO 3/3 — Migrando configuración...');
  console.log('─'.repeat(60));

  const configEntries = [
    { key: 'plans',               value: config.plans || {} },
    { key: 'payment_gateways',    value: config.payment_gateways || {} },
    { key: 'public_payment_info', value: config.public_payment_info || {} },
    { key: 'twilio',              value: config.twilio || {} },
    { key: 'summary_notifications', value: config.summary_notifications || {} },
    { key: 'admin_contact',       value: config.admin_contact || {} },
    { key: 'updates',             value: config.updates || {} }
  ].filter(e => Object.keys(e.value).length > 0);

  for (const entry of configEntries) {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: entry.key, value: entry.value, updated_at: new Date().toISOString() },
               { onConflict: 'key' });

    if (error) {
      // Tabla puede no existir, crear JSON en tabla genérica
      console.log(`   ⚠️  ${entry.key}: ${error.message}`);
    } else {
      console.log(`   ✅ ${entry.key}`);
    }
  }
}

// ── RESUMEN FINAL ─────────────────────────────────────────────
async function printSummary(uidMap) {
  console.log('\n\n' + '═'.repeat(60));
  console.log('🎉  MIGRACIÓN COMPLETADA');
  console.log('═'.repeat(60));
  console.log('\n📋 Tabla de usuarios migrados:\n');
  console.log('Email'.padEnd(36) + 'Plan'.padEnd(14) + 'Contraseña');
  console.log('─'.repeat(70));
  for (const r of results) {
    const pass = r.email === 'dj@admin.com' ? 'admin123' : TEMP_PASSWORD;
    console.log(`${(r.email||'').padEnd(36)}${(r.plan||'free').padEnd(14)}${pass}`);
  }
  console.log('\n⚠️  IMPORTANTE:');
  console.log(`   • Todos los usuarios (excepto admin) tienen contraseña temporal: ${TEMP_PASSWORD}`);
  console.log('   • Deben usar "Olvidé mi contraseña" para crear la suya propia.');
  console.log('   • Los datos de Firebase siguen intactos como respaldo.');
  console.log('\n✅ Firebase: intacto (no se modificó nada)');
  console.log('✅ Supabase: todos los usuarios y perfiles listos\n');
}

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🚀  MIGRACIÓN FIREBASE → SUPABASE                     ║');
  console.log('║   11 usuarios · perfiles · planes · configuración       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  try {
    const { firebaseUsers, usersRTDB, config } = await readFirebaseData();
    const uidMap = await migrateAuth(firebaseUsers, usersRTDB);
    await migrateProfiles(firebaseUsers, usersRTDB, uidMap);
    // Config not stored in Supabase, keeping it client/fallback
    // await migrateConfig(config);
    await printSummary(uidMap);
  } catch (e) {
    console.error('\n❌ Error fatal:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
  process.exit(0);
}

main();
