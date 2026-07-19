import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Querying profile details...");
    const res = await client.query("SELECT * FROM profiles WHERE id = '9f71a545-b58f-4382-9923-43f34a05be10'");
    console.table(res.rows.map(r => ({
      id: r.id,
      email: r.email,
      display_name: r.display_name,
      subscription_status: r.subscription_status
    })));
  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
