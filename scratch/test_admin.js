const apiKey = "AIzaSyAZcMcN-dPs3HYMCDb14J-fmjV274NDSC8";
const email = "dj@admin.com";
const password = "admin123";

async function testAdmin() {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await response.json();
  if (response.ok) {
    console.log("✅ Admin login successful! UID:", data.localId);
  } else {
    console.log("❌ Admin login failed:", data.error.message);
  }
}
testAdmin();
