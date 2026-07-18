import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function test() {
  console.log("Testing with SNI servername...");
  const client = new Client({
    host: 'aws-0-us-west-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.lzbozouxqcsthysqnjij',
    password: process.env.SUPABASE_DB_PASSWORD || 'Avante2512*',
    ssl: {
      rejectUnauthorized: false,
      servername: 'db.lzbozouxqcsthysqnjij.supabase.co'
    }
  });

  try {
    await client.connect();
    console.log("SUCCESS with SNI!");
    await client.end();
  } catch (err) {
    console.log("FAILED with SNI:");
    console.log("Message:", err.message);
    console.log("Code:", err.code);
    console.log("Detail:", err);
  }
}

test();
