import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const host = 'aws-0-us-east-1.pooler.supabase.com';

async function testPort() {
  console.log("Testing port 6543...");
  const client = new Client({
    host: host,
    port: 6543,
    database: 'postgres',
    user: 'postgres.lzbozouxqcsthysqnjij',
    password: process.env.SUPABASE_DB_PASSWORD || 'Avante2512*',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("SUCCESS on port 6543!");
    await client.end();
  } catch (err) {
    console.log("FAILED on port 6543:");
    console.log("Message:", err.message);
    console.log("Code:", err.code);
    console.log("Detail:", err);
  }
}

testPort();
