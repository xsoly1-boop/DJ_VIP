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

async function main() {
  const db = admin.database();
  const snap = await db.ref('users').once('value');
  const usersRTDB = snap.val() || {};

  // List Supabase users to map firebase_uid -> supabase UUID
  const { data: supabaseUsers } = await supabase.auth.admin.listUsers();
  const uidMap = {}; // firebaseUID -> supabaseUID
  for (const u of supabaseUsers.users) {
    const fbUid = u.user_metadata?.firebase_uid;
    if (fbUid) {
      uidMap[fbUid] = u.id;
    }
  }

  // Also map dj@admin.com specifically if not in user_metadata
  const adminUser = supabaseUsers.users.find(u => u.email?.toLowerCase() === 'dj@admin.com');
  if (adminUser) {
    uidMap['uid-admin-master'] = adminUser.id; // Firebase default master UID
  }

  console.log('User mapping:', uidMap);

  for (const fbUid of Object.keys(usersRTDB)) {
    const supabaseUid = uidMap[fbUid];
    if (!supabaseUid) {
      console.log(`⚠️ No Supabase UUID for Firebase user ${fbUid}`);
      continue;
    }

    const userNode = usersRTDB[fbUid] || {};
    const events = userNode.events || {};

    for (const eventId of Object.keys(events)) {
      const eventData = events[eventId] || {};
      const settings = eventData.settings || {};

      // Map event settings to public.events table fields
      const dbId = eventId === 'default-event' ? `default-event-${supabaseUid}` : eventId;

      const eventRow = {
        id: dbId,
        owner_id: supabaseUid,
        title: settings.title || 'Mi Gran Evento VIP',
        dj_name: settings.djName || 'DJ MasterMix',
        active: settings.active !== undefined ? settings.active : true,
        archived: settings.archived !== undefined ? settings.archived : false,
        theme_color: settings.themeColor || '#7c3aed',
        theme_color_secondary: settings.themeColorSecondary || '#06b6d4',
        web_name: settings.webName || 'DJ a la Carta',
        event_type: settings.eventType || 'Otro',
        logo_url: settings.logoUrl || null,
        tips_enabled: settings.tipsEnabled !== undefined ? settings.tipsEnabled : false,
        paypal_username: settings.paypalUsername || null,
        mercadopago_link: settings.mercadopagoLink || null,
        promo_enabled: settings.promoEnabled !== undefined ? settings.promoEnabled : false,
        promo_whatsapp: settings.promoWhatsapp || null,
        promo_website: settings.promoWebsite || null,
        promo_instagram: settings.promoInstagram || null,
        promo_tiktok: settings.promoTiktok || null,
        production_url: settings.productionUrl || null,
        custom_genres: settings.customGenres || null,
        created_at: new Date().toISOString()
      };

      console.log(`Upserting event ${dbId} for owner ${supabaseUid}`);
      const { error } = await supabase
        .from('events')
        .upsert(eventRow, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error upserting event ${dbId}:`, error.message);
      } else {
        console.log(`✅ Event ${dbId} upserted successfully`);
      }
    }
  }

  process.exit(0);
}

main();
