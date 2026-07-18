import fetch from 'node-fetch';

const url = 'https://lzbozouxqcsthysqnjij.supabase.co/rest/v1/';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Ym96b3V4cWNzdGh5c3FuamlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNDQwNzMsImV4cCI6MjA5OTkyMDA3M30.KCZ5YKioQK1mbGJU7uLQnIgUme03lxa-MpZf9z5cQaw';

async function getInfo() {
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
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
