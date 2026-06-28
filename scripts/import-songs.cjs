const fs = require('fs');
const path = require('path');
const http = require('https');

const databaseURL = 'https://djvip-c2cc9-default-rtdb.firebaseio.com';
const musicDir = '/Volumes/Mp3_mas/MUSICA MP3';

// Extensiones de audio válidas
const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.wav', '.flac', '.ogg', '.wma', '.mp4', '.m4p']);

// Helper para realizar peticiones HTTP de forma síncrona/prometida
function httpRequest(url, method, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve(parsed);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Función para recorrer directorios recursivamente
function getFilesRecursive(dir) {
  let results = [];
  if (!fs.existsSync(dir)) {
    return results;
  }
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(filePath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (AUDIO_EXTENSIONS.has(ext)) {
        results.push(filePath);
      }
    }
  });
  return results;
}

// Limpiar y sanitizar texto
function sanitize(str) {
  return (str || '').trim().replace(/\s+/g, ' ');
}

// Función principal
async function run() {
  console.log('🚀 Conectando a Firebase Realtime Database (API REST)...');
  
  // 1. Obtener canciones existentes en la base de datos
  console.log('🔍 Obteniendo canciones existentes en la plataforma...');
  const existingSongs = await httpRequest(`${databaseURL}/autocomplete_songs.json`, 'GET') || {};
  
  // Crear mapa de llaves únicas (titulo + "|||" + artista) en minúsculas para búsqueda O(1)
  const existingKeys = new Set();
  Object.keys(existingSongs).forEach(id => {
    const song = existingSongs[id];
    if (song && song.title) {
      const titleClean = sanitize(song.title).toLowerCase();
      const artistClean = sanitize(song.artist || '').toLowerCase();
      existingKeys.add(`${titleClean}|||${artistClean}`);
    }
  });
  
  console.log(`ℹ️  Total de canciones registradas actualmente: ${existingKeys.size}`);

  // 2. Escanear directorio local
  console.log(`📂 Escaneando almacenamiento local en: ${musicDir}...`);
  if (!fs.existsSync(musicDir)) {
    console.error(`❌ La ruta especificada no existe: ${musicDir}`);
    process.exit(1);
  }
  
  const localFiles = getFilesRecursive(musicDir);
  console.log(`🎵 Total de archivos de audio encontrados localmente: ${localFiles.length}`);

  // 3. Procesar archivos y extraer Título, Artista y Género
  const newSongsList = [];
  
  localFiles.forEach(filePath => {
    const filenameWithExt = path.basename(filePath);
    const ext = path.extname(filenameWithExt);
    const filename = filenameWithExt.substring(0, filenameWithExt.length - ext.length);
    
    // Determinar el género basándose en la carpeta contenedora inmediata
    const relativeDir = path.relative(musicDir, path.dirname(filePath));
    let genre = 'Personalizado';
    if (relativeDir && relativeDir !== '.') {
      genre = relativeDir.split(path.sep)[0];
    }
    
    // Extraer Artista y Título
    let title = '';
    let artist = '';
    
    if (filename.includes(' - ')) {
      const parts = filename.split(' - ');
      artist = parts[0];
      title = parts.slice(1).join(' - ');
    } else if (filename.includes('-')) {
      const parts = filename.split('-');
      artist = parts[0];
      title = parts.slice(1).join('-');
    } else {
      artist = 'Artista no especificado';
      title = filename;
    }
    
    title = sanitize(title);
    artist = sanitize(artist);
    genre = sanitize(genre);
    
    if (!title) return;
    
    const key = `${title.toLowerCase()}|||${artist.toLowerCase()}`;
    
    // Validar si ya existe
    if (!existingKeys.has(key)) {
      newSongsList.push({
        title,
        artist,
        genre,
        globalRequests: 1
      });
      existingKeys.add(key);
    }
  });

  console.log(`✨ Total de canciones nuevas listas para importar: ${newSongsList.length}`);

  // 4. Escribir canciones nuevas a Firebase en lotes usando peticiones POST de la API REST
  if (newSongsList.length > 0) {
    console.log('📤 Subiendo canciones nuevas a Firebase...');
    
    const batchSize = 100; // Lote de 100 canciones por petición
    let importedCount = 0;
    
    for (let i = 0; i < newSongsList.length; i += batchSize) {
      const batch = newSongsList.slice(i, i + batchSize);
      
      // Creamos un lote de actualización múltiple en un solo PATCH a la base de datos
      const batchPayload = {};
      batch.forEach(song => {
        // Generar un ID local simulando un push-key aleatorio de Firebase
        const randomId = 'imported_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
        batchPayload[randomId] = song;
      });
      
      console.log(`   ⚡ Subiendo lote de canciones ${i + 1} a ${Math.min(i + batchSize, newSongsList.length)}...`);
      await httpRequest(`${databaseURL}/autocomplete_songs.json`, 'PATCH', batchPayload);
      importedCount += batch.length;
    }
    
    console.log(`✅ ¡Importación exitosa! Se añadieron ${importedCount} canciones nuevas.`);
  } else {
    console.log('😎 Todas tus canciones locales ya están registradas en la plataforma. Nada que importar.');
  }

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error general durante la ejecución:', err);
  process.exit(1);
});
