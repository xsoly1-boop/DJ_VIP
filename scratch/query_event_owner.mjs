import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Querying event details...");
    const res = await client.query("SELECT * FROM events WHERE id = 'demo-griselle-mqygu1y7'");
    console.table(res.rows.map(r => ({
      id: r.id,
      owner_id: r.owner_id,
      title: r.title,
      dj_name: r.dj_name,
      active: r.active
    })));
  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
