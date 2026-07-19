import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Querying latest 10 requests...");
    const res = await client.query("SELECT * FROM requests ORDER BY created_at DESC LIMIT 10");
    console.log("Requests count:", res.rows.length);
    console.table(res.rows.map(r => ({
      id: r.id,
      event_id: r.event_id,
      title: r.title,
      artist: r.artist,
      status: r.status,
      created_at: r.created_at
    })));
  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
