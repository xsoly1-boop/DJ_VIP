import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Checking events owner_id vs profiles...");
    
    console.log("\nEvents list:");
    const eventsRes = await client.query("SELECT id, title, owner_id FROM events");
    console.table(eventsRes.rows);

    console.log("\nProfiles list:");
    const profilesRes = await client.query("SELECT id, email, display_name FROM profiles");
    console.table(profilesRes.rows);
    
    console.log("\nChecking requests event_id matches events table:");
    const reqsRes = await client.query("SELECT id, event_id, title, status FROM requests");
    console.table(reqsRes.rows);
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
