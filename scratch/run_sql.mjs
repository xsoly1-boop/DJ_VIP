import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = `
-- Tabla de calificaciones/feedback del público
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  session_id text NOT NULL,
  rating integer DEFAULT 5,
  text text,
  timestamp bigint,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, session_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede enviar feedback" ON public.ratings;
CREATE POLICY "Cualquiera puede enviar feedback" ON public.ratings
  FOR ALL USING (true) WITH CHECK (true);

-- Tabla de sugerencias de canciones  
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  artist text,
  timestamp bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Propietario ve sus sugerencias" ON public.suggestions;
CREATE POLICY "Propietario ve sus sugerencias" ON public.suggestions
  FOR SELECT USING (auth.uid() = owner_id OR auth.jwt() ->> 'email' = 'dj@admin.com');

DROP POLICY IF EXISTS "Cualquiera puede insertar sugerencias" ON public.suggestions;
CREATE POLICY "Cualquiera puede insertar sugerencias" ON public.suggestions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin puede borrar sugerencias" ON public.suggestions;
CREATE POLICY "Admin puede borrar sugerencias" ON public.suggestions
  FOR DELETE USING (auth.uid() = owner_id OR auth.jwt() ->> 'email' = 'dj@admin.com');

-- Agregar campo owner_id a autocomplete_songs si no existe (para clearHistoryWithOptions por owner)
ALTER TABLE public.autocomplete_songs ADD COLUMN IF NOT EXISTS owner_id uuid;
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Running ratings & suggestions migration...");
    await client.query(sql);
    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
