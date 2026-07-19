import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Adding logo_upload_enabled column to public.profiles...");
    await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS logo_upload_enabled boolean DEFAULT false;
    `);
    console.log("Column added successfully!");
    
    // Let's reload PostgREST schema cache to ensure Supabase notices the new column immediately
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
