import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.lzbozouxqcsthysqnjij',
  password: 'Avante2512*',
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
-- 1. Tabla de canciones de autocompletado
CREATE TABLE IF NOT EXISTS public.autocomplete_songs (
  id text PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL,
  genre text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.autocomplete_songs ENABLE ROW LEVEL SECURITY;

-- Evitar duplicados de políticas si ya existen
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

-- 2. Tabla de sugerencias (feedback)
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  timestamp bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Cualquiera puede insertar sugerencias') THEN
    CREATE POLICY "Cualquiera puede insertar sugerencias" ON public.suggestions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Todos pueden leer sugerencias') THEN
    CREATE POLICY "Todos pueden leer sugerencias" ON public.suggestions FOR SELECT USING (true);
  END IF;
END
$$;
`;

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');
    await client.query(sql);
    console.log('Missing tables and policies created successfully.');
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
