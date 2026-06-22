// Script de siembra para Firebase Real
// Registra/inicia sesión con demo@dj.com y puebla el evento default con las 10 peticiones ficticias.

const apiKey = "AIzaSyAZcMcN-dPs3HYMCDb14J-fmjV274NDSC8";
const dbUrl = "https://dj-interactive-event-default-rtdb.firebaseio.com";
const email = "demo@dj.com";
const password = "demo123";

async function seedFirebase() {
  console.log("=== Sembrando Cuenta Demo en Firebase Real ===");
  
  let uid = "";
  let idToken = "";

  // 1. Intentar registrar al usuario. Si ya existe, iniciar sesión.
  console.log("1. Creando o iniciando sesión de la cuenta demo@dj.com...");
  try {
    const signUpResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const signUpData = await signUpResponse.json();

    if (signUpResponse.ok) {
      uid = signUpData.localId;
      idToken = signUpData.idToken;
      console.log(`  ✅ Cuenta creada con éxito. UID: ${uid}`);
    } else {
      if (signUpData.error && signUpData.error.message === "EMAIL_EXISTS") {
        console.log("  ℹ️ El usuario ya existe. Iniciando sesión...");
        const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const signInData = await signInResponse.json();
        
        if (signInResponse.ok) {
          uid = signInData.localId;
          idToken = signInData.idToken;
          console.log(`  ✅ Sesión iniciada con éxito. UID: ${uid}`);
        } else {
          throw new Error(`Error de inicio de sesión: ${JSON.stringify(signInData.error)}`);
        }
      } else {
        throw new Error(`Error de creación: ${JSON.stringify(signUpData.error)}`);
      }
    }
  } catch (error) {
    console.error("❌ Falló el proceso de autenticación:", error);
    process.exit(1);
  }

  // 2. Definir los datos a sembrar
  const now = Date.now();
  
  const settings = {
    title: "Mega Show en Vivo de DJ Demo",
    logoUrl: "",
    themeColor: "#7c3aed",
    themeColorSecondary: "#06b6d4",
    djName: "DJ Demo",
    dedicationsEnabled: true,
    tipsEnabled: true,
    paypalUsername: "djdemo",
    mercadopagoLink: "https://link.mercadopago.com.mx/djdemo",
    bankClabe: "123456789012345678",
    promoEnabled: true,
    promoWhatsapp: "5215512345678",
    promoWebsite: "https://djdemo.com",
    promoInstagram: "djdemo_oficial",
    promoTiktok: "djdemo_oficial"
  };

  const requests = {
    "req_demo_1": {
      id: "req_demo_1",
      title: "Ella Baila Sola",
      artist: "Eslabon Armado x Peso Pluma",
      genre: "Regional Mexicano",
      dedication: "Para Lupita con todo mi amor de parte de Carlos",
      timestamp: now - 7200000,
      status: "playing",
      votes: 14,
      voters: { "sess_v1": true, "sess_v2": true, "sess_v3": true }
    },
    "req_demo_2": {
      id: "req_demo_2",
      title: "Música Ligera",
      artist: "Soda Stereo",
      genre: "Rock en Español",
      dedication: "¡Para cantar todos juntos esta noche en la cabina!",
      timestamp: now - 3600000,
      status: "accepted",
      votes: 11,
      voters: { "sess_v4": true, "sess_v5": true }
    },
    "req_demo_3": {
      id: "req_demo_3",
      title: "Gatita",
      artist: "Bellakath",
      genre: "Reggaetón",
      dedication: "Dedicado a las chicas de la mesa 5",
      timestamp: now - 2400000,
      status: "accepted",
      votes: 18,
      voters: { "sess_v6": true, "sess_v7": true, "sess_v8": true }
    },
    "req_demo_4": {
      id: "req_demo_4",
      title: "Lamento Boliviano",
      artist: "Enanitos Verdes",
      genre: "Rock en Español",
      dedication: "¡Un clásico infaltable!",
      timestamp: now - 1800000,
      status: "pending",
      votes: 7,
      voters: { "sess_v9": true }
    },
    "req_demo_5": {
      id: "req_demo_5",
      title: "Como La Flor",
      artist: "Selena",
      genre: "Cumbia",
      dedication: "Para mi esposa en nuestro aniversario",
      timestamp: now - 1500000,
      status: "pending",
      votes: 9,
      voters: { "sess_v10": true }
    },
    "req_demo_6": {
      id: "req_demo_6",
      title: "Quevedo: Bzrp Music Sessions, Vol. 52",
      artist: "Bizarrap x Quevedo",
      genre: "Urban/Electro",
      dedication: "¡A bailar toda la noche!",
      timestamp: now - 1200000,
      status: "pending",
      votes: 12,
      voters: { "sess_v11": true, "sess_v12": true }
    },
    "req_demo_7": {
      id: "req_demo_7",
      title: "Dynamite",
      artist: "BTS",
      genre: "Kpop",
      dedication: "Para el grupo de K-pop de la fiesta",
      timestamp: now - 900000,
      status: "pending",
      votes: 4,
      voters: { "sess_v13": true }
    },
    "req_demo_8": {
      id: "req_demo_8",
      title: "Gasolina",
      artist: "Daddy Yankee",
      genre: "Reggaetón",
      dedication: "¡Ponle play para prender la pista!",
      timestamp: now - 600000,
      status: "pending",
      votes: 15,
      voters: { "sess_v14": true, "sess_v15": true }
    },
    "req_demo_9": {
      id: "req_demo_9",
      title: "Save Your Tears",
      artist: "The Weeknd",
      genre: "Pop / Synthwave",
      dedication: "",
      timestamp: now - 300000,
      status: "pending",
      votes: 3,
      voters: { "sess_v16": true }
    },
    "req_demo_10": {
      id: "req_demo_10",
      title: "Tusa",
      artist: "Karol G x Nicki Minaj",
      genre: "Reggaetón",
      dedication: "Para cantar a todo pulmón con las amigas",
      timestamp: now - 60000,
      status: "pending",
      votes: 6,
      voters: { "sess_v17": true }
    }
  };

  const eventsIndex = {
    "default-event": {
      id: "default-event",
      title: settings.title,
      djName: settings.djName,
      date: "2026-06-21",
      archived: false,
      createdAt: now
    }
  };

  const profile = {
    email: email,
    displayName: "DJ Demo"
  };

  const registry = {
    ownerUid: uid,
    title: settings.title,
    djName: settings.djName
  };

  // 3. Escribir a la base de datos en tiempo real de Firebase
  console.log("2. Subiendo configuraciones y peticiones a la base de datos real...");
  try {
    // Escribir perfil del usuario
    await writeDb(`users/${uid}/profile.json`, profile);
    
    // Escribir el índice de eventos del DJ
    await writeDb(`users/${uid}/events_index/default-event.json`, eventsIndex["default-event"]);
    
    // Escribir la configuración de la sala default-event
    await writeDb(`users/${uid}/events/default-event/settings.json`, settings);
    
    // Escribir las 10 peticiones
    await writeDb(`users/${uid}/events/default-event/requests.json`, requests);

    // Registrar en el events_registry público para mapear la sala al UID del DJ
    await writeDb(`events_registry/default-event-${uid}.json`, registry);

    console.log("🎉 ¡Proceso de siembra finalizado con éxito para la cuenta real!");
    console.log(`👉 Evento Público (Audiencia): ${dbUrl}/events_registry/default-event-${uid}`);
    console.log("Puedes ingresar a la web o a la aplicación usando:");
    console.log(`📧 Correo: ${email}`);
    console.log(`🔑 Contraseña: ${password}`);
  } catch (error) {
    console.error("❌ Falló la escritura en la base de datos:", error);
    process.exit(1);
  }

  async function writeDb(path, data) {
    const res = await fetch(`${dbUrl}/${path}?auth=${idToken}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error en PUT ${path}: ${res.status} - ${errText}`);
    }
    console.log(`  ✅ ${path} escrito.`);
  }
}

seedFirebase();
