import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

const supabase = createClient(
  'https://lzbozouxqcsthysqnjij.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Ym96b3V4cWNzdGh5c3FuamlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM0NDA3MywiZXhwIjoyMDk5OTIwMDczfQ.5EqvQWd49xxKMS7TM6pbl7aqxcHT1UgEHnTi4u6jHSg'
);

async function checkColumn() {
  try {
    const { error } = await supabase.from('profiles').select('custom_settings').limit(1);
    if (!error) return true;
    return false;
  } catch (err) {
    return false;
  }
}

async function poll() {
  console.log('⏱️ Iniciando monitoreo de la base de datos...');
  for (let i = 0; i < 60; i++) {
    const exists = await checkColumn();
    if (exists) {
      console.log('\n🎉 ¡Detectado! La columna custom_settings ya existe en la base de datos.');
      console.log('⚡ Iniciando migración automática del respaldo...');
      try {
        const out = execSync('node scratch/migrate_backup_to_supabase.mjs', { encoding: 'utf8' });
        console.log(out);
      } catch (err) {
        console.error('❌ Error al correr la migración:', err.message);
      }
      process.exit(0);
    }
    
    // Imprimir progreso discreto
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  console.log('\n⏱️ Se agotó el tiempo de espera. La columna no fue creada.');
  process.exit(0);
}

poll();
