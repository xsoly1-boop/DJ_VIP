// ============================================================
// SCRIPT: Agregar Soundtrack de K-Pop Demon Hunters (Netflix 2025)
// ============================================================

const apiKey = "AIzaSyAZcMcN-dPs3HYMCDb14J-fmjV274NDSC8";
const dbUrl = "https://dj-interactive-event-default-rtdb.firebaseio.com";
const adminEmail = "dj@admin.com";
const adminPassword = "admin123";

const songs = [
  // ─── HUNTR/X ───────────────────────────────────────────────
  { title: "How It's Done", artist: "HUNTR/X (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },
  { title: "Golden", artist: "HUNTR/X (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },
  { title: "Takedown", artist: "HUNTR/X (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },
  { title: "What It Sounds Like", artist: "HUNTR/X (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },
  { title: "Free", artist: "Rumi & Jinu - K-Pop Demon Hunters", genre: "Kpop / Soundtrack" },

  // ─── SAJA BOYS ─────────────────────────────────────────────
  { title: "Soda Pop", artist: "Saja Boys (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },
  { title: "Your Idol", artist: "Saja Boys (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },

  // ─── TWICE (colaboración oficial) ──────────────────────────
  { title: "TAKEDOWN (feat. TWICE)", artist: "HUNTR/X x TWICE", genre: "Kpop / Soundtrack" },
  { title: "Strategy", artist: "TWICE (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },

  // ─── Otros artistas del soundtrack ─────────────────────────
  { title: "Love, Maybe", artist: "MeloMance (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },
  { title: "Path", artist: "Jokers (K-Pop Demon Hunters)", genre: "Kpop / Soundtrack" },
];

async function seedToFirebase() {
  console.log("=".repeat(60));
  console.log("  🎵 K-POP DEMON HUNTERS — SEMBRANDO SOUNDTRACK");
  console.log("=".repeat(60));
  console.log(`  Canciones del soundtrack: ${songs.length}`);
  console.log("");

  // 1. Autenticar
  console.log("1. Autenticando como Admin Master...");
  let idToken = "";
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword, returnSecureToken: true }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data.error));
    idToken = data.idToken;
    console.log(`   ✅ Autenticado como: ${adminEmail}`);
  } catch (err) {
    console.error("   ❌ Error de autenticación:", err.message);
    process.exit(1);
  }

  // 2. Leer BD existente
  console.log("\n2. Leyendo canciones existentes en Firebase...");
  let existing = {};
  try {
    const res = await fetch(`${dbUrl}/autocomplete_songs.json?auth=${idToken}`);
    const data = await res.json();
    existing = data && typeof data === "object" ? data : {};
    console.log(`   ✅ Canciones en BD: ${Object.keys(existing).length}`);
  } catch {
    console.warn("   ⚠️  No se pudo leer la BD, continuando...");
  }

  // 3. Filtrar duplicados
  const existingSet = new Set();
  Object.values(existing).forEach((s) => {
    if (s?.title && s?.artist)
      existingSet.add(`${s.title.toLowerCase().trim()}||${s.artist.toLowerCase().trim()}`);
  });

  const toAdd = songs.filter((s) => {
    const key = `${s.title.toLowerCase().trim()}||${s.artist.toLowerCase().trim()}`;
    return !existingSet.has(key);
  });

  const skipped = songs.length - toAdd.length;
  console.log(`\n3. Nuevas (sin duplicados): ${toAdd.length} | Ya existían: ${skipped}`);

  if (toAdd.length === 0) {
    console.log("   ℹ️  Todas las canciones ya están registradas.");
    return;
  }

  // 4. Insertar
  console.log("\n4. Insertando canciones del soundtrack...");
  const now = Date.now();
  const batch = {};
  toAdd.forEach((song, i) => {
    batch[`-kpdh_${now}_${i}`] = {
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      count: 0,
      createdAt: now,
    };
  });

  try {
    const res = await fetch(`${dbUrl}/autocomplete_songs.json?auth=${idToken}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }
    console.log(`   ✅ ${toAdd.length} canciones insertadas con éxito`);
  } catch (err) {
    console.error("   ❌ Error al insertar:", err.message);
    process.exit(1);
  }

  // 5. Resumen
  console.log("\n" + "=".repeat(60));
  console.log("  🎉 SOUNDTRACK AGREGADO EXITOSAMENTE");
  console.log("=".repeat(60));
  console.log(`  📀 Álbum      : K-Pop Demon Hunters (Netflix, 2025)`);
  console.log(`  🎵 Agregadas  : ${toAdd.length} canciones`);
  console.log(`  ⏭️  Omitidas   : ${skipped} (ya existían)`);
  console.log(`  📊 Total en BD: ~${Object.keys(existing).length + toAdd.length} canciones`);
  console.log("");
  console.log("  📋 Canciones agregadas:");
  toAdd.forEach((s) => console.log(`     • "${s.title}" — ${s.artist}`));
  console.log("=".repeat(60));
}

seedToFirebase();
