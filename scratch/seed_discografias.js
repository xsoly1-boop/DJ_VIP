// ============================================================
// SCRIPT: Agregar Discografías Completas a Firebase
// Artistas: BLACKPINK, LE SSERAFIM, ITZY, ROSÉ, Becky G,
//           La Sonora Dinamita, Septeto Nacional, Yiyo Sarante
// ============================================================

const apiKey = "AIzaSyAZcMcN-dPs3HYMCDb14J-fmjV274NDSC8";
const dbUrl = "https://dj-interactive-event-default-rtdb.firebaseio.com";
const adminEmail = "dj@admin.com";
const adminPassword = "admin123";

// ============================================================
// CANCIONES
// ============================================================
const songs = [

  // ─────────────────────────────────────────────────────────
  // BLACKPINK
  // ─────────────────────────────────────────────────────────
  { title: "DDU-DU DDU-DU", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Kill This Love", artist: "BLACKPINK", genre: "Kpop" },
  { title: "How You Like That", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Pink Venom", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Shut Down", artist: "BLACKPINK", genre: "Kpop" },
  { title: "BORN PINK", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Lovesick Girls", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Pretty Savage", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Crazy Over You", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Love To Hate Me", artist: "BLACKPINK", genre: "Kpop" },
  { title: "You Never Know", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Ice Cream", artist: "BLACKPINK ft. Selena Gomez", genre: "Kpop" },
  { title: "Sour Candy", artist: "Lady Gaga ft. BLACKPINK", genre: "Kpop" },
  { title: "Whistle", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Boombayah", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Playing With Fire", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Stay", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Blink", artist: "BLACKPINK", genre: "Kpop" },
  { title: "As If It's Your Last", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Forever Young", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Really", artist: "BLACKPINK", genre: "Kpop" },
  { title: "See U Later", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Between Two Worlds", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Yeah Yeah Yeah", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Tally", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Typa Girl", artist: "BLACKPINK", genre: "Kpop" },
  { title: "Hard to Love", artist: "BLACKPINK", genre: "Kpop" },
  { title: "The Happiest Girl", artist: "BLACKPINK", genre: "Kpop" },
  { title: "This Love", artist: "BLACKPINK", genre: "Kpop" },

  // ─────────────────────────────────────────────────────────
  // LE SSERAFIM
  // ─────────────────────────────────────────────────────────
  { title: "FEARLESS", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "The World Is My Oyster", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Blue Flame", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "No Celestial", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Sour Grapes", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Impurities", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Good Parts (when the quality is bad but I am)", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "ANTIFRAGILE", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Flame rises", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "THE GREAT MERMAID", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "UNFORGIVEN", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Eve, Psyche & The Bluebeard's wife", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Fire in the belly", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "I ≠ DOLL", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "EASY", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Swan Song", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "CRAZY", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "MEOW", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Perfect Night", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "Smart", artist: "LE SSERAFIM", genre: "Kpop" },
  { title: "We've Only Just Begun", artist: "LE SSERAFIM", genre: "Kpop" },

  // ─────────────────────────────────────────────────────────
  // ITZY
  // ─────────────────────────────────────────────────────────
  { title: "DALLA DALLA", artist: "ITZY", genre: "Kpop" },
  { title: "ICY", artist: "ITZY", genre: "Kpop" },
  { title: "WANNABE", artist: "ITZY", genre: "Kpop" },
  { title: "Not Shy", artist: "ITZY", genre: "Kpop" },
  { title: "LOCO", artist: "ITZY", genre: "Kpop" },
  { title: "MAFIA In the morning", artist: "ITZY", genre: "Kpop" },
  { title: "Swipe", artist: "ITZY", genre: "Kpop" },
  { title: "CHESHIRE", artist: "ITZY", genre: "Kpop" },
  { title: "Sneakers", artist: "ITZY", genre: "Kpop" },
  { title: "Boys Like You", artist: "ITZY", genre: "Kpop" },
  { title: "b Episode", artist: "ITZY", genre: "Kpop" },
  { title: "VOLTAGE", artist: "ITZY", genre: "Kpop" },
  { title: "Cake", artist: "ITZY", genre: "Kpop" },
  { title: "Sorry Not Sorry", artist: "ITZY", genre: "Kpop" },
  { title: "In the morning", artist: "ITZY", genre: "Kpop" },
  { title: "SHOOT!", artist: "ITZY", genre: "Kpop" },
  { title: "MIROH", artist: "ITZY", genre: "Kpop" },
  { title: "TRUST ME (Girls)", artist: "ITZY", genre: "Kpop" },
  { title: "CRAZY IN LOVE", artist: "ITZY", genre: "Kpop" },
  { title: "Twenty", artist: "ITZY", genre: "Kpop" },
  { title: "Mr. Vampire", artist: "ITZY", genre: "Kpop" },

  // ─────────────────────────────────────────────────────────
  // ROSÉ (Solo)
  // ─────────────────────────────────────────────────────────
  { title: "On The Ground", artist: "ROSÉ", genre: "Kpop" },
  { title: "Gone", artist: "ROSÉ", genre: "Kpop" },
  { title: "APT.", artist: "Bruno Mars & ROSÉ", genre: "Kpop / Pop" },
  { title: "Number One Girl", artist: "ROSÉ", genre: "Kpop" },
  { title: "Toxic Till the End", artist: "ROSÉ", genre: "Kpop" },
  { title: "Under The Influence", artist: "ROSÉ", genre: "Kpop" },
  { title: "If Only You Knew", artist: "ROSÉ", genre: "Kpop" },
  { title: "Too Bad", artist: "ROSÉ", genre: "Kpop" },
  { title: "Game Boy", artist: "ROSÉ ft. G-Dragon", genre: "Kpop" },
  { title: "Slow Down Time", artist: "ROSÉ", genre: "Kpop" },
  { title: "Messy", artist: "ROSÉ ft. Tyler, the Creator", genre: "Kpop" },

  // ─────────────────────────────────────────────────────────
  // BECKY G
  // ─────────────────────────────────────────────────────────
  { title: "Shower", artist: "Becky G", genre: "Pop" },
  { title: "Mayores", artist: "Becky G ft. Bad Bunny", genre: "Pop Latino" },
  { title: "Sin Pijama", artist: "Becky G ft. Natti Natasha", genre: "Reggaeton" },
  { title: "DOLLAR", artist: "Becky G ft. Myke Towers", genre: "Reggaeton" },
  { title: "Muchacha", artist: "Becky G", genre: "Pop Latino" },
  { title: "La Respuesta", artist: "Becky G ft. Maluma", genre: "Pop Latino" },
  { title: "Maluma Baby", artist: "Becky G x Maluma", genre: "Pop Latino" },
  { title: "MALA SANTA", artist: "Becky G", genre: "Pop Latino" },
  { title: "BAILE CON MI EX", artist: "Becky G", genre: "Pop Latino" },
  { title: "MAMIII", artist: "Becky G ft. Karol G", genre: "Reggaeton" },
  { title: "CHERRY BLOSSOM", artist: "Becky G", genre: "Pop Latino" },
  { title: "Te quiero así", artist: "Becky G", genre: "Pop Latino" },
  { title: "FUEGO", artist: "Becky G", genre: "Pop Latino" },
  { title: "LUZ SIN GRAVEDAD", artist: "Becky G ft. Tainy", genre: "Pop Latino" },
  { title: "LOKERA", artist: "Becky G", genre: "Reggaeton" },
  { title: "ANIMAL", artist: "Becky G ft. Anitta", genre: "Pop Latino" },
  { title: "DAYDREAMER", artist: "Becky G", genre: "Pop" },
  { title: "PROBLEM", artist: "Becky G", genre: "Pop" },
  { title: "Run the World (Girls)", artist: "Becky G", genre: "Pop" },
  { title: "OMG", artist: "Becky G x Anitta", genre: "Pop Latino" },
  { title: "Patties", artist: "Becky G ft. Nicki Minaj", genre: "Pop" },

  // ─────────────────────────────────────────────────────────
  // LA SONORA DINAMITA
  // ─────────────────────────────────────────────────────────
  { title: "A Mover la Colita", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Negro José", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Carola", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Cumbia Nació en Barú", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Sorullo", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Se me perdió la cadenita", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Negra Tomasa", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Rey del Despecho", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Caballo Viejo", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "No me digas No", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Micaela", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Pirata", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Colegiala", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Pollera Colorá", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Danza de los Mirlos", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Chinito", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Cuéntame", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Achí Mamá", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Que bello", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Aguardiente", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Cumbia del Monte", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Boquita Salá", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Baile del Perrito", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Compañera Mía", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Pirulín", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "El Año Viejo", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "María Antonia", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "La Suegra", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Los Santeros", artist: "La Sonora Dinamita", genre: "Cumbia" },
  { title: "Cumbia Colombiana", artist: "La Sonora Dinamita", genre: "Cumbia" },

  // ─────────────────────────────────────────────────────────
  // SEPTETO NACIONAL (Cuba)
  // ─────────────────────────────────────────────────────────
  { title: "Quiéreme Mucho", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Echale Salsita", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Sóngoro Cosongo", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "El Cadete Constitucional", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Suavecito", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "No Juegues Con Los Santos", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Mátame Suavecito", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "El Manicero", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Dame un Cachito pa' Huele", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "La Mora", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Cuba Linda", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "El Brujo de Guanabacoa", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Clave y Guaguancó", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "San Miguel", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "La Múcura", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Tres Lindas Cubanas", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "El Son de la Loma", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Olvídame y Pega la Vuelta", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "El Gallo y la Gallina", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Son de la Loma", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Piña Madura", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Tutankamen", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "Papá Montero", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },
  { title: "El Bongosero", artist: "Septeto Nacional de Ignacio Piñeiro", genre: "Son Cubano" },

  // ─────────────────────────────────────────────────────────
  // YIYO SARANTE
  // ─────────────────────────────────────────────────────────
  { title: "Corazón de Acero", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Qué de Mí", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Probablemente", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Mi Todo", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Doble Servicio", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Sálvame", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Me Hubieras Dicho Antes", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "La Reina del Swing", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Eres Tú", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Te Amo, Te Quiero", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Ni Loca", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Amor Verdadero", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "No Me Olvides", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Borracho De Amor", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Buscando Mi Paz", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Loco Por Ti", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Mi Bachata", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Todo Empieza En La Disco", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "La Salsa Que Mueve", artist: "Yiyo Sarante", genre: "Salsa" },
  { title: "Si Tú Me Dejas", artist: "Yiyo Sarante", genre: "Salsa" },
];

// ============================================================
// FUNCIÓN DE SIEMBRA EN FIREBASE
// ============================================================
async function seedToFirebase() {
  console.log("=".repeat(60));
  console.log("  🎵 SEMBRANDO DISCOGRAFÍAS EN FIREBASE");
  console.log("=".repeat(60));
  console.log(`  Total de canciones a agregar: ${songs.length}`);
  console.log("");

  // 1. Autenticar como admin
  console.log("1. Autenticando como Admin Master...");
  let idToken = "";
  let uid = "";

  try {
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword, returnSecureToken: true }),
      }
    );
    const signInData = await signInRes.json();
    if (!signInRes.ok) throw new Error(JSON.stringify(signInData.error));
    idToken = signInData.idToken;
    uid = signInData.localId;
    console.log(`   ✅ Autenticado como: ${adminEmail} (UID: ${uid})`);
  } catch (err) {
    console.error("   ❌ Error de autenticación:", err.message);
    process.exit(1);
  }

  // 2. Leer canciones existentes
  console.log("\n2. Leyendo autocomplete_songs existente de Firebase...");
  let existingSongs = {};
  try {
    const readRes = await fetch(
      `${dbUrl}/autocomplete_songs.json?auth=${idToken}`,
      { method: "GET" }
    );
    const data = await readRes.json();
    existingSongs = data && typeof data === "object" ? data : {};
    console.log(`   ✅ Canciones existentes en BD: ${Object.keys(existingSongs).length}`);
  } catch (err) {
    console.warn("   ⚠️  No se pudo leer la BD existente, continuando con BD vacía");
  }

  // 3. Construir set de duplicados (título+artista en minúsculas)
  const existingSet = new Set();
  Object.values(existingSongs).forEach((song) => {
    if (song && song.title && song.artist) {
      existingSet.add(`${song.title.toLowerCase().trim()}||${song.artist.toLowerCase().trim()}`);
    }
  });

  // 4. Filtrar nuevas canciones, evitando duplicados
  const toAdd = songs.filter((s) => {
    const key = `${s.title.toLowerCase().trim()}||${s.artist.toLowerCase().trim()}`;
    return !existingSet.has(key);
  });

  console.log(`\n3. Canciones nuevas a agregar (sin duplicados): ${toAdd.length}`);
  if (toAdd.length === 0) {
    console.log("   ℹ️  Todas las canciones ya existen en la base de datos.");
    return;
  }

  // 5. Insertar de a una con PATCH para no sobreescribir
  console.log("\n4. Insertando canciones...");
  let added = 0;
  let errors = 0;
  const now = Date.now();
  const batch = {};

  toAdd.forEach((song, index) => {
    const key = `-disc_${now}_${index}`;
    batch[key] = {
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      count: 0,
      createdAt: now,
    };
  });

  try {
    const patchRes = await fetch(
      `${dbUrl}/autocomplete_songs.json?auth=${idToken}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      }
    );
    if (!patchRes.ok) {
      const errData = await patchRes.json();
      throw new Error(JSON.stringify(errData));
    }
    added = Object.keys(batch).length;
    console.log(`   ✅ ${added} canciones insertadas con éxito`);
  } catch (err) {
    console.error("   ❌ Error al insertar canciones:", err.message);
    errors++;
  }

  // 6. Resumen final
  console.log("\n" + "=".repeat(60));
  console.log("  🎉 SIEMBRA COMPLETADA");
  console.log("=".repeat(60));
  console.log(`  ✅ Canciones agregadas    : ${added}`);
  console.log(`  ❌ Errores                : ${errors}`);
  console.log(`  📊 Total en BD (aprox.)   : ${Object.keys(existingSongs).length + added}`);
  console.log("");
  
  // Desglose por artista
  console.log("  📋 Desglose por artista:");
  const byArtist = {};
  toAdd.forEach(s => {
    byArtist[s.artist] = (byArtist[s.artist] || 0) + 1;
  });
  Object.entries(byArtist).forEach(([artist, count]) => {
    console.log(`     • ${artist}: ${count} canciones`);
  });
  console.log("=".repeat(60));
}

seedToFirebase();
