const DB_URL = "https://dj-interactive-event-default-rtdb.firebaseio.com";
const TEST_USER = "test_user_uid";
const TEST_EVENT = "test_event_dedup";

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .trim();
};

async function getRequests() {
  const res = await fetch(`${DB_URL}/users/${TEST_USER}/events/${TEST_EVENT}/requests.json`);
  return await res.json() || {};
}

async function addRequest(title, artist, genre, dedication, sessionId) {
  const requests = await getRequests();
  const cleanTitle = (title || '').trim();
  const cleanArtist = (artist || '').trim();

  // Buscar si ya existe la canción
  const existingEntry = Object.entries(requests).find(([id, req]) => {
    if (!req || !req.title) return false;
    const reqTitleNormalized = normalizeString(req.title);
    const userTitleNormalized = normalizeString(cleanTitle);
    
    const matchTitle = reqTitleNormalized === userTitleNormalized;
    if (!matchTitle) return false;
    
    const reqArtistNormalized = normalizeString(req.artist);
    const userArtistNormalized = normalizeString(cleanArtist);
    
    const isReqArtistEmpty = reqArtistNormalized === '' || reqArtistNormalized === 'artista no especificado';
    const isUserArtistEmpty = userArtistNormalized === '' || userArtistNormalized === 'artista no especificado';
    
    return isUserArtistEmpty || isReqArtistEmpty || (reqArtistNormalized === userArtistNormalized);
  });

  if (existingEntry) {
    const [existingId, existingReq] = existingEntry;
    const voters = existingReq.voters || {};
    let newVotes = existingReq.votes || 0;
    
    // Sumar voto
    if (!voters[sessionId]) {
      voters[sessionId] = true;
      newVotes += 1;
    } else {
      newVotes += 1; // Sumar voto secundario de la misma sesión
    }
    
    const updates = { votes: newVotes, voters };
    if (dedication && dedication.trim() !== '') {
      const originalDedication = existingReq.dedication || '';
      updates.dedication = originalDedication 
        ? `${originalDedication} | ${dedication.trim()}` 
        : dedication.trim();
    }

    const updateRes = await fetch(`${DB_URL}/users/${TEST_USER}/events/${TEST_EVENT}/requests/${existingId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    return { key: existingId, isDuplicateMerge: true, data: await updateRes.json() };
  }

  // Si no existe, crear la nueva petición
  const newRequest = {
    title: cleanTitle || 'Tema no especificado',
    artist: cleanArtist || 'Artista no especificado',
    genre: genre || 'Personalizado',
    dedication: dedication || '',
    timestamp: Date.now(),
    status: 'pending',
    votes: 0,
    voters: { [sessionId]: true }
  };

  const pushRes = await fetch(`${DB_URL}/users/${TEST_USER}/events/${TEST_EVENT}/requests.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newRequest)
  });
  
  const pushData = await pushRes.json();
  return { key: pushData.name, isDuplicateMerge: false, data: newRequest };
}

async function runQueueTests() {
  console.log("=================================================");
  console.log(" PRUEBAS DE DEDUPLICACIÓN DE COLA Y VOTOS ");
  console.log("=================================================\n");

  try {
    // 0. Limpiar solicitudes de prueba anteriores borrando individualmente los elementos de la cola
    console.log("🧹 Preparando entorno de test (Limpiando cola)...");
    const oldRequests = await getRequests();
    for (const key of Object.keys(oldRequests)) {
      await fetch(`${DB_URL}/users/${TEST_USER}/events/${TEST_EVENT}/requests/${key}.json`, { method: 'DELETE' });
    }

    const songTitle = "One More Time";
    const songArtist = "Daft Punk";
    const songGenre = "Electronic";

    console.log("1. Enviando la primera petición de la canción...");
    const res1 = await addRequest(songTitle, songArtist, songGenre, "Para bailar", "session_user_1");
    console.log(`✅ Creada nueva petición con ID: ${res1.key}`);
    console.log(`   - Votos iniciales : ${res1.data.votes}`);
    console.log(`   - Dedicatoria     : "${res1.data.dedication}"\n`);

    console.log("2. Enviando la segunda petición para la MISMA canción (Diferente Usuario)...");
    const res2 = await addRequest(songTitle, songArtist, songGenre, "Para mi novia", "session_user_2");
    console.log(`✅ Fusión/Merge detectado : ${res2.isDuplicateMerge ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   - ID de la petición   : ${res2.key} (Igual que la primera: ${res2.key === res1.key ? 'SÍ ✅' : 'NO ❌'})`);
    console.log(`   - Votos actualizados  : ${res2.data.votes}`);
    console.log(`   - Dedicatoria unificada: "${res2.data.dedication}"\n`);

    if (res2.key !== res1.key || !res2.isDuplicateMerge) {
      throw new Error("❌ Error: Debería haberse fusionado la petición.");
    }
    if (res2.data.votes !== 1) {
      throw new Error(`❌ Error: El recuento de votos debería ser 1, pero es ${res2.data.votes}`);
    }

    console.log("3. Enviando la tercera petición para la MISMA canción (Mismo Usuario)...");
    const res3 = await addRequest(songTitle, songArtist, songGenre, "Otra dedicatoria", "session_user_2");
    console.log(`✅ Fusión/Merge detectado : ${res3.isDuplicateMerge ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   - Votos actualizados  : ${res3.data.votes}`);
    console.log(`   - Dedicatoria unificada: "${res3.data.dedication}"\n`);

    if (res3.data.votes !== 2) {
      throw new Error(`❌ Error: El recuento de votos debería ser 2, pero es ${res3.data.votes}`);
    }

    // Limpiar base de datos al finalizar
    console.log("🧹 Limpiando los nodos de prueba de la cola...");
    const finalRequests = await getRequests();
    for (const key of Object.keys(finalRequests)) {
      await fetch(`${DB_URL}/users/${TEST_USER}/events/${TEST_EVENT}/requests/${key}.json`, { method: 'DELETE' });
    }
    console.log("🎉 ¡TODAS LAS PRUEBAS DE DEDUPLICACIÓN PASARON CORRECTAMENTE!");

  } catch (error) {
    console.error("❌ Ocurrió un error en el test de cola:", error.message);
    process.exit(1);
  }
}

runQueueTests();
