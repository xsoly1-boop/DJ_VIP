const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../src/utils/AppVersionConfig.js');
const jsonPath = path.join(__dirname, '../public/version.json');
const gradlePath = path.join(__dirname, '../android/app/build.gradle');

function increment() {
  // 1. Leer AppVersionConfig.js
  let configContent = '';
  try {
    configContent = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    configContent = 'export const CURRENT_APP_VERSION = "1.0.0.0";\n';
  }

  const versionRegex = /CURRENT_APP_VERSION\s*=\s*["']([^"']+)["']/;
  const match = configContent.match(versionRegex);

  let currentVersion = '1.0.0.0';
  if (match) {
    currentVersion = match[1];
  }

  // Asegurar formato de 4 partes (x.y.z.w)
  const parts = currentVersion.split('.').map(Number);
  while (parts.length < 4) {
    parts.push(0);
  }
  
  // Incrementar la última parte
  parts[parts.length - 1] += 1;
  const newVersion = parts.join('.');

  // Guardar AppVersionConfig.js
  const newConfigContent = configContent.match(versionRegex)
    ? configContent.replace(versionRegex, `CURRENT_APP_VERSION = "${newVersion}"`)
    : `export const CURRENT_APP_VERSION = "${newVersion}";\n`;
  fs.writeFileSync(configPath, newConfigContent, 'utf8');
  console.log(`[Version Config] Actualizado a: ${newVersion}`);

  // 2. Actualizar public/version.json
  if (fs.existsSync(jsonPath)) {
    try {
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      jsonContent.latestVersion = newVersion;
      jsonContent.apkUrl = `https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk`;
      fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2) + '\n', 'utf8');
      console.log(`[version.json] Actualizado a: ${newVersion}`);
    } catch (err) {
      console.error('[version.json] Error actualizando json:', err.message);
    }
  }

  // 3. Actualizar android/app/build.gradle
  if (fs.existsSync(gradlePath)) {
    try {
      let gradleContent = fs.readFileSync(gradlePath, 'utf8');
      
      // Incrementar versionCode
      const versionCodeRegex = /versionCode\s+(\d+)/;
      const codeMatch = gradleContent.match(versionCodeRegex);
      if (codeMatch) {
        const nextCode = parseInt(codeMatch[1], 10) + 1;
        gradleContent = gradleContent.replace(versionCodeRegex, `versionCode ${nextCode}`);
        console.log(`[build.gradle] Código de versión (versionCode) incrementado a: ${nextCode}`);
      }

      // Actualizar versionName
      const versionNameRegex = /versionName\s+["']([^"']+)["']/;
      gradleContent = gradleContent.replace(versionNameRegex, `versionName "${newVersion}"`);
      console.log(`[build.gradle] Nombre de versión (versionName) actualizado a: "${newVersion}"`);

      fs.writeFileSync(gradlePath, gradleContent, 'utf8');
    } catch (err) {
      console.error('[build.gradle] Error actualizando gradle:', err.message);
    }
  }
}

increment();
