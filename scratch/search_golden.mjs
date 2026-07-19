import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Checking if 'Golden' exists in autocomplete_songs...");
    const res = await client.query("SELECT * FROM autocomplete_songs WHERE LOWER(title) LIKE '%golden%'");
    console.log("Found matches:", res.rows.length);
    console.table(res.rows);
  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
