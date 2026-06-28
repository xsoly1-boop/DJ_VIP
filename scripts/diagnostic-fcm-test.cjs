const fcmSender = require('./fcm-sender.cjs');

async function runDiagnosticTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('⚡ DIAGNÓSTICO Y TEST EXHAUSTIVO DE NOTIFICACIONES PUSH ANDROID ⚡');
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    const db = fcmSender.getDatabase();
    console.log('🔍 Conectando a Realtime Database y escaneando usuarios...');
    
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) {
      console.log('❌ No se encontraron usuarios en la base de datos.');
      process.exit(1);
    }
    
    const users = usersSnap.val();
    let androidDevicesFound = [];
    
    Object.entries(users).forEach(([uid, userData]) => {
      if (userData && userData.devices && typeof userData.devices === 'object') {
        const username = userData.displayName || userData.email || uid;
        Object.entries(userData.devices).forEach(([deviceId, device]) => {
          if (device && device.fcmToken) {
            androidDevicesFound.push({
              uid,
              username,
              deviceId,
              fcmToken: device.fcmToken,
              platform: device.platform || 'unknown',
              lastUpdated: device.timestamp ? new Date(device.timestamp).toISOString() : 'Desconocida'
            });
          }
        });
      }
    });

    console.log(`📱 Dispositivos con tokens de notificación encontrados en total: ${androidDevicesFound.length}`);
    
    // Filtrar solo los de Android o los que tengan tokens FCM activos
    const androidDevices = androidDevicesFound.filter(d => d.platform.toLowerCase() === 'android');
    console.log(`🤖 Dispositivos Android activos detectados: ${androidDevices.length}`);
    
    if (androidDevices.length === 0) {
      console.log('\n⚠️ ADVERTENCIA: No hay dispositivos Android registrados en la base de datos.');
      console.log('👉 Asegúrate de abrir la app en tu celular Android, haber iniciado sesión,');
      console.log('   y haber aceptado el permiso de notificaciones de la campana.');
      process.exit(0);
    }

    console.log('\n📱 Listado de Dispositivos Registrados a Testear:');
    androidDevices.forEach((device, index) => {
      console.log(`   [${index + 1}] Usuario: ${device.username}`);
      console.log(`       UID: ${device.uid}`);
      console.log(`       Dispositivo ID: ${device.deviceId}`);
      console.log(`       Última Conexión: ${device.lastUpdated}`);
      console.log(`       Token (Corto): ...${device.fcmToken.slice(-15)}`);
    });

    console.log('\n📤 Iniciando ráfaga de 5 notificaciones de prueba nativas...');

    // Tipos de pruebas
    const testPayloads = [
      {
        name: '🎵 [PETICIÓN DE CANCIÓN]',
        payload: {
          notification_type: 'song_request',
          title: '🎶 Nueva Petición de Canción',
          body: 'El público pide: "La Chona - Los Tucanes de Tijuana"',
          song_title: 'La Chona',
          requested_by: 'El Público (Prueba Exhaustiva)',
          channel_id: 'djvip_song_requests',
          timestamp: String(Date.now())
        }
      },
      {
        name: '⏳ [ESTADO DEL PLAN]',
        payload: {
          notification_type: 'plan_expiry',
          title: '⏳ Expiración de Membresía',
          body: 'Atención DJ: Tu plan de suscripción expira en 2 horas.',
          hours_remaining: '2',
          channel_id: 'djvip_plan_status',
          timestamp: String(Date.now())
        }
      },
      {
        name: '✅ [SUSCRIPCIÓN PENDIENTE]',
        payload: {
          notification_type: 'subscription_pending',
          title: '✅ Suscripción Pendiente',
          body: 'DJ VIP Admin: DJ MasterMix solicitó activar el Plan Platinum.',
          username: 'DJ MasterMix',
          plan_name: 'Plan Platinum',
          channel_id: 'djvip_admin_subscriptions',
          timestamp: String(Date.now())
        }
      },
      {
        name: '💬 [SOPORTE PRO]',
        payload: {
          notification_type: 'support_message',
          title: '💬 Soporte PRO',
          body: 'Admin Soporte: "Tu cuenta de VDJ ha sido vinculada correctamente"',
          from_user: 'Soporte DJVIP',
          message_preview: 'Tu cuenta de VDJ ha sido vinculada correctamente',
          channel_id: 'djvip_admin_support',
          timestamp: String(Date.now())
        }
      },
      {
        name: '👤 [NUEVO USUARIO]',
        payload: {
          notification_type: 'new_user_registered',
          title: '👤 Nuevo Registro',
          body: 'Admin Notificación: Nuevo DJ registrado (dj.neon@djvip.com)',
          username: 'DJ Neon Vibes',
          email: 'dj.neon@djvip.com',
          channel_id: 'djvip_admin_users',
          timestamp: String(Date.now())
        }
      }
    ];

    // Recorrer los dispositivos y enviar la ráfaga a cada uno
    for (const device of androidDevices) {
      console.log(`\n👉 Enviando ráfaga a dispositivo de: ${device.username}...`);
      
      for (const test of testPayloads) {
        try {
          const message = {
            token: device.fcmToken,
            data: {
              ...test.payload,
              // Convertir todos los campos a strings estrictos
              ...Object.fromEntries(
                Object.entries(test.payload).map(([k, v]) => [k, String(v)])
              )
            },
            android: {
              priority: 'high'
            }
          };

          const response = await fcmSender.getMessaging().send(message);
          console.log(`   ✅ ${test.name} enviado. ID: ${response.split('/').pop()}`);
        } catch (e) {
          console.error(`   ❌ Falló ${test.name}:`, e.message || e);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ PRUEBA COMPLETADA.');
    console.log('📱 Revisa tu teléfono Android.');
    console.log('   Si la app está en segundo plano o cerrada, deberías ver');
    console.log('   las notificaciones con sus respectivos iconos, títulos y');
    console.log('   sonidos en tu bandeja del sistema.');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('❌ Error crítico en el diagnóstico:', err);
  }
  process.exit(0);
}

runDiagnosticTest();
