import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lzbozouxqcsthysqnjij.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Ym96b3V4cWNzdGh5c3FuamlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM0NDA3MywiZXhwIjoyMDk5OTIwMDczfQ.5EqvQWd49xxKMS7TM6pbl7aqxcHT1UgEHnTi4u6jHSg'
);

async function main() {
  console.log('🔄 Actualizando URLs de eventos de Vercel a Render...');

  // 1. Obtener todos los eventos
  const { data: events, error } = await supabase
    .from('events')
    .select('id, production_url');

  if (error) {
    console.error('❌ Error al obtener eventos:', error.message);
    process.exit(1);
  }

  console.log(`ℹ️  Se encontraron ${events.length} eventos en total.`);

  let updatedCount = 0;

  for (const event of events) {
    const url = event.production_url;
    // Si la URL contiene vercel.app, está vacía, o es null, la actualizamos
    if (!url || url.includes('vercel.app')) {
      console.log(`   ✏️  Actualizando evento ${event.id}: "${url || 'vacía'}" -> "https://dj-vip.onrender.com/"`);
      
      const { error: updateError } = await supabase
        .from('events')
        .update({ production_url: 'https://dj-vip.onrender.com/' })
        .eq('id', event.id);

      if (updateError) {
        console.error(`      ❌ Error al actualizar ${event.id}:`, updateError.message);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`   ⏭️  Omitiendo evento ${event.id} (tiene URL personalizada: "${url}")`);
    }
  }

  console.log(`\n🎉 ¡Proceso terminado! Se actualizaron ${updatedCount} eventos.`);
  process.exit(0);
}

main();
