const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../src/utils/AppVersionConfig.js');
const jsonPath = path.join(__dirname, '../public/version.json');
const gradlePath = path.join(__dirname, '../android/app/build.gradle');

// ─── Credenciales Firebase (carga solo si el archivo existe) ─────────────────
let admin = null;
const saPath = path.join(__dirname, '../serviceAccountKey.json');
if (fs.existsSync(saPath)) {
  try {
    admin = require('firebase-admin');
    const sa = require(saPath);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(sa),
        databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
      });
    }
  } catch (e) {
    console.warn('[Firebase] No se pudo inicializar firebase-admin:', e.message);
    admin = null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

async function increment() {
  // 1. Leer versión actual desde AppVersionConfig.js
  let configContent = '';
  try {
    configContent = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    configContent = 'export const CURRENT_APP_VERSION = "1.0.0.0";\n';
  }

  const versionRegex = /CURRENT_APP_VERSION\s*=\s*["']([^"']+)["']/;
  const match = configContent.match(versionRegex);

  let currentVersion = '1.0.0.0';
  if (match) currentVersion = match[1];

  // Asegurar formato x.y.z.w e incrementar último dígito
  const parts = currentVersion.split('.').map(Number);
  while (parts.length < 4) parts.push(0);
  parts[parts.length - 1] += 1;
  const newVersion = parts.join('.');

  // 2. Guardar AppVersionConfig.js
  const newConfigContent = configContent.match(versionRegex)
    ? configContent.replace(versionRegex, `CURRENT_APP_VERSION = "${newVersion}"`)
    : `export const CURRENT_APP_VERSION = "${newVersion}";\n`;
  fs.writeFileSync(configPath, newConfigContent, 'utf8');
  console.log(`[Version Config] Actualizado a: ${newVersion}`);

  // 3. Actualizar public/version.json (preservando todos los campos, incluyendo URLs DMG correctas)
  let jsonContent = {};
  if (fs.existsSync(jsonPath)) {
    try {
      jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) { /* vacío */ }
  }
  // Preservar las URLs existentes — solo actualizar latestVersion
  // Las URLs se actualizan correctamente en deploy.sh al leer los assets reales de GitHub
  jsonContent.latestVersion = newVersion;
  // Solo establecer defaults si no existen, NUNCA sobreescribir URLs existentes
  if (!jsonContent.apkUrl) jsonContent.apkUrl = 'https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk';
  if (!jsonContent.dmgUrl) jsonContent.dmgUrl = '';
  if (!jsonContent.dmgUrlIntel) jsonContent.dmgUrlIntel = '';
  if (!jsonContent.ipaUrl) jsonContent.ipaUrl = 'https://dj-vip.vercel.app/DJ-Panel-Pro.ipa';
  if (!jsonContent.exeUrl) jsonContent.exeUrl = 'https://dj-vip.vercel.app/DJ-Panel-Pro-Setup.exe';
  fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2) + '\n', 'utf8');
  console.log(`[version.json] Actualizado a: ${newVersion}`);

  // 4. Actualizar android/app/build.gradle
  if (fs.existsSync(gradlePath)) {
    try {
      let gradleContent = fs.readFileSync(gradlePath, 'utf8');
      const versionCodeRegex = /versionCode\s+(\d+)/;
      const codeMatch = gradleContent.match(versionCodeRegex);
      if (codeMatch) {
        const nextCode = parseInt(codeMatch[1], 10) + 1;
        gradleContent = gradleContent.replace(versionCodeRegex, `versionCode ${nextCode}`);
        console.log(`[build.gradle] versionCode → ${nextCode}`);
      }
      const versionNameRegex = /versionName\s+["']([^"']+)["']/;
      gradleContent = gradleContent.replace(versionNameRegex, `versionName "${newVersion}"`);
      console.log(`[build.gradle] versionName → "${newVersion}"`);
      fs.writeFileSync(gradlePath, gradleContent, 'utf8');
    } catch (err) {
      console.error('[build.gradle] Error:', err.message);
    }
  }

  // 5. Sincronizar Firebase RTDB automáticamente
  if (admin) {
    try {
      await admin.database().ref('config/updates').update({
        latestVersion: newVersion,
        apkUrl:    'https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk',
        dmgUrl:    'https://github.com/xsoly1-boop/DJ_VIP/releases/download/v1.0.0.39/DJ.Panel.Pro-1.0.0.39-arm64.dmg',
        dmgUrlIntel: 'https://github.com/xsoly1-boop/DJ_VIP/releases/download/v1.0.0.39/DJ.Panel.Pro-1.0.0.39-x64.dmg',
      });
      console.log(`[Firebase RTDB] config/updates.latestVersion → ${newVersion}`);
    } catch (e) {
      console.warn('[Firebase RTDB] Error sincronizando:', e.message);
    }
  } else {
    console.warn('[Firebase RTDB] Sin credenciales — sincroniza manualmente con: node scratch/sync_and_publish_release.cjs');
  }

  console.log(`\n✅ Versión ${newVersion} lista para compilar.\n`);
}

increment().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
