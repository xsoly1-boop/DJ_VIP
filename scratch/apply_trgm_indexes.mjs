import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = `
-- Habilitar extensión pg_trgm para búsqueda fuzzy / trigramas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Crear índices GIST para búsqueda difusa (trigramas) en título y artista
CREATE INDEX IF NOT EXISTS idx_autocomplete_songs_title_trgm ON public.autocomplete_songs USING gist (title gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_autocomplete_songs_artist_trgm ON public.autocomplete_songs USING gist (artist gist_trgm_ops);
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Creating pg_trgm extension and indexes...");
    await client.query(sql);
    console.log("pg_trgm indexes created successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
