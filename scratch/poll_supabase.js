import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const usRegions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'];
const password = process.env.SUPABASE_DB_PASSWORD || 'Avante2512*';
const projectRef = 'lzbozouxqcsthysqnjij';

async function testConnection(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new Client({
    host: host,
    port: 5432,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: password,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 3000
  });

  try {
    await client.connect();
    console.log(`\n🎉 ¡CONEXIÓN EXITOSA! Región correcta: ${region}`);
    await client.end();
    return true;
  } catch (err) {
    if (err.message && err.message.includes('password authentication failed')) {
      console.log(`\n🎉 ¡CONEXIÓN EXITOSA (pero contraseña incorrecta)! Región correcta: ${region}`);
      return true;
    }
    console.log(`Region ${region}: ${err.message}`);
    return false;
  }
}

async function poll() {
  console.log("⏱️ Iniciando sondeo de regiones de Supabase...");
  for (let i = 0; i < 12; i++) {
    console.log(`\n--- Intento ${i + 1}/12 ---`);
    for (const region of usRegions) {
      const ok = await testConnection(region);
      if (ok) {
        console.log(`\n👉 Región identificada con éxito: ${region}`);
        process.exit(0);
      }
    }
    console.log("Esperando 10 segundos antes del siguiente intento...");
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  console.log("\n❌ No se pudo establecer conexión en ninguna región de EE.UU. en 2 minutos.");
}

poll();
