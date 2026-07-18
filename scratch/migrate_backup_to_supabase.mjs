import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const backupPath = '/Users/dorian/Desktop/dj-interactive-event-default-rtdb-export.json';
const supabase = createClient(
  'https://lzbozouxqcsthysqnjij.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Ym96b3V4cWNzdGh5c3FuamlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM0NDA3MywiZXhwIjoyMDk5OTIwMDczfQ.5EqvQWd49xxKMS7TM6pbl7aqxcHT1UgEHnTi4u6jHSg'
);

// Mapear perfiles al formato de Supabase
const tsToMs = (v) => {
  if (!v) return null;
  if (typeof v === 'number') return v;
  return null;
};
const msToISO = (ms) => ms ? new Date(ms).toISOString() : null;

function mapProfile(profile = {}, email = '') {
  const base = {
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

  return base;
}

async function main() {
  console.log('📖 Leyendo archivo de respaldo local...');
  let backupData;
  try {
    backupData = JSON.parse(readFileSync(backupPath, 'utf8'));
  } catch (err) {
    console.error('❌ Error al leer el archivo de respaldo:', err.message);
    process.exit(1);
  }

  // 1. Obtener usuarios de Supabase
  const { data: sbUsers } = await supabase.auth.admin.listUsers();
  const emailToSbUuid = {};
  for (const u of sbUsers.users) {
    if (u.email) {
      emailToSbUuid[u.email.toLowerCase()] = u.id;
    }
  }

  console.log('\n👤 PASO 1: Migrando perfiles del Respaldo...');
  const usersNode = backupData.users || {};
  
  // Agrupar por email para resolver duplicados (priorizando planes PRO/VIP)
  const groupedProfiles = {};
  for (const backupUid of Object.keys(usersNode)) {
    const backupUser = usersNode[backupUid];
    const email = backupUser.profile?.email?.toLowerCase();
    if (!email) continue;

    if (!groupedProfiles[email]) {
      groupedProfiles[email] = [];
    }
    groupedProfiles[email].push({ backupUid, backupUser });
  }

  for (const email of Object.keys(groupedProfiles)) {
    const list = groupedProfiles[email];
    
    // Priorizar el perfil que tenga plan PRO/VIP
    let best = list[0];
    for (const item of list) {
      const plan = item.backupUser.profile?.activePlan || item.backupUser.profile?.subscriptionStatus || 'free';
      if (plan === 'pro' || plan === 'vip' || plan === 'premium') {
        best = item;
        break;
      }
    }

    const { backupUid, backupUser } = best;
    const sbUuid = emailToSbUuid[email];

    if (!sbUuid) {
      console.log(`   ⚠️  Email "${email}" no encontrado en Supabase Auth, omitido.`);
      continue;
    }

    console.log(`   ✏️  Actualizando perfil de "${email}" (${sbUuid}) con el perfil de Firebase ${backupUid} (Plan: ${backupUser.profile?.activePlan || 'free'})...`);
    const profileData = mapProfile(backupUser.profile, email);
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', sbUuid);

    if (profileError) {
      console.error(`      ❌ Error al actualizar perfil:`, profileError.message);
    } else {
      console.log(`      ✅ Perfil actualizado (con preferencias de diseño).`);
    }

    // 2. Migrar eventos de este usuario
    if (backupUser.events) {
      console.log(`   📅 Migrando eventos para "${email}"...`);
      for (const eventKey of Object.keys(backupUser.events)) {
        const eventNode = backupUser.events[eventKey] || {};
        const settings = eventNode.settings || {};

        // Mapear ID del evento: si es 'default-event', lo guardamos como 'default-event-[sbUuid]'
        const targetEventId = eventKey === 'default-event' ? `default-event-${sbUuid}` : eventKey;

        const eventData = {
          id: targetEventId,
          owner_id: sbUuid,
          title: settings.title || 'Mi Gran Evento VIP',
          logo_url: settings.logoUrl || null,
          theme_color: settings.themeColor || '#7c3aed',
          theme_color_secondary: settings.themeColorSecondary || '#06b6d4',
          dj_name: settings.djName || 'DJ MasterMix',
          active: true,
          web_name: settings.webName || 'DJ a la Carta',
          event_type: settings.eventType || 'Otro',
          tips_enabled: settings.tipsEnabled || false,
          paypal_username: settings.paypalUsername || null,
          mercadopago_link: settings.mercadopagoLink || null,
          promo_enabled: settings.promoEnabled || false,
          promo_whatsapp: settings.promoWhatsapp || null,
          promo_website: settings.promoWebsite || null,
          promo_instagram: settings.promoInstagram || null,
          promo_tiktok: settings.promoTiktok || null,
          production_url: 'https://dj-vip.onrender.com/', // Forzar Render
          custom_genres: settings.customGenres || null,
          archived: false,
          created_at: new Date().toISOString()
        };

        console.log(`      * Subiendo evento "${targetEventId}"...`);
        const { error: eventError } = await supabase
          .from('events')
          .upsert(eventData, { onConflict: 'id' });

        if (eventError) {
          console.error(`        ❌ Error en evento ${targetEventId}:`, eventError.message);
        } else {
          console.log(`        ✅ Evento ${targetEventId} subido.`);
        }
      }
    }
  }

  // 3. Generar archivo SQL de autocompletado
  console.log('\n🎵 PASO 2: Generando script SQL para Autocompletado...');
  const songsNode = backupData.autocomplete_songs || {};
  const songKeys = Object.keys(songsNode);
  console.log(`   ℹ️  Se encontraron ${songKeys.length} canciones en el respaldo.`);

  if (songKeys.length > 0) {
    let sqlContent = `-- Script de inserción masiva de autocompletado
-- Ejecuta esto en el SQL Editor de tu Dashboard de Supabase

CREATE TABLE IF NOT EXISTS public.autocomplete_songs (
  id text PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL,
  genre text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.autocomplete_songs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Cualquiera puede leer canciones de autocompletado') THEN
    CREATE POLICY "Cualquiera puede leer canciones de autocompletado" ON public.autocomplete_songs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Cualquiera puede gestionar canciones de autocompletado') THEN
    CREATE POLICY "Cualquiera puede gestionar canciones de autocompletado" ON public.autocomplete_songs FOR ALL USING (true);
  END IF;
END
$$;

TRUNCATE TABLE public.autocomplete_songs;

INSERT INTO public.autocomplete_songs (id, title, artist, genre) VALUES
`;

    const escapeSql = (str) => {
      if (!str) return '';
      return str.replace(/'/g, "''");
    };

    const valueRows = [];
    for (const key of songKeys) {
      const song = songsNode[key] || {};
      const title = escapeSql(song.title || '');
      const artist = escapeSql(song.artist || '');
      const genre = escapeSql(song.genre || '');
      valueRows.push(`('${escapeSql(key)}', '${title}', '${artist}', '${genre}')`);
    }

    sqlContent += valueRows.join(',\n') + ';\n';
    
    const sqlPath = '/Users/dorian/Desktop/importar_autocompletado.sql';
    writeFileSync(sqlPath, sqlContent, 'utf8');
    console.log(`   🎉 Script SQL generado en tu escritorio: ${sqlPath}`);
  }

  console.log('\n🎉 ¡Proceso de migración del respaldo finalizado!');
  process.exit(0);
}

main();
