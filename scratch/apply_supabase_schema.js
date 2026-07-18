import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const config = {
  host: 'db.lzbozouxqcsthysqnjij.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
};

async function applySchema() {
  const client = new Client(config);
  try {
    console.log("🔌 Conectando a PostgreSQL en Supabase...");
    await client.connect();
    console.log("✅ Conexión establecida.");

    const schemaPath = './scratch/supabase_schema.sql';
    console.log(`📖 Leyendo el archivo de esquema: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log("⚡ Ejecutando sentencias SQL...");
    await client.query(sql);
    console.log("🎉 ¡El esquema de la base de datos se ha creado y configurado correctamente en Supabase!");
  } catch (err) {
    console.error("❌ Error al aplicar el esquema SQL:", err);
  } finally {
    await client.end();
  }
}

applySchema();
