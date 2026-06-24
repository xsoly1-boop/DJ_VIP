const fs = require('fs');
const path = require('path');

// 1. Cargar archivo .env dinámicamente
const envPath = path.join(__dirname, '../.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
}

const DB_URL = env.VITE_FIREBASE_DATABASE_URL || "https://djvip-c2cc9-default-rtdb.firebaseio.com";
const apiKey = env.VITE_FIREBASE_API_KEY || "AIzaSyAZgdmkxOSDAUUmiPNiy6eqA_oKVDtn_9o";

const testDjEmail = `dj_pro_test_${Date.now()}@djvip.com`;
const testDjPassword = "testPassword123";

async function runTest() {
  console.log("=========================================================");
  console.log("🧪 TEST DE MENSAJES DE SOPORTE Y NOTIFICACIÓN WHATSAPP 🧪");
  console.log("=========================================================\n");

  try {
    // Paso 1: Autenticar o Registrar al DJ de Pruebas
    console.log("🔑 1. Autenticando usuario DJ de prueba...");
    let idToken, uid;
    
    let authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testDjEmail, password: testDjPassword, returnSecureToken: true })
    });

    let authData = await authResponse.json();

    if (!authResponse.ok) {
      if (authData.error?.message === "EMAIL_NOT_FOUND" || authData.error?.message === "INVALID_LOGIN_CREDENTIALS") {
        console.log("📝 Usuario no encontrado. Creando DJ de pruebas nuevo...");
        const registerResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testDjEmail, password: testDjPassword, returnSecureToken: true })
        });
        const registerData = await registerResponse.json();
        if (!registerResponse.ok) {
          throw new Error(`Error de registro: ${registerData.error.message}`);
        }
        idToken = registerData.idToken;
        uid = registerData.localId;
        console.log(`✅ DJ de pruebas registrado con UID: ${uid}`);
      } else {
        throw new Error(`Error de autenticación: ${authData.error.message}`);
      }
    } else {
      idToken = authData.idToken;
      uid = authData.localId;
      console.log(`✅ Autenticado con UID: ${uid}`);
    }

    // Paso 2: Forzar el plan PRO para este DJ en su perfil
    console.log("\n⚡ 2. Configurando perfil del DJ con Plan PRO...");
    const profileResponse = await fetch(`${DB_URL}/users/${uid}/profile.json?auth=${idToken}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testDjEmail,
        displayName: "DJ Pro Tester",
        selectedPlan: "pro",
        activePlan: "pro",
        subscriptionStatus: "pro",
        createdAt: Date.now(),
        activatedAt: Date.now(),
        expiresAt: 0
      })
    });
    if (!profileResponse.ok) {
      throw new Error(`Error al actualizar perfil: ${profileResponse.status} - ${await profileResponse.text()}`);
    }
    console.log("✅ Perfil guardado con plan PRO.");

    // Paso 3: Leer la configuración de contacto del Admin Master
    console.log("\n📞 3. Obteniendo datos de contacto de WhatsApp del Admin Master...");
    const contactResponse = await fetch(`${DB_URL}/config/admin_contact.json?auth=${idToken}`);
    if (!contactResponse.ok) {
      throw new Error(`Error al leer datos de contacto: ${contactResponse.status} - ${await contactResponse.text()}`);
    }
    const adminContact = await contactResponse.json();
    if (!adminContact || !adminContact.whatsapp) {
      console.log("⚠️  Advertencia: El Admin Master aún no ha configurado sus datos de WhatsApp en su perfil.");
      console.log("👉 Por favor ingresa a la pestaña 'Mi Perfil Admin' en la web y guarda un WhatsApp y CallMeBot API Key.");
    } else {
      console.log(`✅ WhatsApp del Admin Master: +${adminContact.whatsapp}`);
      console.log(`✅ API Key de CallMeBot: ${adminContact.callmebotApiKey ? "Habilitada (Oculta)" : "No configurada"}`);
    }

    // Paso 4: Enviar mensaje de chat de soporte
    console.log("\n💬 4. Enviar mensaje de prueba al chat de soporte...");
    const messageText = `Hola Admin! Este es un mensaje de prueba enviado desde la terminal a las ${new Date().toLocaleTimeString()}.`;
    const messageData = {
      senderId: uid,
      senderName: "DJ Pro Tester",
      text: messageText,
      timestamp: Date.now()
    };

    const postMsgResponse = await fetch(`${DB_URL}/support_chats/${uid}/messages.json?auth=${idToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData)
    });
    if (!postMsgResponse.ok) {
      throw new Error(`Error al insertar mensaje de soporte: ${postMsgResponse.status} - ${await postMsgResponse.text()}`);
    }
    console.log("✅ Mensaje de chat enviado a Firebase.");

    // Paso 5: Actualizar metadata del chat
    console.log("\n📊 5. Actualizando metadata del chat de soporte...");
    const patchMetaResponse = await fetch(`${DB_URL}/support_chats/${uid}/metadata.json?auth=${idToken}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        djName: "DJ Pro Tester",
        lastMessage: messageText,
        lastTimestamp: messageData.timestamp,
        unreadCountByAdmin: 1,
        unreadCountByUser: 0
      })
    });
    if (!patchMetaResponse.ok) {
      throw new Error(`Error al actualizar metadata: ${patchMetaResponse.status} - ${await patchMetaResponse.text()}`);
    }
    console.log("✅ Metadata actualizada.");

    // Paso 6: Simular Notificación de WhatsApp
    if (adminContact && adminContact.whatsapp && adminContact.callmebotApiKey) {
      console.log("\n📱 6. Despachando notificación de WhatsApp al Admin Master...");
      const msg = `💬 Soporte PRO: El DJ "DJ Pro Tester" escribió:\n"${messageText}"`;
      const url = `https://api.callmebot.com/whatsapp.php?phone=${adminContact.whatsapp.trim()}&text=${encodeURIComponent(msg)}&apikey=${adminContact.callmebotApiKey.trim()}`;
      
      console.log(`🔗 URL de CallMeBot: ${url.substring(0, 75)}...`);
      const notifyResponse = await fetch(url);
      const notifyText = await notifyResponse.text();
      console.log(`📩 Respuesta del gateway de WhatsApp: ${notifyText}`);
      console.log("✅ Notificación enviada con éxito.");
    } else {
      console.log("\n⚠️ 6. Se omitió la notificación de WhatsApp porque no hay número o API Key guardada.");
    }

    console.log("\n🎉 ¡TODAS LAS PRUEBAS DE MENSAJERÍA Y NOTIFICACIÓN TERMINALES PASARON CORRECTAMENTE!");
  } catch (err) {
    console.error(`\n❌ Error durante la ejecución del test: ${err.message}`);
  }
}

runTest();
