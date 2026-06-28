const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const sa = require('../serviceAccountKey.json');

const configPath = path.join(__dirname, '../src/utils/AppVersionConfig.js');
const jsonPath = path.join(__dirname, '../public/version.json');
const gradlePath = path.join(__dirname, '../android/app/build.gradle');

const VERSION_NAME = '1.0.0.40';
const RELEASE_NOTES = [
  'Reducción del ancho del menú lateral (sidebar) en pantalla de escritorio para optimizar el área útil del panel.',
  'Bordes blancos más nítidos y resplandor de luz optimizado en el skin Crystal.',
  'Efecto cristal translúcido extendido a las pantallas y componentes de carga.'
];

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}
const db = admin.database();

async function run() {
  console.log(`Setting version to: ${VERSION_NAME}`);

  // 1. Write AppVersionConfig.js
  let configContent = `export const CURRENT_APP_VERSION = "${VERSION_NAME}";\n`;
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ AppVersionConfig.js updated.');

  // 2. Write public/version.json
  const jsonContent = {
    latestVersion: VERSION_NAME,
    apkUrl: 'https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk',
    dmgUrl: 'https://github.com/xsoly1-boop/DJ_VIP/releases/download/v1.0.0.39/DJ%20Panel%20Pro-1.0.0.39-arm64.dmg',
    dmgUrlIntel: 'https://github.com/xsoly1-boop/DJ_VIP/releases/download/v1.0.0.39/DJ%20Panel%20Pro-1.0.0.39-x64.dmg',
    releaseNotes: RELEASE_NOTES
  };
  fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2) + '\n', 'utf8');
  console.log('✅ public/version.json updated.');

  // 3. Write android/app/build.gradle
  if (fs.existsSync(gradlePath)) {
    let gradleContent = fs.readFileSync(gradlePath, 'utf8');
    
    // Set versionCode to 42 (to be ahead of 41)
    const versionCodeRegex = /versionCode\s+(\d+)/;
    gradleContent = gradleContent.replace(versionCodeRegex, 'versionCode 42');
    
    // Set versionName
    const versionNameRegex = /versionName\s+["']([^"']+)["']/;
    gradleContent = gradleContent.replace(versionNameRegex, `versionName "${VERSION_NAME}"`);
    
    fs.writeFileSync(gradlePath, gradleContent, 'utf8');
    console.log('✅ android/app/build.gradle updated.');
  }

  // 4. Update Firebase RTDB config/updates node
  console.log('Updating Firebase RTDB node /config/updates...');
  const updatesRef = db.ref('config/updates');
  await updatesRef.set({
    latestVersion: VERSION_NAME,
    apkUrl: 'https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk',
    dmgUrl: 'https://github.com/xsoly1-boop/DJ_VIP/releases/download/v1.0.0.39/DJ%20Panel%20Pro-1.0.0.39-arm64.dmg',
    dmgUrlIntel: 'https://github.com/xsoly1-boop/DJ_VIP/releases/download/v1.0.0.39/DJ%20Panel%20Pro-1.0.0.39-x64.dmg',
    releaseNotes: RELEASE_NOTES
  });
  console.log('✅ Firebase RTDB config/updates node updated.');

  console.log('Sync completed successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error during sync:', err);
  process.exit(1);
});
