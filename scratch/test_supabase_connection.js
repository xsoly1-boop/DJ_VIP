import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Falta configurar las variables de entorno de Supabase en el archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log("📡 Probando conexión con Supabase...");
  console.log(`URL: ${supabaseUrl}`);
  
  // Consultar perfiles
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('relation "public.profiles" does not exist')) {
      console.log("✅ ¡Conexión exitosa! Pero la tabla 'profiles' aún no existe en tu base de datos.");
      console.log("👉 Por favor, ejecuta el script 'scratch/supabase_schema.sql' en el SQL Editor de tu consola de Supabase.");
    } else {
      console.error("❌ Error de conexión/consulta en Supabase:", error);
    }
  } else {
    console.log("✅ ¡Conexión exitosa y la tabla 'profiles' fue consultada correctamente!");
    console.log("Datos obtenidos:", data);
  }
}

testConnection();
