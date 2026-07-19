import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Listing events with their active status:");
    const res = await client.query("SELECT id, title, owner_id, active FROM events");
    console.table(res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}
run();
