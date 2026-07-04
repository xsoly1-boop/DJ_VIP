#!/bin/bash
# ==============================================================================
# SCRIPT DE COMPILACIÓN AUTOMATIZADA DE .IPA NO FIRMADO (UNSIGNED) PARA IOS
# Genera el archivo DJ_Panel.ipa listo para instalar mediante AltStore/Sideloadly
# ==============================================================================

set -euo pipefail

RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'
CYAN='\033[1;36m'; PURPLE='\033[1;35m'; RESET='\033[0m'

if [ -t 0 ]; then
    clear
fi

echo -e "${PURPLE}===================================================================${RESET}"
echo -e "${CYAN}   💿 DJ A LA CARTA — COMPILADOR DE ARCHIVO .IPA (SIN FIRMA) 💿    ${RESET}"
echo -e "${PURPLE}===================================================================${RESET}"
echo -e "  Genera el archivo ${GREEN}DJ_Panel.ipa${RESET} no firmado listo para Sideloading."
echo ""

# 0. Verificar que se ejecuta desde la raíz
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la carpeta raíz del proyecto.${RESET}"
    exit 1
fi

# 1. Verificar Xcode y su configuración
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode no está instalado o no se encuentra en el PATH.${RESET}"
    exit 1
fi

# 2. Generar build web y sincronizar con Capacitor
echo -e "${CYAN}[1/3] Compilando recursos web y sincronizando...${RESET}"
npm run build
npx cap sync ios
echo -e "  ✅ Recursos web sincronizados con el proyecto iOS."
echo ""

# Limpiar carpetas de build anteriores
rm -rf build DJ_Panel.ipa

# 3. Compilar Xcode en modo sin firma (CODE_SIGNING_ALLOWED=NO)
echo -e "${CYAN}[2/3] Compilando proyecto en Xcode sin firma digital...${RESET}"
set +e
if [ -d "ios/App/App.xcworkspace" ]; then
    xcodebuild -workspace ios/App/App.xcworkspace \
               -scheme App \
               -configuration Release \
               -destination 'generic/platform=iOS' \
               -archivePath build/App.xcarchive \
               archive \
               CODE_SIGNING_ALLOWED=NO \
               CODE_SIGNING_REQUIRED=NO \
               CODE_SIGN_IDENTITY="" \
               PROVISIONING_PROFILE_SPECIFIER=""
else
    xcodebuild -project ios/App/App.xcodeproj \
               -scheme App \
               -configuration Release \
               -destination 'generic/platform=iOS' \
               -archivePath build/App.xcarchive \
               archive \
               CODE_SIGNING_ALLOWED=NO \
               CODE_SIGNING_REQUIRED=NO \
               CODE_SIGN_IDENTITY="" \
               PROVISIONING_PROFILE_SPECIFIER=""
fi
ARCHIVE_EXIT=$?
set -e

if [ $ARCHIVE_EXIT -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Error durante el archivado de la aplicación en Xcode.${RESET}"
    rm -rf build
    exit $ARCHIVE_EXIT
fi

# 4. Empaquetar el archivo .ipa manualmente usando estructura Payload/
echo ""
echo -e "${CYAN}[3/3] Creando estructura Payload y empaquetando archivo .ipa...${RESET}"

if [ -d "build/App.xcarchive/Products/Applications/App.app" ]; then
    mkdir -p build/Payload
    cp -r build/App.xcarchive/Products/Applications/App.app build/Payload/
    
    cd build
    zip -qr ../DJ_Panel.ipa Payload
    cd ..
    
    rm -rf build
    echo ""
    echo -e "${PURPLE}===================================================================${RESET}"
    echo -e "${GREEN}    🎉 ¡COMPILACIÓN EXITOSA! EL ARCHIVO .IPA ESTÁ LISTO 🎉         ${RESET}"
    echo -e "${PURPLE}===================================================================${RESET}"
    echo -e "  📦 Archivo  : ${CYAN}DJ_Panel.ipa${RESET} (guardado en la raíz del proyecto)"
    echo -e "  📏 Tamaño   : ${CYAN}$(du -sh DJ_Panel.ipa | cut -f1)${RESET}"
    echo ""
    echo -e "  👉 ${YELLOW}Cómo instalarlo en iPhone/iPad sin cuenta Apple Developer:${RESET}"
    echo -e "     1. Transfiere el archivo ${GREEN}DJ_Panel.ipa${RESET} a tu computadora."
    echo -e "     2. Descarga ${CYAN}Sideloadly${RESET} (https://sideloadly.io/) o ${CYAN}AltStore${RESET}."
    echo -e "     3. Conecta el iPhone/iPad por USB a la computadora."
    echo -e "     4. Arrastra el archivo ${GREEN}DJ_Panel.ipa${RESET} a Sideloadly."
    echo -e "     5. Ingresa tu Apple ID y presiona ${GREEN}Start${RESET}."
    echo -e "     6. La app se firmará gratis e instalará en el dispositivo de forma fácil."
    echo ""
else
    echo -e "${RED}❌ No se pudo encontrar el archivo App.app en la carpeta de compilación.${RESET}"
    rm -rf build
    exit 1
fi
