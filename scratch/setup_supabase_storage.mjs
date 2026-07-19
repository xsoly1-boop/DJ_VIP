import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = `
-- 1. Crear el bucket 'logos' si no existe en storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos', 
  'logos', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en storage.objects si no estuviera
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen para evitar conflictos
DROP POLICY IF EXISTS "Permitir lectura pública de logos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida de logos a DJs autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de logos propios" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrado de logos propios" ON storage.objects;

-- 2. Crear política para permitir lectura pública de logos
CREATE POLICY "Permitir lectura pública de logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- 3. Crear política para permitir subida de logos a DJs autenticados
CREATE POLICY "Permitir subida de logos a DJs autenticados" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

-- 4. Crear política para permitir actualización de logos propios a DJs autenticados
CREATE POLICY "Permitir actualización de logos propios" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );

-- 5. Crear política para permitir borrado de logos propios a DJs autenticados
CREATE POLICY "Permitir borrado de logos propios" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND 
    auth.role() = 'authenticated'
  );
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Setting up Supabase Storage 'logos' bucket and policies...");
    await client.query(sql);
    console.log("Storage bucket 'logos' and policies successfully configured!");
  } catch (err) {
    console.error("Setup failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
