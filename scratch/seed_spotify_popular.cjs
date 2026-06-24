const fs = require('fs');
const path = require('path');

// 1. Cargar archivo .env dinámicamente
const envPath = path.join(__dirname, '../.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
}

const DB_URL = env.VITE_FIREBASE_DATABASE_URL || "https://djvip-c2cc9-default-rtdb.firebaseio.com";

// Función de normalización de cadenas para deduplicación
function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // eliminar acentos
    .replace(/[^a-z0-9]/g, "");     // conservar sólo caracteres alfanuméricos
}

// Analizador simple de líneas CSV que respeta las comillas dobles
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function run() {
  console.log("==============================================================");
  console.log("🚀 INICIANDO IMPORTACIÓN DE CANCIONES POPULARES DE SPOTIFY 🚀");
  console.log("==============================================================\n");

  try {
    // Paso 1: Leer el catálogo actual de Firebase
    console.log("🔍 1. Leyendo catálogo actual de autocompletado en Firebase...");
    const res = await fetch(`${DB_URL}/autocomplete_songs.json`);
    if (!res.ok) {
      throw new Error(`Error al leer catálogo actual: ${res.status} - ${await res.text()}`);
    }
    const existingData = await res.json();
    const existingKeys = Object.keys(existingData || {});
    console.log(`📊 Total de canciones actualmente en la base: ${existingKeys.length}`);

    // Determinar el ID numérico más alto y armar set de búsqueda
    let maxId = 0;
    const existingMap = new Set();

    existingKeys.forEach(k => {
      const song = existingData[k];
      const num = parseInt(k, 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
      if (song && song.title && song.artist) {
        existingMap.add(normalize(song.title) + "|" + normalize(song.artist));
      }
    });

    console.log(`📈 ID numérico más alto en base de datos: ${maxId}`);

    // Paso 2: Descargar el dataset CSV de Spotify de TidyTuesday
    console.log("\n📥 2. Descargando dataset Spotify desde TidyTuesday (32k+ canciones)...");
    const csvRes = await fetch("https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv");
    if (!csvRes.ok) {
      throw new Error(`Error al descargar el CSV: ${csvRes.status}`);
    }
    const csvText = await csvRes.text();
    const lines = csvText.split("\n");
    console.log(`✅ CSV cargado. Total de líneas leídas: ${lines.length}`);

    // Paso 3: Parsear y deduplicar datos
    console.log("\n🧹 3. Procesando y deduplicando canciones...");
    const spotifyMap = new Map();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const fields = parseCSVLine(line);
      if (fields.length < 4) continue;

      const title = fields[1]?.trim();
      const artist = fields[2]?.trim();
      const popularityVal = parseInt(fields[3], 10);
      const genre = fields[9]?.trim() || "Pop";

      if (!title || !artist) continue;

      const normKey = normalize(title) + "|" + normalize(artist);

      // Si la canción ya existe en Firebase, la ignoramos
      if (existingMap.has(normKey)) continue;

      const popularity = isNaN(popularityVal) ? 0 : popularityVal;

      // Deduplicación interna: mantener sólo el registro con mayor popularidad
      const existingRecord = spotifyMap.get(normKey);
      if (!existingRecord || existingRecord.popularity < popularity) {
        spotifyMap.set(normKey, { title, artist, genre, popularity });
      }
    }

    console.log(`📊 Canciones nuevas y únicas identificadas del CSV: ${spotifyMap.size}`);

    // Paso 4: Ordenar por popularidad y tomar las mejores 1000+
    console.log("\n🏆 4. Seleccionando las canciones más populares de Spotify...");
    const sortedTracks = Array.from(spotifyMap.values())
      .sort((a, b) => b.popularity - a.popularity);

    const limit = Math.min(1000, sortedTracks.length);
    if (limit < 1000) {
      console.warn(`⚠️ Sólo hay ${sortedTracks.length} canciones nuevas disponibles.`);
    }
    const songsToImport = sortedTracks.slice(0, limit);

    console.log(`🎯 Seleccionadas las ${songsToImport.length} canciones con mayor nivel de popularidad.`);

    // Paso 5: Armar el objeto payload para PATCH
    console.log("\n📦 5. Preparando lote de actualización para Firebase...");
    const payload = {};
    let nextId = maxId + 1;

    songsToImport.forEach(song => {
      payload[nextId.toString()] = {
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        globalRequests: 1
      };
      nextId++;
    });

    // Paso 6: Hacer PATCH en Firebase
    console.log("📤 Enviando lote de datos a la base de datos de producción...");
    const patchRes = await fetch(`${DB_URL}/autocomplete_songs.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!patchRes.ok) {
      throw new Error(`Error en el envío PATCH: ${patchRes.status} - ${await patchRes.text()}`);
    }

    console.log(`\n🎉 ¡IMPORTACIÓN MASIVA COMPLETADA CON ÉXITO!`);
    console.log(`✅ Se agregaron ${songsToImport.length} canciones populares nuevas.`);
    console.log(`📈 Rango de nuevos IDs creados: del ${maxId + 1} al ${nextId - 1}`);

  } catch (err) {
    console.error(`\n❌ Error durante la importación: ${err.message}`);
  }
}

run();
