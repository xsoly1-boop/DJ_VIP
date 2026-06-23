/**
 * add_random_requests.mjs
 * Agrega 75 peticiones de canciones al azar al evento activo del usuario especificado.
 * UID target: q7vXbTQnQqM7kbvOKT09jsDN2p42
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, push, set } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAZgdmkxOSDAUUmiPNiy6eqA_oKVDtn_9o',
  authDomain: 'djvip-c2cc9.firebaseapp.com',
  databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com',
  projectId: 'djvip-c2cc9',
  storageBucket: 'djvip-c2cc9.firebasestorage.app',
  messagingSenderId: '814917855042',
  appId: '1:814917855042:web:066636a11780c97dfa0adb'
};

const TARGET_UID = 'q7vXbTQnQqM7kbvOKT09jsDN2p42';
const TOTAL = 75;

// Pool de canciones (muestra representativa de todos los géneros)
const SONGS = [
  { title: "17 Años", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "El Listón de Tu Pelo", artist: "Los Ángeles Azules", genre: "Cumbia" },
  { title: "Nunca Es Suficiente", artist: "Los Ángeles Azules x Natalia Lafourcade", genre: "Cumbia" },
  { title: "Como La Flor", artist: "Selena", genre: "Cumbia" },
  { title: "Amor Prohibido", artist: "Selena", genre: "Cumbia" },
  { title: "Bidi Bidi Bom Bom", artist: "Selena", genre: "Cumbia" },
  { title: "Que Nadie Sepa Mi Sufrir", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Mi Cucu", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Escándalo", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Pollera Colorá", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Chona", artist: "Los Tucanes de Tijuana", genre: "Regional Mexicano" },
  { title: "La Puerta Negra", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { title: "Jefe de Jefes", artist: "Los Tigres del Norte", genre: "Regional Mexicano" },
  { title: "El Rey", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { title: "Volver Volver", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { title: "Hermoso Cariño", artist: "Vicente Fernández", genre: "Mariachi / Regional" },
  { title: "Adiós Amor", artist: "Christian Nodal", genre: "Regional Mexicano" },
  { title: "De Los Besos Que Te Di", artist: "Christian Nodal", genre: "Regional Mexicano" },
  { title: "Botella Tras Botella", artist: "Gera MX x Christian Nodal", genre: "Regional Mexicano" },
  { title: "El Color de Tus Ojos", artist: "Banda MS", genre: "Regional Mexicano" },
  { title: "Me Vas a Extrañar", artist: "Banda MS", genre: "Regional Mexicano" },
  { title: "No Se Va", artist: "Grupo Frontera", genre: "Regional Mexicano" },
  { title: "un x100to", artist: "Grupo Frontera x Bad Bunny", genre: "Regional / Urbano" },
  { title: "Ya Superame", artist: "Grupo Firme", genre: "Regional Mexicano" },
  { title: "Ella Baila Sola", artist: "Eslabon Armado x Peso Pluma", genre: "Regional Mexicano" },
  { title: "PRC", artist: "Peso Pluma x Natanael Cano", genre: "Corridos Tumbados" },
  { title: "Las Mañanitas", artist: "Mariachi Vargas", genre: "Mariachi / Cumpleaños" },
  { title: "Si No Te Hubieras Ido", artist: "Marco Antonio Solís", genre: "Pop / Balada" },
  { title: "Tu Cárcel", artist: "Los Bukis", genre: "Regional / Balada" },
  { title: "Fuerte No Soy", artist: "Intocable", genre: "Norteño / Tejano" },
  { title: "Rayando el Sol", artist: "Maná", genre: "Rock en Español" },
  { title: "Oye Mi Amor", artist: "Maná", genre: "Rock en Español" },
  { title: "Clavado En Un Bar", artist: "Maná", genre: "Rock en Español" },
  { title: "Labios Compartidos", artist: "Maná", genre: "Rock en Español" },
  { title: "Afuera", artist: "Caifanes", genre: "Rock en Español" },
  { title: "La Negra Tomasa", artist: "Caifanes", genre: "Rock / Cumbia" },
  { title: "Música Ligera", artist: "Soda Stereo", genre: "Rock en Español" },
  { title: "Cuando Pase el Temblor", artist: "Soda Stereo", genre: "Rock en Español" },
  { title: "Ingrata", artist: "Café Tacvba", genre: "Rock en Español" },
  { title: "Lamento Boliviano", artist: "Enanitos Verdes", genre: "Rock en Español" },
  { title: "Gimme Tha Power", artist: "Molotov", genre: "Rock en Español" },
  { title: "La Dosis Perfecta", artist: "Panteón Rococó", genre: "Ska / Rock" },
  { title: "Matador", artist: "Los Fabulosos Cadillacs", genre: "Rock / Ska" },
  { title: "Ahora Te Puedes Marchar", artist: "Luis Miguel", genre: "Pop Latino" },
  { title: "La Incondicional", artist: "Luis Miguel", genre: "Pop / Balada" },
  { title: "No Sé Tú", artist: "Luis Miguel", genre: "Pop / Bolero" },
  { title: "Querida", artist: "Juan Gabriel", genre: "Pop / Balada" },
  { title: "Hasta Que Te Conocí", artist: "Juan Gabriel", genre: "Pop / Balada" },
  { title: "Abrázame Muy Fuerte", artist: "Juan Gabriel", genre: "Pop / Balada" },
  { title: "Torero", artist: "Chayanne", genre: "Pop Latino" },
  { title: "Provócame", artist: "Chayanne", genre: "Pop Latino" },
  { title: "Hips Don't Lie", artist: "Shakira x Wyclef Jean", genre: "Pop Latino / Urbano" },
  { title: "Antología", artist: "Shakira", genre: "Pop / Balada" },
  { title: "La Tortura", artist: "Shakira x Alejandro Sanz", genre: "Pop Latino / Urbano" },
  { title: "Livin' la Vida Loca", artist: "Ricky Martin", genre: "Pop Latino" },
  { title: "La Copa de la Vida", artist: "Ricky Martin", genre: "Pop Latino" },
  { title: "Dr. Psiquiatra", artist: "Gloria Trevi", genre: "Pop Latino" },
  { title: "Todos Me Miran", artist: "Gloria Trevi", genre: "Pop Latino" },
  { title: "Gasolina", artist: "Daddy Yankee", genre: "Reggaetón" },
  { title: "Lo Que Pasó, Pasó", artist: "Daddy Yankee", genre: "Reggaetón" },
  { title: "Despacito", artist: "Luis Fonsi x Daddy Yankee", genre: "Pop / Urbano" },
  { title: "Tití Me Preguntó", artist: "Bad Bunny", genre: "Reggaetón" },
  { title: "Dakiti", artist: "Bad Bunny x Jhay Cortez", genre: "Reggaetón / Synth" },
  { title: "Me Porto Bonito", artist: "Bad Bunny x Chencho Corleone", genre: "Reggaetón" },
  { title: "Tusa", artist: "Karol G x Nicki Minaj", genre: "Reggaetón" },
  { title: "Bichota", artist: "Karol G", genre: "Reggaetón" },
  { title: "Mi Gente", artist: "J Balvin x Willy William", genre: "Urbano" },
  { title: "Vivir Mi Vida", artist: "Marc Anthony", genre: "Salsa" },
  { title: "Ahora Quien", artist: "Marc Anthony", genre: "Salsa" },
  { title: "Que Alguien Me Diga", artist: "Gilberto Santa Rosa", genre: "Salsa" },
  { title: "La Vida Es Un Carnaval", artist: "Celia Cruz", genre: "Salsa" },
  { title: "La Negra Tiene Tumbao", artist: "Celia Cruz", genre: "Salsa" },
  { title: "Rebelión", artist: "Joe Arroyo", genre: "Salsa" },
  { title: "Suavemente", artist: "Elvis Crespo", genre: "Merengue" },
  { title: "La Bilirrubina", artist: "Juan Luis Guerra", genre: "Merengue" },
  { title: "Obsesión", artist: "Aventura", genre: "Bachata" },
  { title: "Propuesta Indecente", artist: "Romeo Santos", genre: "Bachata" },
  { title: "Dancing Queen", artist: "ABBA", genre: "Disco / Pop" },
  { title: "Bohemian Rhapsody", artist: "Queen", genre: "Rock" },
  { title: "Stayin' Alive", artist: "Bee Gees", genre: "Disco" },
  { title: "Billie Jean", artist: "Michael Jackson", genre: "Pop / Dance" },
  { title: "Thriller", artist: "Michael Jackson", genre: "Pop / Dance" },
  { title: "September", artist: "Earth, Wind & Fire", genre: "Disco / Funk" },
  { title: "Uptown Funk", artist: "Mark Ronson x Bruno Mars", genre: "Funk / Pop" },
  { title: "Dynamite", artist: "BTS", genre: "Kpop" },
  { title: "How You Like That", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Danza Kuduro", artist: "Don Omar x Lucenzo", genre: "Urbano / Dance" },
  { title: "Bailando", artist: "Enrique Iglesias x Gente de Zona", genre: "Pop / Tropical" },
  { title: "Rebelde", artist: "RBD", genre: "Pop Latino" },
  { title: "Maldita Primavera", artist: "Yuri", genre: "Pop Latino" },
  { title: "Amor a la Mexicana", artist: "Thalía", genre: "Pop Latino" },
  { title: "La Flaca", artist: "Jarabe de Palo", genre: "Rock en Español" },
  { title: "Desvelado", artist: "Bobby Pulido", genre: "Cumbia / Tejano" },
  { title: "Azúcar Amargo", artist: "Fey", genre: "Pop Latino" },
];

// Statuses posibles para simular variedad
const STATUSES = ['pending', 'pending', 'pending', 'accepted', 'playing', 'rejected'];
const NAMES = [
  'Carlos', 'María', 'Jorge', 'Ana', 'Luis', 'Sofía', 'Roberto', 'Carmen',
  'Miguel', 'Laura', 'Andrés', 'Valeria', 'Diego', 'Isabella', 'Fernando',
  'Gabriela', 'Ricardo', 'Natalia', 'Eduardo', 'Alejandra'
];

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniqueShuffled(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  console.log('🔑 Iniciando sesión como administrador para bypass de reglas...');
  await signInWithEmailAndPassword(auth, 'dj@admin.com', 'admin123');
  console.log('✅ Autenticado exitosamente.');

  // 1. Obtener el perfil del usuario para encontrar su evento activo
  const profileRef = ref(db, `users/${TARGET_UID}/profile`);
  const profileSnap = await get(profileRef);

  if (!profileSnap.exists()) {
    console.error(`❌ No se encontró perfil para UID: ${TARGET_UID}`);
    process.exit(1);
  }

  const profile = profileSnap.val();
  console.log(`✅ Usuario encontrado: ${profile.displayName || profile.email}`);
  console.log(`   Plan: ${profile.selectedPlan || 'free'}`);

  // 2. Obtener el evento activo
  const eventsRef = ref(db, `users/${TARGET_UID}/events`);
  const eventsSnap = await get(eventsRef);

  if (!eventsSnap.exists()) {
    console.error('❌ El usuario no tiene eventos.');
    process.exit(1);
  }

  const events = eventsSnap.val();
  // Tomar el primer evento activo (no archivado)
  const activeEvent = Object.entries(events).find(([, ev]) => !ev.metadata?.archived);
  if (!activeEvent) {
    console.error('❌ No hay evento activo disponible.');
    process.exit(1);
  }

  const [eventId, eventData] = activeEvent;
  const eventTitle = eventData.settings?.title || eventData.metadata?.title || eventId;
  console.log(`📅 Evento activo: "${eventTitle}" (ID: ${eventId})`);

  // 3. Seleccionar 75 canciones al azar
  const selected = uniqueShuffled(SONGS, TOTAL);

  // 4. Insertar las peticiones en Firebase
  const requestsRef = ref(db, `users/${TARGET_UID}/events/${eventId}/requests`);
  const playedRef = ref(db, `users/${TARGET_UID}/events/${eventId}/played_requests`);

  let insertedActive = 0;
  let insertedPlayed = 0;

  for (let i = 0; i < selected.length; i++) {
    const song = selected[i];
    const status = randomPick(STATUSES);
    const requesterName = randomPick(NAMES);
    const timestamp = Date.now() - (TOTAL - i) * 12000; // escalonado en el tiempo

    const requestData = {
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      dedication: '',
      requesterName,
      status,
      timestamp,
      votes: Math.floor(Math.random() * 5),
    };

    // 20% van a played_requests para simular historial
    if (i < 15) {
      const playedData = { ...requestData, status: 'played', playedAt: timestamp + 60000 };
      await push(playedRef, playedData);
      insertedPlayed++;
    } else {
      await push(requestsRef, requestData);
      insertedActive++;
    }

    process.stdout.write(`\r   Insertando: ${i + 1}/${TOTAL} — "${song.title}" por ${song.artist}`);
  }

  console.log(`\n\n✅ Listo! Insertadas ${insertedActive} peticiones activas + ${insertedPlayed} en historial (played)`);
  console.log(`   Total: ${insertedActive + insertedPlayed} de ${TOTAL} peticiones`);
  console.log(`   Evento: "${eventTitle}" del usuario ${profile.displayName || profile.email}`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
