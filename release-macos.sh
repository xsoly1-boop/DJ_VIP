#!/bin/bash
# ==============================================================================
# SCRIPT DE RELEASE AUTOMÁTICO — DJ PANEL PRO
# Compila arm64 + x64, crea GitHub Release, sube DMGs, actualiza version.json,
# compila APK Android y despliega a Vercel. Todo en un solo comando.
#
# USO:  bash release-macos.sh [nuevo-numero-version]
# EJ:   bash release-macos.sh 1.0.0.18
# ==============================================================================

set -euo pipefail

RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'
CYAN='\033[1;36m'; PURPLE='\033[1;35m'; RESET='\033[0m'

if [ -t 0 ]; then clear; fi

echo -e "${PURPLE}=================================================================${RESET}"
echo -e "${CYAN}     🚀 DJ PANEL PRO — RELEASE AUTOMÁTICO COMPLETO 🚀     ${RESET}"
echo -e "${PURPLE}=================================================================${RESET}"
echo ""

# -----------------------------------------------------------------------
# 0. Verificar entorno
# -----------------------------------------------------------------------
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ejecuta desde la raíz del proyecto.${RESET}"
    exit 1
fi

# Cargar .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ No se encontró .env${RESET}"
    exit 1
fi

while IFS='=' read -r key value || [[ -n "$key" ]]; do
    [[ "$key" =~ ^[[:space:]]*#.*$ || -z "${key// }" ]] && continue
    [[ ! "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] && continue
    value="${value%%#*}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
    export "${key}=${value}"
done < .env

# Verificar token de GitHub
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo -e "${RED}❌ GITHUB_TOKEN no configurado en .env${RESET}"
    echo "   Agrega: GITHUB_TOKEN=ghp_xxxxxxxxxxxx"
    exit 1
fi

GITHUB_REPO="${GITHUB_REPO:-xsoly1-boop/DJ_VIP}"
echo -e "  ✅ GitHub repo   : ${GREEN}${GITHUB_REPO}${RESET}"
echo -e "  ✅ GitHub token  : ${GREEN}****${GITHUB_TOKEN: -6}${RESET}"

# -----------------------------------------------------------------------
# 1. Determinar la nueva versión
# -----------------------------------------------------------------------
CURRENT_VERSION=$(node -e "const v = require('./public/version.json'); console.log(v.latestVersion);")

if [ -n "${1:-}" ]; then
    NEW_VERSION="$1"
else
    # Incrementar automáticamente el último dígito
    BASE="${CURRENT_VERSION%.*}"
    PATCH="${CURRENT_VERSION##*.}"
    NEW_VERSION="${BASE}.$((PATCH + 1))"
fi

echo ""
echo -e "${CYAN}[1/7] Versión: ${YELLOW}${CURRENT_VERSION}${RESET} → ${GREEN}${NEW_VERSION}${RESET}"
echo ""

# -----------------------------------------------------------------------
# 2. Actualizar AppVersionConfig.js
# -----------------------------------------------------------------------
echo -e "${CYAN}[2/7] Actualizando versión en AppVersionConfig.js...${RESET}"
sed -i '' "s/CURRENT_APP_VERSION = \".*\"/CURRENT_APP_VERSION = \"${NEW_VERSION}\"/" src/utils/AppVersionConfig.js
echo -e "  ✅ AppVersionConfig.js → ${NEW_VERSION}"

# -----------------------------------------------------------------------
# 3. Compilar Frontend + arm64 DMG + x64 DMG
# -----------------------------------------------------------------------
echo ""
echo -e "${CYAN}[3/7] Compilando frontend (React + Vite)...${RESET}"
npm run build
echo -e "  ✅ Frontend compilado"

# Limpiar DMGs anteriores
rm -f dist-desktop/*.dmg dist-desktop/*.blockmap 2>/dev/null || true

echo ""
echo -e "${CYAN}[3/7] Empaquetando DMG Apple Silicon (arm64)...${RESET}"
CSC_IDENTITY_AUTO_DISCOVERY=false CSC_LINK="" npx electron-builder --mac --arm64 --publish never
echo -e "  ✅ arm64 compilado"

echo ""
echo -e "${CYAN}[3/7] Empaquetando DMG Intel x64 (macOS 10.14+)...${RESET}"
CSC_IDENTITY_AUTO_DISCOVERY=false CSC_LINK="" npx electron-builder --mac --x64 --publish never
echo -e "  ✅ x64 compilado"

# Renombrar x64 para claridad
X64_ORIGINAL=$(find dist-desktop -name "*.dmg" ! -name "*arm64*" | head -1)
if [ -n "${X64_ORIGINAL:-}" ]; then
    X64_BASE=$(dirname "$X64_ORIGINAL")
    mv "$X64_ORIGINAL" "${X64_BASE}/DJ Panel Pro-${NEW_VERSION}-x64.dmg" 2>/dev/null || true
fi

DMG_ARM=$(find dist-desktop -name "*arm64*.dmg" | head -1)
DMG_X64=$(find dist-desktop -name "*x64*.dmg" | head -1)

# Renombrar arm64 con versión
if [ -n "${DMG_ARM:-}" ]; then
    NEW_ARM="dist-desktop/DJ Panel Pro-${NEW_VERSION}-arm64.dmg"
    mv "$DMG_ARM" "$NEW_ARM" 2>/dev/null || DMG_ARM="$DMG_ARM"
    DMG_ARM="$NEW_ARM"
fi

# Firma ad-hoc
if command -v codesign &>/dev/null; then
    APP_DIR=$(find dist-desktop -name "*.app" -maxdepth 4 | head -1)
    [ -n "${APP_DIR:-}" ] && codesign --force --deep --sign - "$APP_DIR" 2>/dev/null || true
    [ -n "${DMG_ARM:-}" ] && codesign --force --sign - "$DMG_ARM" 2>/dev/null || true
    [ -n "${DMG_X64:-}" ] && codesign --force --sign - "$DMG_X64" 2>/dev/null || true
fi

echo ""
echo -e "  🍎 arm64 : ${CYAN}${DMG_ARM}${RESET}  ($(du -sh "${DMG_ARM}" | cut -f1))"
echo -e "  🖥️  x64   : ${CYAN}${DMG_X64}${RESET}  ($(du -sh "${DMG_X64}" | cut -f1))"

# -----------------------------------------------------------------------
# 4. Crear GitHub Release y subir DMGs
# -----------------------------------------------------------------------
echo ""
echo -e "${CYAN}[4/7] Creando GitHub Release v${NEW_VERSION}...${RESET}"

TAG="v${NEW_VERSION}"

# Crear JSON de payload seguro usando Node.js
JSON_PAYLOAD_FILE=$(mktemp)
node -e "
const fs = require('fs');
const v = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));
const notes = v.releaseNotes.map((n, i) => (i + 1) + '. ' + n).join('\n');
const body = '### DJ Panel Pro ${NEW_VERSION}\n\n' + notes + '\n\n---\n**Descarga según tu Mac:**\n- 🍎 **Apple Silicon (M1/M2/M3/M4):** DJ Panel Pro-${NEW_VERSION}-arm64.dmg\n- 🖥️ **Intel (macOS 10.14+):** DJ Panel Pro-${NEW_VERSION}-x64.dmg\n\n*Primera apertura: clic derecho → Abrir (para omitir Gatekeeper)*';

const payload = {
  tag_name: '${TAG}',
  name: 'DJ Panel Pro v${NEW_VERSION}',
  body: body,
  draft: false,
  prerelease: false
};
fs.writeFileSync('${JSON_PAYLOAD_FILE}', JSON.stringify(payload), 'utf8');
"

# Crear el release
RELEASE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${GITHUB_REPO}/releases" \
    -d @"${JSON_PAYLOAD_FILE}")

rm -f "${JSON_PAYLOAD_FILE}"

RELEASE_ID=$(echo "$RELEASE_RESPONSE" | node -e "let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch(e){console.log('')}})")
UPLOAD_URL=$(echo "$RELEASE_RESPONSE" | node -e "let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{try{const u=JSON.parse(d).upload_url||'';console.log(u.replace('{?name,label}',''))}catch(e){console.log('')}})")

if [ -z "${RELEASE_ID:-}" ]; then
    echo -e "${RED}❌ Error al crear el release. Respuesta:${RESET}"
    echo "$RELEASE_RESPONSE"
    exit 1
fi

echo -e "  ✅ Release creado: ID ${GREEN}${RELEASE_ID}${RESET}"

# Subir DMG arm64
echo -e "  📤 Subiendo arm64 DMG (~380 MB, puede tardar)..."
curl -s -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Content-Type: application/octet-stream" \
    "${UPLOAD_URL}?name=$(basename "${DMG_ARM}" | sed 's/ /%20/g')" \
    --data-binary @"${DMG_ARM}" > /dev/null
echo -e "  ✅ arm64 DMG subido"

# Subir DMG x64
echo -e "  📤 Subiendo x64 DMG (~380 MB, puede tardar)..."
curl -s -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Content-Type: application/octet-stream" \
    "${UPLOAD_URL}?name=$(basename "${DMG_X64}" | sed 's/ /%20/g')" \
    --data-binary @"${DMG_X64}" > /dev/null
echo -e "  ✅ x64 DMG subido"

# Obtener URLs de descarga directa
DMG_ARM_URL="https://github.com/${GITHUB_REPO}/releases/download/${TAG}/$(basename "${DMG_ARM}" | sed 's/ /./g')"
DMG_X64_URL="https://github.com/${GITHUB_REPO}/releases/download/${TAG}/$(basename "${DMG_X64}" | sed 's/ /./g')"

echo ""
echo -e "  🔗 arm64: ${CYAN}${DMG_ARM_URL}${RESET}"
echo -e "  🔗 x64  : ${CYAN}${DMG_X64_URL}${RESET}"

# -----------------------------------------------------------------------
# 5. Actualizar version.json con URLs directas
# -----------------------------------------------------------------------
echo ""
echo -e "${CYAN}[5/7] Actualizando version.json con URLs de descarga directa...${RESET}"

node -e "
const fs = require('fs');
const v = JSON.parse(fs.readFileSync('public/version.json','utf8'));
v.latestVersion = '${NEW_VERSION}';
v.dmgUrl = '${DMG_ARM_URL}';
v.dmgUrlIntel = '${DMG_X64_URL}';
fs.writeFileSync('public/version.json', JSON.stringify(v, null, 2) + '\n', 'utf8');
console.log('  ✅ version.json actualizado');

const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
  });
}
admin.database().ref('config/updates').update({
  latestVersion: '${NEW_VERSION}',
  dmgUrl: '${DMG_ARM_URL}',
  dmgUrlIntel: '${DMG_X64_URL}',
  apkUrl: 'https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk',
  ipaUrl: v.ipaUrl || 'https://dj-vip.vercel.app/DJ-Panel-Pro.ipa',
  exeUrl: v.exeUrl || 'https://dj-vip.vercel.app/DJ-Panel-Pro-Setup.exe'
}).then(() => {
  console.log('  ✅ Firebase RTDB sincronizado con la versión ${NEW_VERSION}');
  process.exit(0);
}).catch(err => {
  console.error('  ❌ Error actualizando Firebase:', err.message);
  process.exit(1);
});
"

# -----------------------------------------------------------------------
# 6. Compilar Android APK y desplegar a Vercel
# -----------------------------------------------------------------------
echo ""
echo -e "${CYAN}[6/7] Compilando APK Android y desplegando a Vercel...${RESET}"

# Rebuild dist sin archivos pesados
npm run build
rm -f dist/*.dmg dist/*.apk dist/*.ipa 2>/dev/null || true
npx cap sync --inline 2>/dev/null || npx cap sync

NO_INCREMENT=true bash build-android.sh

echo ""
echo -e "${CYAN}[6/7] Desplegando a Vercel...${RESET}"
npx vercel --prod --yes

# -----------------------------------------------------------------------
# 7. Push a GitHub
# -----------------------------------------------------------------------
echo ""
echo -e "${CYAN}[7/7] Publicando código en GitHub...${RESET}"
git add .
git commit -m "release: v${NEW_VERSION} — DMG arm64+x64, release automático"
git push origin main

echo ""
echo -e "${PURPLE}=================================================================${RESET}"
echo -e "${GREEN}   🎉 RELEASE v${NEW_VERSION} COMPLETO Y PUBLICADO 🎉   ${RESET}"
echo -e "${PURPLE}=================================================================${RESET}"
echo ""
echo -e "  🍎 arm64 : ${DMG_ARM_URL}"
echo -e "  🖥️  x64   : ${DMG_X64_URL}"
echo -e "  📱 APK   : https://dj-vip.vercel.app/DJ%20a%20la%20Carta%20Pro.apk"
echo -e "  🌐 Web   : https://dj-vip.vercel.app"
echo -e "  📋 Release: https://github.com/${GITHUB_REPO}/releases/tag/${TAG}"
echo ""
exit 0
