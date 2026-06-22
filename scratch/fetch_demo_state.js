const apiKey = "AIzaSyAZcMcN-dPs3HYMCDb14J-fmjV274NDSC8";
const dbUrl = "https://dj-interactive-event-default-rtdb.firebaseio.com";
const adminEmail = "dj@admin.com";
const adminPassword = "admin123";
const targetEmail = "demo@dj.com";

async function fetchDemoState() {
  console.log("=== Fetching demo@dj.com State via Admin ===");
  try {
    // 1. Auth as admin
    const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword, returnSecureToken: true })
    });
    const signInData = await signInResponse.json();
    if (!signInResponse.ok) {
      throw new Error(`Admin Auth failed: ${JSON.stringify(signInData)}`);
    }

    const adminToken = signInData.idToken;

    // 2. Fetch users to find demo@dj.com UID
    const res = await fetch(`${dbUrl}/users.json?auth=${adminToken}`);
    const users = await res.json();
    let demoUid = null;
    if (users) {
      for (const [uid, userData] of Object.entries(users)) {
        if (userData.profile && userData.profile.email === targetEmail) {
          demoUid = uid;
          break;
        }
      }
    }

    if (!demoUid) {
      console.log("demo@dj.com user not found in the users list.");
      return;
    }

    console.log(`Found UID for demo@dj.com: ${demoUid}`);

    // Fetch settings
    const settingsRes = await fetch(`${dbUrl}/users/${demoUid}/events/default-event/settings.json?auth=${adminToken}`);
    const settings = await settingsRes.json();
    console.log("\n--- SETTINGS ---");
    console.log(JSON.stringify(settings, null, 2));

    // Fetch requests
    const requestsRes = await fetch(`${dbUrl}/users/${demoUid}/events/default-event/requests.json?auth=${adminToken}`);
    const requests = await requestsRes.json();
    console.log("\n--- REQUESTS ---");
    console.log(JSON.stringify(requests, null, 2));

    // Fetch index
    const indexRes = await fetch(`${dbUrl}/users/${demoUid}/events_index/default-event.json?auth=${adminToken}`);
    const index = await indexRes.json();
    console.log("\n--- INDEX ---");
    console.log(JSON.stringify(index, null, 2));

  } catch (error) {
    console.error("Error:", error);
  }
}

fetchDemoState();
