import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const host = 'aws-0-us-west-2.pooler.supabase.com';
const password = process.env.SUPABASE_DB_PASSWORD || 'Avante2512*';
const ref = 'lzbozouxqcsthysqnjij';

const combinations = [
  { user: `postgres.${ref}`, db: 'postgres', port: 5432 },
  { user: `postgres.${ref}`, db: 'postgres', port: 6543 },
  { user: 'postgres', db: `postgres.${ref}`, port: 5432 },
  { user: 'postgres', db: `postgres.${ref}`, port: 6543 },
  { user: `postgres.${ref}`, db: `postgres.${ref}`, port: 5432 },
  { user: `postgres.${ref}`, db: `postgres.${ref}`, port: 6543 },
  { user: `postgres`, db: 'postgres', port: 5432 },
  { user: `postgres`, db: 'postgres', port: 6543 }
];

async function runCombinations() {
  for (const c of combinations) {
    console.log(`\nTesting: user=${c.user}, db=${c.db}, port=${c.port}...`);
    const client = new Client({
      host: host,
      port: c.port,
      database: c.db,
      user: c.user,
      password: password,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`🎉 SUCCESS! user=${c.user}, db=${c.db}, port=${c.port}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }
}

runCombinations();
