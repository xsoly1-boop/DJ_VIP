import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.lzbozouxqcsthysqnjij:Avante2512*@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected! Listing active requests in 'requests' table...");
    const resReq = await client.query("SELECT * FROM requests");
    console.log(`Active requests count: ${resReq.rows.length}`);
    console.table(resReq.rows);

    console.log("\nListing played requests in 'played_requests' table...");
    const resPlayed = await client.query("SELECT * FROM played_requests");
    console.log(`Played requests count: ${resPlayed.rows.length}`);
    console.table(resPlayed.rows);

    if (resReq.rows.length > 0) {
      const testReq = resReq.rows[0];
      console.log(`\nTesting status update on request id: ${testReq.id} ("${testReq.title}")`);
      
      // Let's simulate the transaction that updateRequestStatus does in NodeJS
      console.log("Simulating insertion into played_requests...");
      try {
        await client.query("BEGIN");
        
        await client.query(`
          INSERT INTO played_requests (id, event_id, title, artist, genre, dedication, status, votes, timestamp, played_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          testReq.id,
          testReq.event_id,
          testReq.title,
          testReq.artist,
          testReq.genre,
          testReq.dedication,
          'playing',
          testReq.votes,
          testReq.timestamp,
          Date.now()
        ]);
        console.log("Insert into played_requests succeeded!");

        console.log("Simulating deletion from requests...");
        const delRes = await client.query("DELETE FROM requests WHERE id = $1", [testReq.id]);
        console.log(`Delete from requests succeeded! Deleted rows: ${delRes.rowCount}`);

        await client.query("ROLLBACK");
        console.log("Rollback transaction successfully (no changes committed).");
      } catch (txErr) {
        await client.query("ROLLBACK");
        console.error("Transaction failed:", txErr.message);
      }
    } else {
      console.log("No active requests to test with.");
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
