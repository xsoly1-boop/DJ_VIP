import fetch from 'node-fetch';

const url = 'https://lzbozouxqcsthysqnjij.supabase.co/rest/v1/';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Ym96b3V4cWNzdGh5c3FuamlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDM0NDA3MywiZXhwIjoyMDk5OTIwMDczfQ.5EqvQWd49xxKMS7TM6pbl7aqxcHT1UgEHnTi4u6jHSg';

async function getInfo() {
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", JSON.stringify([...res.headers.entries()], null, 2));
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

getInfo();
