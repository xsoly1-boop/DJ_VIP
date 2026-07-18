import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = `
-- Agregar columna dj_online a events (si no existe)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS dj_online boolean DEFAULT false;

-- Agregar columna web_name_font_size a events (si no existe)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS web_name_font_size integer DEFAULT 11;

-- Agregar columna bg_skin a events (si no existe)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS bg_skin text DEFAULT 'default';

-- Agregar columna promo_tiktok a events (si no existe)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS promo_tiktok text;
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Adding djOnline column to events...");
    await client.query(sql);
    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
