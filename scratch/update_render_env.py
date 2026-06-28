#!/usr/bin/env python3
"""
Actualiza TODAS las variables de entorno necesarias en Render.com
"""
import json
import urllib.request
import sys

RENDER_API_KEY = "rnd_6JGlDSByIWvmy46BXTX6BniV5krA"
SERVICE_ID = "srv-d8uvajpkh4rs73d358p0"

# Leer service account
with open("serviceAccountKey.json", "r") as f:
    data = json.load(f)
sa_value = json.dumps(data, separators=(",", ":"))

# Todas las variables necesarias
env_vars = [
    {"key": "FIREBASE_SERVICE_ACCOUNT",       "value": sa_value},
    {"key": "VITE_FIREBASE_DATABASE_URL",      "value": "https://djvip-c2cc9-default-rtdb.firebaseio.com"},
    {"key": "VITE_FIREBASE_API_KEY",           "value": "AIzaSyAZgdmkxOSDAUUmiPNiy6eqA_oKVDtn_9o"},
    {"key": "VITE_FIREBASE_AUTH_DOMAIN",       "value": "djvip-c2cc9.firebaseapp.com"},
    {"key": "VITE_FIREBASE_PROJECT_ID",        "value": "djvip-c2cc9"},
    {"key": "VITE_FIREBASE_MESSAGING_SENDER_ID","value": "814917855042"},
    {"key": "VITE_FIREBASE_APP_ID",            "value": "1:814917855042:web:066636a11780c97dfa0adb"},
    {"key": "VITE_PUBLIC_URL",                 "value": "https://dj-vip.vercel.app/"},
    {"key": "NODE_ENV",                        "value": "production"},
]

payload = json.dumps(env_vars).encode("utf-8")

req = urllib.request.Request(
    f"https://api.render.com/v1/services/{SERVICE_ID}/env-vars",
    data=payload,
    method="PUT",
    headers={
        "Authorization": f"Bearer {RENDER_API_KEY}",
        "Content-Type": "application/json",
    },
)

try:
    with urllib.request.urlopen(req) as resp:
        result = json.load(resp)
        print(f"✅ {len(result)} variables configuradas en Render:")
        for item in result:
            ev = item.get('envVar', item)
            key = ev.get('key','')
            val = ev.get('value','')
            print(f"   {key}: {val[:60]}{'...' if len(val) > 60 else ''}")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
