import admin from 'firebase-admin';
import { readFileSync, writeFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}

const desktopPath = '/Users/dorian/Desktop/importar_todo_autocompletado.sql';

async function main() {
  console.log('📡 Conectando a Firebase en línea para obtener las canciones...');
  const db = admin.database();
  const snap = await db.ref('autocomplete_songs').once('value');
  const songs = snap.val() || {};
  const songKeys = Object.keys(songs);
  console.log(`ℹ️  Se obtuvieron ${songKeys.length} canciones desde Firebase.`);

  if (songKeys.length === 0) {
    console.error('❌ No se encontraron canciones en autocomplete_songs.');
    process.exit(1);
  }

  let sqlContent = `-- Script de creación y carga masiva de las 23,746 canciones
-- Copia todo este código y ejecútalo en la pestaña SQL Editor de tu Dashboard de Supabase

-- Agregar columna para preferencias de diseño del perfil si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_settings jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.autocomplete_songs (
  id text PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL,
  genre text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar seguridad RLS
ALTER TABLE public.autocomplete_songs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Cualquiera puede leer canciones de autocompletado') THEN
    CREATE POLICY "Cualquiera puede leer canciones de autocompletado" ON public.autocomplete_songs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Cualquiera puede gestionar canciones de autocompletado') THEN
    CREATE POLICY "Cualquiera puede gestionar canciones de autocompletado" ON public.autocomplete_songs FOR ALL USING (true);
  END IF;
END
$$;

-- Limpiar tabla previa si existe
TRUNCATE TABLE public.autocomplete_songs;

-- Insertar canciones por lotes de 1000 para no saturar la sentencia
`;

  const escapeSql = (str) => {
    if (!str) return '';
    return str.replace(/'/g, "''");
  };

  const batchSize = 1000;
  for (let i = 0; i < songKeys.length; i += batchSize) {
    const batch = songKeys.slice(i, i + batchSize);
    sqlContent += `INSERT INTO public.autocomplete_songs (id, title, artist, genre) VALUES\n`;
    
    const valueRows = [];
    for (const key of batch) {
      const song = songs[key] || {};
      const title = escapeSql(song.title || '');
      const artist = escapeSql(song.artist || '');
      const genre = escapeSql(song.genre || '');
      valueRows.push(`('${escapeSql(key)}', '${title}', '${artist}', '${genre}')`);
    }

    sqlContent += valueRows.join(',\n') + ';\n\n';
  }

  writeFileSync(desktopPath, sqlContent, 'utf8');
  console.log(`🎉 ¡Éxito! El script de base de datos se ha creado en: ${desktopPath}`);
  console.log(`   (Tamaño del archivo: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB)`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error general:', err);
  process.exit(1);
});
