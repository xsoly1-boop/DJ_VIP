// Crear usuario admin en Supabase Auth con service_role key
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lzbozouxqcsthysqnjij.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Ym96b3V4cWNzdGh5c3FuamlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM0NDA3MywiZXhwIjoyMDk5OTIwMDczfQ.5EqvQWd49xxKMS7TM6pbl7aqxcHT1UgEHnTi4u6jHSg'
);

async function createAdmin() {
  const ADMIN_EMAIL    = 'dj@admin.com';
  const ADMIN_PASSWORD = 'admin123';

  console.log('Verificando si el usuario admin ya existe...');

  // Intentar crear el usuario (service_role puede hacerlo sin confirmación de email)
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,         // Marcar como confirmado directamente
    user_metadata: {
      displayName: 'DJ Administrador Master',
      isAdmin: true,
      role: 'dj'
    }
  });

  if (error) {
    if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
      console.log('⚠️  El usuario ya existe. Actualizando contraseña...');

      // Listar usuarios para encontrar el ID
      const { data: list } = await supabase.auth.admin.listUsers();
      const existingUser = list?.users?.find(u => u.email === ADMIN_EMAIL);

      if (existingUser) {
        const { error: updErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: ADMIN_PASSWORD,
          email_confirm: true
        });
        if (updErr) {
          console.error('❌ Error al actualizar:', updErr.message);
        } else {
          console.log(`✅ Contraseña actualizada para ${ADMIN_EMAIL}`);
          console.log(`   UUID: ${existingUser.id}`);
        }
      }
    } else {
      console.error('❌ Error al crear usuario:', error.message);
      return;
    }
  } else {
    console.log(`\n✅ Usuario admin creado exitosamente:`);
    console.log(`   Email   : ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   UUID    : ${data.user?.id}`);
  }

  // Verificar que puede hacer login
  console.log('\nVerificando login...');
  const { data: session, error: loginErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (loginErr) {
    console.error('❌ Login falló:', loginErr.message);
  } else {
    console.log('✅ Login exitoso!');
    console.log(`   User ID: ${session.user?.id}`);
    console.log(`\n====================================`);
    console.log(`CREDENCIALES CORRECTAS:`);
    console.log(`  Email   : ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`====================================`);
  }
}

createAdmin().catch(console.error);
