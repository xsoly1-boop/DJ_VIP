import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Adding custom_settings column to public.profiles...");
    await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS custom_settings jsonb DEFAULT '{}'::jsonb;
    `);
    console.log("Column added successfully!");
    
    // Reload PostgREST schema cache
    console.log("Reloading schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Schema cache reload triggered successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
