import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function test() {
  const client = new Client({
    host: 'aws-0-us-west-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || 'Avante2512*',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("SUCCESS with user: postgres!");
    await client.end();
  } catch (err) {
    console.log("FAILED with user: postgres:");
    console.log("Message:", err.message);
    console.log("Code:", err.code);
  }
}

test();
