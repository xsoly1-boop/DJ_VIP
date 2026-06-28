#!/bin/bash

# ==============================================================================
# SCRIPT DE COMPILACIÓN AUTOMÁTICA PARA ANDROID (RELEASE FIRMADO) — DJ PANEL
# Genera el keystore si no existe, firma el APK y compila en modo Release
# ==============================================================================

set -euo pipefail   # Abortar en cualquier error inesperado

# Colores
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
PURPLE='\033[1;35m'
RESET='\033[0m'

if [ -t 0 ]; then
    clear
fi

echo -e "${PURPLE}===================================================================${RESET}"
echo -e "${CYAN}     💿 DJ A LA CARTA — COMPILADOR DE RELEASE FIRMADO (APK) 💿     ${RESET}"
echo -e "${PURPLE}===================================================================${RESET}"
echo -e "  Genera un APK de producción firmado listo para distribuir."
echo ""

# -----------------------------------------------------------------------
# 0. Verificar que se ejecuta desde la raíz del proyecto
# -----------------------------------------------------------------------
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la carpeta raíz del proyecto.${RESET}"
    echo "   Ej: cd 'DJ_a la Carta2.0' && bash build-release-android.sh"
    exit 1
fi

# -----------------------------------------------------------------------
# 1. Compilar el frontend web
# -----------------------------------------------------------------------
echo -e "${CYAN}[1/6] Compilando frontend web de producción...${RESET}"
npm run build
echo -e "  ✅ Web compilada exitosamente."
echo ""

# -----------------------------------------------------------------------
# 1.5. Limpiar APKs de dist y assets para evitar anidamiento recursivo
# -----------------------------------------------------------------------
echo -e "${CYAN}[1.5/6] Limpiando instaladores de dist y assets...${RESET}"
rm -f "dist/DJ.a.la.carta.apk"
rm -f "dist/app-debug.apk"
rm -f "dist/dj-panel-release.apk"
rm -f "dist/app-release.apk"
rm -f "android/app/src/main/assets/public/DJ.a.la.carta.apk"
rm -f "android/app/src/main/assets/public/app-debug.apk"
rm -f "android/app/src/main/assets/public/dj-panel-release.apk"
rm -f "android/app/src/main/assets/public/app-release.apk"
echo ""

# -----------------------------------------------------------------------
# 2. Sincronizar assets con Capacitor
# -----------------------------------------------------------------------
echo -e "${CYAN}[2/6] Sincronizando con Capacitor Android...${RESET}"
npx cap sync android
echo -e "  ✅ Sincronización finalizada."
echo ""

# -----------------------------------------------------------------------
# 3. Localizar Java Runtime (JDK)
# -----------------------------------------------------------------------
echo -e "${CYAN}[3/6] Configurando entorno de Java (JDK)...${RESET}"

AS_JDK="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
AS_JDK_ALT="/Applications/Android Studio.app/Contents/jre/Contents/Home"

if [ -n "${JAVA_HOME:-}" ]; then
    echo -e "  ✅ Usando JAVA_HOME existente: ${GREEN}${JAVA_HOME}${RESET}"
elif [ -d "$AS_JDK" ]; then
    export JAVA_HOME="$AS_JDK"
    echo -e "  ✅ Java detectado en Android Studio (jbr): ${GREEN}${JAVA_HOME}${RESET}"
elif [ -d "$AS_JDK_ALT" ]; then
    export JAVA_HOME="$AS_JDK_ALT"
    echo -e "  ✅ Java detectado en Android Studio (jre): ${GREEN}${JAVA_HOME}${RESET}"
elif command -v java &> /dev/null; then
    echo -e "  ✅ Usando Java por defecto del sistema."
else
    echo -e "${RED}❌ Error: No se encontró ningún Java Runtime (JDK).${RESET}"
    echo "   Por favor, instala Java o asegúrate de que Android Studio esté instalado."
    exit 1
fi
echo ""

# -----------------------------------------------------------------------
# 4. Verificar y Generar KeyStore de Producción si no existe
# -----------------------------------------------------------------------
echo -e "${CYAN}[4/6] Verificando Keystore de firma...${RESET}"
KEYSTORE_PATH="android/app/my-release-key.keystore"

if [ -f "$KEYSTORE_PATH" ]; then
    echo -e "  ✅ Keystore existente detectado en: ${GREEN}${KEYSTORE_PATH}${RESET}"
else
    echo -e "${YELLOW}⚠️ No se encontró keystore en ${KEYSTORE_PATH}. Generando uno nuevo...${RESET}"
    
    # Ejecutar keytool para crear la llave de forma automatizada y silenciosa
    keytool -genkey -v \
      -keystore "$KEYSTORE_PATH" \
      -alias djpanel \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000 \
      -storepass djpanel123 \
      -keypass djpanel123 \
      -dname "CN=DJ Panel, OU=Development, O=DJ Interactive, L=Mexico, S=Mexico, C=MX"
      
    echo -e "  ✅ Keystore de producción generado y firmado con éxito."
fi
echo ""

# -----------------------------------------------------------------------
# 5. Compilar APK de Release usando Gradle
# -----------------------------------------------------------------------
echo -e "${CYAN}[5/6] Ejecutando compilación del APK de Release con Gradle...${RESET}"
cd android
./gradlew assembleRelease
cd ..
echo -e "  ✅ Gradle finalizó la compilación de Release con éxito."
echo ""

# -----------------------------------------------------------------------
# 6. Copiar APK final a la raíz
# -----------------------------------------------------------------------
echo -e "${CYAN}[6/6] Copiando archivo APK de Release generado...${RESET}"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
DEST_PATH="./dj-panel-release.apk"

if [ -f "$APK_PATH" ]; then
    cp "$APK_PATH" "$DEST_PATH"
    echo -e "  🎉 ${GREEN}¡COMPILACIÓN DE RELEASE EXITOSA!${RESET}"
    echo -e "  📱 APK Firmado listo para instalar: ${GREEN}${DEST_PATH}${RESET}"
    echo -e "  📂 Tamaño del archivo: ${CYAN}$(du -sh "$DEST_PATH" | cut -f1)${RESET}"
    echo ""
    echo -e "${YELLOW}💡 IMPORTANTE PARA EVITAR ALERTAS DE PLAY PROTECT:${RESET}"
    echo -e "  1. Este APK ya está firmado con tu propia firma única de producción."
    echo -e "  2. Al instalarlo por primera vez fuera de Google Play, Android podría advertir que es un desarrollador desconocido."
    echo -e "  3. Para remover esa alerta permanentemente de este APK, puedes enviarlo a revisión en el formulario oficial de apelaciones de Google Play Protect:"
    echo -e "     ${CYAN}https://support.google.com/googleplay/android-developer/contact/protect_appeals${RESET}"
    echo -e "  4. Google tardará unas pocas horas en aprobarlo y las alertas desaparecerán para todos tus usuarios."
    echo ""
else
    echo -e "${RED}❌ Error: No se pudo localizar el archivo APK compilado en:${RESET}"
    echo "   $APK_PATH"
    exit 1
fi
