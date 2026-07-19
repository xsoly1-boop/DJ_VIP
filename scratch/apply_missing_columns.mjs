import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = `
-- 1. Agregar columnas faltantes a events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS font_family text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS font_size text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS logo_size text DEFAULT 'medium';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS dedications_enabled boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS bank_clabe text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tip_currency text DEFAULT 'MXN';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS strict_mode_enabled boolean DEFAULT true;

-- 2. Limpiar y recrear tabla de chats de soporte
DROP TABLE IF EXISTS public.support_chats CASCADE;

CREATE TABLE public.support_chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id text NOT NULL,
  text text NOT NULL,
  read boolean DEFAULT false NOT NULL,
  timestamp bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en support_chats
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para support_chats
DROP POLICY IF EXISTS "DJs pueden ver sus propios mensajes de soporte" ON public.support_chats;
CREATE POLICY "DJs pueden ver sus propios mensajes de soporte" ON public.support_chats
  FOR SELECT USING (auth.uid() = dj_id);

DROP POLICY IF EXISTS "DJs pueden enviar mensajes de soporte" ON public.support_chats;
CREATE POLICY "DJs pueden enviar mensajes de soporte" ON public.support_chats
  FOR INSERT WITH CHECK (auth.uid() = dj_id);

DROP POLICY IF EXISTS "Admins pueden gestionar todos los mensajes de soporte" ON public.support_chats;
CREATE POLICY "Admins pueden gestionar todos los mensajes de soporte" ON public.support_chats
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE active_plan = 'pro' OR email = 'dj@admin.com'
    )
  );
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to Supabase! Executing schema upgrades...");
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
