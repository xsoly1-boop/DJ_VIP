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
  console.log('📡 Obteniendo las 23,746 canciones desde Firebase...');
  const db = admin.database();
  const snap = await db.ref('autocomplete_songs').once('value');
  const songs = snap.val() || {};
  const songKeys = Object.keys(songs);
  console.log(`ℹ️  Se obtuvieron ${songKeys.length} canciones.`);

  if (songKeys.length === 0) {
    console.error('❌ No hay canciones para importar.');
    process.exit(1);
  }

  // Limpiar tabla antes
  console.log('🧹 Limpiando la tabla de autocompletado en Supabase...');
  const { error: deleteError } = await supabase
    .from('autocomplete_songs')
    .delete()
    .neq('id', 'dummy'); // Elimina todo

  if (deleteError) {
    console.error('⚠️ Error al limpiar tabla (puede que no exista aún):', deleteError.message);
    process.exit(1);
  }

  console.log('📤 Subiendo canciones en lotes de 1000 a Supabase...');
  const batchSize = 1000;
  
  for (let i = 0; i < songKeys.length; i += batchSize) {
    const batch = songKeys.slice(i, i + batchSize);
    const rows = batch.map(key => ({
      id: key,
      title: songs[key].title || '',
      artist: songs[key].artist || '',
      genre: songs[key].genre || ''
    }));

    const { error } = await supabase
      .from('autocomplete_songs')
      .insert(rows);

    if (error) {
      console.error(`❌ Error en el lote ${i} - ${i + batchSize}:`, error.message);
    } else {
      console.log(`   ✅ Lote ${i + rows.length} / ${songKeys.length} subido con éxito.`);
    }
  }

  console.log('🎉 ¡Todas las canciones se han importado exitosamente a Supabase!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error general:', err);
  process.exit(1);
});
