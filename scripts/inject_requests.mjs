/**
 * inject_requests.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Inyecta canciones al azar (desde autocomplete_songs en Firebase) como
 * peticiones al evento activo de un DJ, identificado por su email.
 *
 * Uso:
 *   node scripts/inject_requests.mjs
 *
 * El script preguntará interactivamente:
 *   1. Email de la cuenta destino
 *   2. Cantidad de canciones: 33 o 78
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp }            from 'firebase/app';
import { getDatabase, ref, get,
         push, set, query,
         orderByKey }               from 'firebase/database';
import { getAuth,
         signInWithEmailAndPassword } from 'firebase/auth';
import { createInterface }           from 'readline';

// ── Configuración Firebase ────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAZgdmkxOSDAUUmiPNiy6eqA_oKVDtn_9o',
  authDomain:        'djvip-c2cc9.firebaseapp.com',
  databaseURL:       'https://djvip-c2cc9-default-rtdb.firebaseio.com',
  projectId:         'djvip-c2cc9',
  storageBucket:     'djvip-c2cc9.firebasestorage.app',
  messagingSenderId: '814917855042',
  appId:             '1:814917855042:web:066636a11780c97dfa0adb'
};

// Credenciales del Admin Master (para bypass de reglas de seguridad)
const ADMIN_EMAIL    = 'dj@admin.com';
const ADMIN_PASSWORD = 'admin123';

// Nombres simulados de asistentes que hacen peticiones
const REQUESTER_NAMES = [
  'Carlos', 'María', 'Jorge', 'Ana', 'Luis', 'Sofía', 'Roberto', 'Carmen',
  'Miguel', 'Laura', 'Andrés', 'Valeria', 'Diego', 'Isabella', 'Fernando',
  'Gabriela', 'Ricardo', 'Natalia', 'Eduardo', 'Alejandra', 'Javier', 'Mónica',
  'Héctor', 'Claudia', 'Arturo', 'Verónica', 'Manuel', 'Patricia', 'Rafael',
  'Sandra', 'Óscar', 'Daniela', 'Ernesto', 'Lucía', 'Álvaro', 'Mariana'
];

// Proporciones: 80% activas (pending/accepted), 20% en historial (played)
const PLAYED_RATIO = 0.20;

// ── Utilidades ────────────────────────────────────────────────────────────────

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Fisher-Yates shuffle → toma los primeros `count` elementos */
function randomSample(arr, count) {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Si count > pool.length, repetir hasta completar
  const result = [];
  for (let i = 0; i < count; i++) result.push(pool[i % pool.length]);
  return result;
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

// Barra de progreso en consola
function progressBar(current, total, width = 40) {
  const pct  = current / total;
  const fill = Math.round(pct * width);
  const bar  = '█'.repeat(fill) + '░'.repeat(width - fill);
  return `[${bar}] ${current}/${total} (${Math.round(pct * 100)}%)`;
}

// ── Input interactivo ─────────────────────────────────────────────────────────

function question(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  // Cabecera
  console.log('\n' + '═'.repeat(60));
  console.log('  💿  DJ Panel Pro — Inyector de Peticiones de Prueba');
  console.log('═'.repeat(60));
  console.log('  Inyecta canciones al azar (desde la BD) al evento');
  console.log('  activo de un DJ, identificado por su email.\n');

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // ── 1. Solicitar email ─────────────────────────────────────────────────────
  let targetEmail = '';
  while (!targetEmail.trim() || !targetEmail.includes('@')) {
    targetEmail = await question(rl, '  📧 Email de la cuenta destino: ');
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      console.log('  ⚠️  Introduce un email válido.\n');
    }
  }

  // ── 2. Solicitar cantidad ──────────────────────────────────────────────────
  let total = 0;
  while (total !== 33 && total !== 78) {
    const raw = await question(rl, '  🎵 Canciones a inyectar (33 / 78): ');
    total = parseInt(raw.trim(), 10);
    if (total !== 33 && total !== 78) {
      console.log('  ⚠️  Elige exactamente 33 o 78.\n');
    }
  }

  rl.close();

  console.log('\n' + '─'.repeat(60));
  console.log(`  ▶ Email destino : ${targetEmail}`);
  console.log(`  ▶ Canciones     : ${total}`);
  console.log('─'.repeat(60) + '\n');

  // ── 3. Conectar a Firebase ─────────────────────────────────────────────────
  process.stdout.write('  🔧 Inicializando Firebase…');
  const app  = initializeApp(FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db   = getDatabase(app);
  console.log(' ✅');

  // ── 4. Autenticar como Admin Master ───────────────────────────────────────
  process.stdout.write('  🔑 Autenticando como Admin Master…');
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log(' ✅\n');

  // ── 5. Buscar UID por email ────────────────────────────────────────────────
  process.stdout.write(`  🔍 Buscando usuario con email "${targetEmail}"…`);
  const usersSnap = await get(ref(db, 'users'));
  if (!usersSnap.exists()) {
    console.log('\n  ❌ No existe el nodo "users" en la base de datos.');
    process.exit(1);
  }

  let targetUid  = null;
  let targetProfile = null;
  usersSnap.forEach(userSnap => {
    const profile = userSnap.val()?.profile;
    if (profile?.email?.toLowerCase() === targetEmail.trim().toLowerCase()) {
      targetUid     = userSnap.key;
      targetProfile = profile;
    }
  });

  if (!targetUid) {
    console.log(`\n  ❌ No se encontró ninguna cuenta con email: ${targetEmail}`);
    process.exit(1);
  }
  console.log(' ✅');
  console.log(`     Nombre : ${targetProfile.displayName || targetProfile.djName || '(sin nombre)'}`);
  console.log(`     UID    : ${targetUid}`);
  console.log(`     Plan   : ${targetProfile.activePlan || targetProfile.selectedPlan || 'free'}\n`);

  // ── 6. Obtener eventos del usuario ─────────────────────────────────────────
  process.stdout.write('  📅 Buscando evento activo…');
  const eventsSnap = await get(ref(db, `users/${targetUid}/events`));
  if (!eventsSnap.exists()) {
    console.log('\n  ❌ El usuario no tiene eventos creados.');
    process.exit(1);
  }

  const eventsObj = eventsSnap.val();
  // Preferir evento no archivado; si todos están archivados, tomar el primero
  let eventId = null;
  let eventTitle = '';

  for (const [id, ev] of Object.entries(eventsObj)) {
    if (!ev.settings?.archived) {
      eventId    = id;
      eventTitle = ev.settings?.title || id;
      break;
    }
  }
  if (!eventId) {
    // Fallback: tomar el primero aunque esté archivado
    [eventId]  = Object.keys(eventsObj);
    eventTitle = eventsObj[eventId]?.settings?.title || eventId;
  }

  console.log(' ✅');
  console.log(`     Evento : "${eventTitle}" (ID: ${eventId})\n`);

  // ── 7. Obtener canciones de autocomplete_songs ─────────────────────────────
  process.stdout.write('  🎶 Cargando canciones desde la base de datos…');
  const songsSnap = await get(ref(db, 'autocomplete_songs'));

  let songPool = [];
  if (songsSnap.exists()) {
    const songsObj = songsSnap.val();
    songPool = Object.values(songsObj).map(s => ({
      title:  s.title  || s.t || '(sin título)',
      artist: s.artist || s.a || '(sin artista)',
      genre:  s.genre  || s.g || 'Varios'
    }));
  }

  if (songPool.length === 0) {
    console.log('\n  ⚠️  No hay canciones en autocomplete_songs. Usando pool interno de respaldo…');
    // Pool de respaldo compacto
    songPool = [
      { title: 'Ella Baila Sola',     artist: 'Eslabon Armado x Peso Pluma', genre: 'Regional Mexicano' },
      { title: 'La Chona',            artist: 'Los Tucanes de Tijuana',       genre: 'Regional Mexicano' },
      { title: 'Vivir Mi Vida',        artist: 'Marc Anthony',                 genre: 'Salsa'             },
      { title: 'Rayando el Sol',       artist: 'Maná',                         genre: 'Rock en Español'   },
      { title: 'Gasolina',             artist: 'Daddy Yankee',                 genre: 'Reggaetón'         },
      { title: 'Bohemian Rhapsody',    artist: 'Queen',                        genre: 'Rock'              },
      { title: 'Querida',              artist: 'Juan Gabriel',                 genre: 'Pop / Balada'      },
      { title: 'Despacito',            artist: 'Luis Fonsi x Daddy Yankee',    genre: 'Pop / Urbano'      },
      { title: 'Dancing Queen',        artist: 'ABBA',                         genre: 'Disco / Pop'       },
      { title: 'Tití Me Preguntó',     artist: 'Bad Bunny',                    genre: 'Reggaetón'         },
    ];
  } else {
    console.log(` ✅  (${songPool.length} canciones disponibles)`);
  }

  // ── 8. Seleccionar canciones al azar ──────────────────────────────────────
  const selected    = randomSample(songPool, total);
  const playedCount = Math.round(total * PLAYED_RATIO);
  const activeCount = total - playedCount;

  console.log('\n' + '─'.repeat(60));
  console.log(`  📊 Distribución de ${total} peticiones:`);
  console.log(`     • Activas  (pending/accepted): ${activeCount}`);
  console.log(`     • Historial (played):          ${playedCount}`);
  console.log('─'.repeat(60) + '\n');

  // ── 9. Insertar peticiones ─────────────────────────────────────────────────
  const requestsRef = ref(db, `users/${targetUid}/events/${eventId}/requests`);
  const playedRef   = ref(db, `users/${targetUid}/events/${eventId}/played_requests`);

  const ACTIVE_STATUSES = ['pending', 'pending', 'pending', 'accepted'];
  const startTime = Date.now();
  let inserted = 0;
  let errors   = 0;

  for (let i = 0; i < selected.length; i++) {
    const song          = selected[i];
    const requesterName = randomPick(REQUESTER_NAMES);
    const timestamp     = Date.now() - (total - i) * 15000; // escalonado

    const base = {
      title:         song.title,
      artist:        song.artist,
      genre:         song.genre,
      dedication:    '',
      requesterName,
      timestamp,
      votes:         Math.floor(Math.random() * 8),
    };

    try {
      if (i < playedCount) {
        // Historial de reproducidas
        await push(playedRef, {
          ...base,
          status:   'played',
          playedAt: timestamp + 90000
        });
      } else {
        // Cola activa
        await push(requestsRef, {
          ...base,
          status: randomPick(ACTIVE_STATUSES)
        });
      }
      inserted++;
    } catch (err) {
      errors++;
    }

    // Progreso en tiempo real
    const elapsed = Date.now() - startTime;
    const label   = i < playedCount ? '🎵 historial' : '📋 activa   ';
    process.stdout.write(
      `\r  ${label}  ${progressBar(i + 1, total)}  ⏱ ${formatTime(elapsed)}  "${song.title.substring(0, 22).padEnd(22)}"  `
    );
  }

  // ── 10. Resumen final ──────────────────────────────────────────────────────
  const totalTime = Date.now() - startTime;
  console.log('\n\n' + '═'.repeat(60));
  console.log('  ✅  ¡Inyección completada!');
  console.log('═'.repeat(60));
  console.log(`  Usuario  : ${targetProfile.displayName || targetEmail}`);
  console.log(`  Evento   : "${eventTitle}"`);
  console.log(`  Insertas : ${inserted} / ${total}  ${errors > 0 ? `(${errors} errores)` : '(sin errores)'}`);
  console.log(`    ├─ Activas   : ${Math.max(0, inserted - playedCount)}`);
  console.log(`    └─ Historial : ${Math.min(playedCount, inserted)}`);
  console.log(`  Tiempo   : ${formatTime(totalTime)}`);
  console.log('═'.repeat(60) + '\n');

  process.exit(0);
}

main().catch(err => {
  console.error('\n  ❌ Error inesperado:', err.message || err);
  process.exit(1);
});
