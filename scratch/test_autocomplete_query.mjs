import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Testing autocomplete query...");
    const res = await client.query("SELECT * FROM autocomplete_songs ORDER BY created_at DESC LIMIT 1000");
    console.log("Returned rows:", res.rows.length);
    if (res.rows.length > 0) {
      console.log("First row:", res.rows[0]);
    }
  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
