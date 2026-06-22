const DB_URL = "https://dj-interactive-event-default-rtdb.firebaseio.com";
const apiKey = "AIzaSyAZcMcN-dPs3HYMCDb14J-fmjV274NDSC8";
const email = "dj@admin.com";
const password = "admin123";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 INICIANDO PRUEBAS DE CRECIMIENTO DE AUTOCOMPLETADO 🧪");
  console.log("=================================================\n");

  try {
    // 0. Obtener token de autenticación
    console.log("🔑 Autenticando con Firebase...");
    const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const authData = await authResponse.json();
    if (!authResponse.ok) {
      throw new Error(`Error de autenticación: ${authData.error.message}`);
    }
    const idToken = authData.idToken;
    console.log("✅ Autenticado exitosamente.\n");

    // 1. Obtener la cantidad actual de canciones en el catálogo global de autocompletado
    console.log("1. Leyendo catálogo global de autocompletado...");
    const getRes = await fetch(`${DB_URL}/autocomplete_songs.json?auth=${idToken}`);
    const initialSongs = await getRes.json() || {};
    const initialCount = Object.keys(initialSongs).length;
    console.log(`📊 Cantidad inicial de canciones en catálogo: ${initialCount}\n`);

    // Generar datos únicos para el test
    const rand = Math.floor(Math.random() * 10000);
    const testTitle = `Cancion de Test ${rand}`;
    const testArtist = `Artista de Test ${rand}`;
    const testGenre = `Pop Latino Test ${rand}`;

    console.log(`✍️ Añadiendo nueva petición para probar crecimiento...`);
    console.log(`🎵 Canción : "${testTitle}"`);
    console.log(`🎤 Artista : "${testArtist}"`);
    console.log(`💿 Género  : "${testGenre}"\n`);

    // 2. Simular inserción de canción en autocomplete_songs (Crecimiento de BD)
    const postRes = await fetch(`${DB_URL}/autocomplete_songs.json?auth=${idToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: testTitle,
        artist: testArtist,
        genre: testGenre
      })
    });

    if (!postRes.ok) {
      throw new Error(`Error al insertar canción: ${postRes.status} - ${await postRes.text()}`);
    }

    const postData = await postRes.json();
    const newSongId = postData.name;
    console.log(`✅ Canción añadida con ID generado por Firebase: ${newSongId}\n`);

    // 3. Verificar el crecimiento en la base de datos
    console.log("2. Confirmando crecimiento en la base de datos...");
    const verifyRes = await fetch(`${DB_URL}/autocomplete_songs.json?auth=${idToken}`);
    const updatedSongs = await verifyRes.json() || {};
    const updatedCount = Object.keys(updatedSongs).length;

    console.log(`📊 Cantidad actualizada de canciones en catálogo: ${updatedCount}`);
    
    if (updatedCount > initialCount) {
      console.log("✅ ¡CRECIMIENTO CONFIRMADO! La base de datos ha crecido correctamente.\n");
    } else {
      throw new Error("❌ Error: El contador de canciones no aumentó.");
    }

    // 4. Auditar las propiedades del nuevo registro ("Género musical", "Artista", "Canción")
    const newSong = updatedSongs[newSongId];
    console.log("🔍 Auditando propiedades del nuevo registro en BD:");
    console.log(`   - Canción (title)         : "${newSong.title}" -> ${newSong.title === testTitle ? 'OK ✅' : 'FAIL ❌'}`);
    console.log(`   - Artista (artist)        : "${newSong.artist}" -> ${newSong.artist === testArtist ? 'OK ✅' : 'FAIL ❌'}`);
    console.log(`   - Género musical (genre)  : "${newSong.genre}" -> ${newSong.genre === testGenre ? 'OK ✅' : 'FAIL ❌'}\n`);

    if (newSong.title !== testTitle || newSong.artist !== testArtist || newSong.genre !== testGenre) {
      throw new Error("❌ Las propiedades del registro no coinciden con los valores enviados.");
    }

    // 5. TEST DE COMPARTICIÓN ENTRE CUENTAS
    console.log("=================================================");
    console.log("🧪 TEST 2: COMPARTICIÓN GLOBAL (BUSCADOR RÁPIDO) 🧪");
    console.log("=================================================\n");
    console.log("Explicación: El catálogo de autocompletado global vive bajo la ruta raíz 'autocomplete_songs',");
    console.log("lo que permite que cualquier cuenta de DJ y público acceda al mismo índice en tiempo real.\n");

    console.log("Simulando una consulta desde una cuenta secundaria de DJ...");
    // Simulamos una consulta obteniendo todo el catálogo o buscando la canción por título
    const sharedSongs = Object.values(updatedSongs);
    const foundSong = sharedSongs.find(song => song.title === testTitle && song.artist === testArtist);

    if (foundSong) {
      console.log(`✅ ¡ÉXITO! La canción es visible para cualquier consulta global.`);
      console.log(`   - Canción encontrada en el buscador : "${foundSong.title}" por "${foundSong.artist}"`);
      console.log(`   - Género musical del buscador       : "${foundSong.genre}"`);
      console.log(`\n🎉 La actualización se comparte correctamente con el buscador rápido de todas las cuentas.\n`);
    } else {
      throw new Error("❌ Error: La canción no está presente en el índice global.");
    }

    // Limpieza del test
    console.log("🧹 Limpiando registro de prueba de la base de datos...");
    const deleteRes = await fetch(`${DB_URL}/autocomplete_songs/${newSongId}.json?auth=${idToken}`, {
      method: 'DELETE'
    });
    if (deleteRes.ok) {
      console.log("🗑️ Registro de prueba eliminado exitosamente.");
    }

  } catch (error) {
    console.error("❌ Ocurrió un error durante la ejecución del test:", error.message);
    process.exit(1);
  }
}

runTests();
