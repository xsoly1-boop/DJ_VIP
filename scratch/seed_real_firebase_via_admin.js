// Script de siembra para Firebase Real usando privilegios de Administrador Master.

const apiKey = "AIzaSyAZcMcN-dPs3HYMCDb14J-fmjV274NDSC8";
const dbUrl = "https://dj-interactive-event-default-rtdb.firebaseio.com";
const adminEmail = "dj@admin.com";
const adminPassword = "admin123";
const targetEmail = "demo@dj.com";

async function run() {
  console.log("=== Sembrando Cuenta Demo en Firebase Real vía Administrador ===");

  // 1. Iniciar sesión como administrador
  console.log("1. Autenticando como Administrador Master...");
  let adminToken = "";
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword, returnSecureToken: true })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Error desconocido");
    }
    adminToken = data.idToken;
    console.log("  ✅ Autenticado con éxito.");
  } catch (err) {
    console.error("❌ Error de autenticación del administrador:", err.message);
    process.exit(1);
  }

  // 2. Leer la lista de usuarios de la base de datos
  console.log("2. Buscando el UID de la cuenta demo@dj.com en la base de datos...");
  let demoUid = null;
  try {
    const res = await fetch(`${dbUrl}/users.json?auth=${adminToken}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const users = await res.json();
    
    if (users) {
      for (const [uid, userData] of Object.entries(users)) {
        if (userData.profile && userData.profile.email === targetEmail) {
          demoUid = uid;
          break;
        }
      }
    }
  } catch (err) {
    console.error("❌ Error al leer la lista de usuarios:", err.message);
    process.exit(1);
  }

  if (demoUid) {
    console.log(`  ✅ Encontrado UID de demo@dj.com: ${demoUid}`);
  } else {
    console.log(`  ⚠️ No se encontró ningún registro para demo@dj.com en la base de datos.`);
    console.log(`  Intentando sembrar bajo el UID predeterminado 'uid-demo'...`);
    demoUid = "uid-demo";
  }

  // 3. Sembrar datos
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
    email: targetEmail,
    displayName: "DJ Demo"
  };

  const registry = {
    ownerUid: demoUid,
    title: settings.title,
    djName: settings.djName
  };

  console.log("3. Escribiendo datos en Firebase Real...");
  try {
    await writeDb(`users/${demoUid}/profile.json`, profile);
    await writeDb(`users/${demoUid}/events_index/default-event.json`, eventsIndex["default-event"]);
    await writeDb(`users/${demoUid}/events/default-event/settings.json`, settings);
    await writeDb(`users/${demoUid}/events/default-event/requests.json`, requests);
    await writeDb(`events_registry/default-event-${demoUid}.json`, registry);

    console.log("🎉 ¡Siembra exitosa completada!");
  } catch (err) {
    console.error("❌ Error de escritura:", err.message);
  }

  async function writeDb(path, data) {
    const res = await fetch(`${dbUrl}/${path}?auth=${adminToken}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`PUT ${path} failed: ${res.status} - ${await res.text()}`);
    }
    console.log(`  ✅ ${path} escrito.`);
  }
}

run();
