import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'sa-east-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-central-2',
  'eu-north-1',
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2'
];

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`\n📡 Probando región: ${region} (${host})...`);
  const client = new Client({
    host: host,
    port: 5432,
    database: 'postgres',
    user: 'postgres.lzbozouxqcsthysqnjij',
    password: process.env.SUPABASE_DB_PASSWORD || 'Avante2512*',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`🎉 ¡ÉXITO! Conexión exitosa en la región: ${region}`);
    await client.end();
    return host;
  } catch (err) {
    console.log(`❌ Falló región ${region}:`);
    console.log(`   Mensaje: ${err.message}`);
    console.log(`   Código: ${err.code}`);
    console.log(`   Detalle:`, err);
    return null;
  }
}

async function findRegion() {
  for (const region of regions) {
    const successHost = await testRegion(region);
    if (successHost) {
      console.log(`\n👉 El host de base de datos correcto es: ${successHost}`);
      process.exit(0);
    }
  }
  console.log("\n❌ Ninguna de las regiones estándar funcionó.");
}

findRegion();
