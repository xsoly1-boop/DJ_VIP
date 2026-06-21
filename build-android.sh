#!/bin/bash

# ==============================================================================
# SCRIPT DE COMPILACIÓN AUTOMÁTICA PARA ANDROID — DJ PANEL
# Sincroniza la web, compila el APK nativo y lo copia a la raíz del proyecto
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
echo -e "${CYAN}        💿 DJ A LA CARTA — COMPILADOR DE APP DE ANDROID 💿        ${RESET}"
echo -e "${PURPLE}===================================================================${RESET}"
echo -e "  Compila y actualiza la aplicación móvil (APK) con los últimos cambios."
echo ""

# -----------------------------------------------------------------------
# 0. Verificar que se ejecuta desde la raíz del proyecto
# -----------------------------------------------------------------------
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la carpeta raíz del proyecto.${RESET}"
    echo "   Ej: cd 'DJ_a la Carta2.0' && bash build-android.sh"
    exit 1
fi

# -----------------------------------------------------------------------
# 1. Compilar el frontend web
# -----------------------------------------------------------------------
echo -e "${CYAN}[1/5] Compilando frontend web de producción...${RESET}"
npm run build
echo -e "  ✅ Web compilada exitosamente."
echo ""

# -----------------------------------------------------------------------
# 2. Sincronizar assets con Capacitor
# -----------------------------------------------------------------------
echo -e "${CYAN}[2/5] Sincronizando con Capacitor Android...${RESET}"
npx cap sync android
echo -e "  ✅ Sincronización finalizada."
echo ""

# -----------------------------------------------------------------------
# 3. Localizar Java Runtime (JDK)
# -----------------------------------------------------------------------
echo -e "${CYAN}[3/5] Configurando entorno de Java (JDK)...${RESET}"

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

# -----------------------------------------------------------------------
# 4. Compilar APK usando Gradle
# -----------------------------------------------------------------------
echo -e "${CYAN}[4/5] Ejecutando compilación del APK nativo con Gradle...${RESET}"
cd android
./gradlew assembleDebug
cd ..
echo -e "  ✅ Gradle finalizó la compilación con éxito."
echo ""

# -----------------------------------------------------------------------
# 5. Copiar APK final a la raíz
# -----------------------------------------------------------------------
echo -e "${CYAN}[5/5] Copiando archivo APK generado...${RESET}"
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
DEST_PATH="./app-debug.apk"

if [ -f "$APK_PATH" ]; then
    cp "$APK_PATH" "$DEST_PATH"
    echo -e "  🎉 ${GREEN}¡COMPILACIÓN EXITOSA!${RESET}"
    echo -e "  📱 APK generado en la raíz: ${GREEN}${DEST_PATH}${RESET}"
    echo -e "  📂 Tamaño del archivo: ${CYAN}$(du -sh "$DEST_PATH" | cut -f1)${RESET}"
    echo ""
    echo "Puedes transferir este archivo a tu celular Android para instalar la actualización."
else
    echo -e "${RED}❌ Error: No se pudo localizar el archivo APK compilado en:${RESET}"
    echo "   $APK_PATH"
    exit 1
fi
