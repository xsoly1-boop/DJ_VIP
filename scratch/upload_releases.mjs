#!/usr/bin/env node
// Script para subir compilaciones a GitHub Releases via API REST

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GITHUB_TOKEN = 'REDACTED_TOKEN';
const OWNER = 'xsoly1-boop';
const REPO = 'DJ_VIP';
const TAG = 'v1.1.0';
const RELEASE_NAME = 'v1.1.0 — Supabase Migration + New Rules';

const FILES = [
  { path: path.join(__dirname, '../releases/1.0.0/DJ-Panel-Pro-v1.0.0-android.apk'),             name: 'DJ-Panel-Pro-v1.0.0-android.apk',              mime: 'application/vnd.android.package-archive' },
  { path: path.join(__dirname, '../releases/1.0.0/DJ-Panel-Pro-v1.0.0-macOS-Silicon.dmg'),        name: 'DJ-Panel-Pro-v1.0.0-macOS-Silicon.dmg',         mime: 'application/x-apple-diskimage' },
  { path: path.join(__dirname, '../releases/1.0.0/DJ-Panel-Pro-v1.0.0-macOS-Universal.dmg'),      name: 'DJ-Panel-Pro-v1.0.0-macOS-Universal.dmg',       mime: 'application/x-apple-diskimage' },
  { path: path.join(__dirname, '../releases/1.0.0/DJ-Panel-Pro-v1.0.0-macOS-10.14-Intel.dmg'),    name: 'DJ-Panel-Pro-v1.0.0-macOS-10.14-Intel.dmg',     mime: 'application/x-apple-diskimage' },
  { path: path.join(__dirname, '../releases/1.0.0/DJ-Panel-Pro-v1.0.0-Windows-x64-Setup.exe'),    name: 'DJ-Panel-Pro-v1.0.0-Windows-x64-Setup.exe',     mime: 'application/octet-stream' },
];

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

async function createRelease() {
  console.log(`\n📡 Creando release ${TAG} en GitHub...`);
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: TAG,
      name: RELEASE_NAME,
      body: `## 🚀 DJ Panel Pro ${TAG}

### Novedades
- ✅ **Migración completa de Firebase → Supabase** como base de datos principal
- ✅ **Validación de peticiones mejorada**: auto-corrección de coherencia y similitud 90%
- ✅ **Cola de peticiones ordenada por votos** (mayor cantidad siempre arriba)
- ✅ **Fusión de duplicados**: canciones con ≥90% de similitud se suman automáticamente
- ✅ **Aviso de campo vacío**: si no se escribe una canción, el DJ elige el tema

### Descargas
| Plataforma | Archivo |
|---|---|
| 📱 Android | DJ-Panel-Pro-v1.0.0-android.apk |
| 🍎 macOS Silicon (M1/M2/M3) | DJ-Panel-Pro-v1.0.0-macOS-Silicon.dmg |
| 🍎 macOS Universal (Intel + Silicon) | DJ-Panel-Pro-v1.0.0-macOS-Universal.dmg |
| 🍎 macOS Intel (10.14+) | DJ-Panel-Pro-v1.0.0-macOS-10.14-Intel.dmg |
| 🪟 Windows x64 | DJ-Panel-Pro-v1.0.0-Windows-x64-Setup.exe |`,
      draft: false,
      prerelease: false
    })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Error creando release:', data);
    throw new Error(data.message);
  }
  console.log(`✅ Release creado: ${data.html_url}`);
  return data;
}

async function uploadAsset(uploadUrl, filePath, fileName, mimeType) {
  const baseUrl = uploadUrl.replace('{?name,label}', '');
  const url = `${baseUrl}?name=${encodeURIComponent(fileName)}`;
  
  console.log(`\n⬆️  Subiendo ${fileName}...`);
  const fileSize = fs.statSync(filePath).size;
  const sizeMB = (fileSize / 1024 / 1024).toFixed(1);
  console.log(`   Tamaño: ${sizeMB} MB`);

  const fileStream = fs.readFileSync(filePath);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': mimeType,
      'Content-Length': fileSize
    },
    body: fileStream
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ Error subiendo ${fileName}:`, data.message);
    return false;
  }
  console.log(`✅ ${fileName} subido correctamente`);
  return true;
}

async function main() {
  console.log('🚀 Iniciando subida de compilaciones a GitHub Releases...');
  
  const release = await createRelease();
  
  let successes = 0;
  for (const file of FILES) {
    if (!fs.existsSync(file.path)) {
      console.error(`⚠️  Archivo no encontrado: ${file.path}`);
      continue;
    }
    const ok = await uploadAsset(release.upload_url, file.path, file.name, file.mime);
    if (ok) successes++;
  }

  console.log(`\n${'━'.repeat(60)}`);
  console.log(`📦 Subida completa: ${successes}/${FILES.length} archivos`);
  console.log(`🔗 Release URL: ${release.html_url}`);
  console.log('━'.repeat(60));
}

main().catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
