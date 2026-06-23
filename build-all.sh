#!/bin/bash

# ==============================================================================
# SCRIPT MAESTRO DE COMPILACIÓN MULTIPLATAFORMA — DJ PANEL v1.0.0
# Genera: APK (Android), DMG (macOS Silicon/Universal/10.14), EXE (Windows 64-bit)
# ==============================================================================

set -euo pipefail

# Colores
RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'
CYAN='\033[1;36m'; PURPLE='\033[1;35m'; WHITE='\033[1;37m'; RESET='\033[0m'

VERSION="1.0.0"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="releases/${VERSION}"
SUCCESS_COUNT=0
FAIL_COUNT=0
RESULTS=()

# Limpiar pantalla si es interactivo
if [ -t 0 ]; then clear; fi

echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${PURPLE}║${WHITE}       💿 DJ PANEL — COMPILADOR MULTIPLATAFORMA v${VERSION} 💿         ${PURPLE}║${RESET}"
echo -e "${PURPLE}╠═══════════════════════════════════════════════════════════════════╣${RESET}"
echo -e "${PURPLE}║${CYAN}  📱 Android APK                                                 ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${CYAN}  🍎 macOS DMG — Apple Silicon (arm64)                           ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${CYAN}  🍎 macOS DMG — Universal (arm64 + x64)                         ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${CYAN}  🍎 macOS DMG — Legacy (macOS 10.14+ / Intel)                   ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${CYAN}  🪟 Windows EXE — Instalador NSIS (x64)                         ${PURPLE}║${RESET}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# -----------------------------------------------------------------------
# 0. Verificar que se ejecuta desde la raíz del proyecto
# -----------------------------------------------------------------------
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la carpeta raíz del proyecto.${RESET}"
    exit 1
fi

# -----------------------------------------------------------------------
# 1. Verificar entorno
# -----------------------------------------------------------------------
echo -e "${CYAN}[PREP] Verificando entorno del sistema...${RESET}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado.${RESET}"
    exit 1
fi
NODE_VER=$(node -v)
NPM_VER=$(npm -v)
echo -e "  ✅ Node.js ${GREEN}${NODE_VER}${RESET}  |  npm ${GREEN}${NPM_VER}${RESET}"

# Arquitectura
ARCH=$(uname -m)
echo -e "  ✅ Chip: ${GREEN}${ARCH}${RESET} ($(uname -s))"

# Java (para Android)
JAVA_OK=0
AS_JDK="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
AS_JDK_ALT="/Applications/Android Studio.app/Contents/jre/Contents/Home"
if [ -n "${JAVA_HOME:-}" ]; then
    JAVA_OK=1
    echo -e "  ✅ Java: ${GREEN}JAVA_HOME configurado${RESET}"
elif [ -d "$AS_JDK" ]; then
    export JAVA_HOME="$AS_JDK"
    JAVA_OK=1
    echo -e "  ✅ Java: ${GREEN}Android Studio JBR${RESET}"
elif [ -d "$AS_JDK_ALT" ]; then
    export JAVA_HOME="$AS_JDK_ALT"
    JAVA_OK=1
    echo -e "  ✅ Java: ${GREEN}Android Studio JRE${RESET}"
elif command -v java &> /dev/null; then
    JAVA_OK=1
    echo -e "  ✅ Java: ${GREEN}Sistema${RESET}"
else
    echo -e "  ${YELLOW}⚠️  Java no encontrado — se omitirá la compilación de Android${RESET}"
fi

# Wine (para Windows cross-compile)
WINE_OK=0
if command -v wine64 &> /dev/null || command -v wine &> /dev/null; then
    WINE_OK=1
    echo -e "  ✅ Wine: ${GREEN}Disponible para cross-compile Windows${RESET}"
else
    echo -e "  ${YELLOW}ℹ️  Wine no encontrado — se intentará cross-compile nativo de electron-builder${RESET}"
fi

echo ""

# -----------------------------------------------------------------------
# 2. Crear directorio de releases
# -----------------------------------------------------------------------
echo -e "${CYAN}[PREP] Creando directorio de salida: ${OUTPUT_DIR}/${RESET}"
mkdir -p "${OUTPUT_DIR}"
echo ""

# -----------------------------------------------------------------------
# 3. Instalar dependencias
# -----------------------------------------------------------------------
echo -e "${CYAN}[PREP] Instalando dependencias...${RESET}"
if [ -f "package-lock.json" ]; then
    npm ci --include=dev 2>&1 | tail -1
else
    npm install --include=dev 2>&1 | tail -1
fi
echo -e "  ✅ Dependencias instaladas"
echo ""

# -----------------------------------------------------------------------
# 4. Compilar frontend web (Vite) — una sola vez para todos
# -----------------------------------------------------------------------
echo -e "${CYAN}[PREP] Compilando frontend React + Vite...${RESET}"
npm run build
echo -e "  ✅ Frontend compilado"
echo ""

# -----------------------------------------------------------------------
# Función auxiliar para registrar resultados
# -----------------------------------------------------------------------
log_result() {
    local platform="$1"
    local status="$2"
    local file="$3"
    if [ "$status" = "OK" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        local size=$(du -sh "$file" 2>/dev/null | cut -f1)
        RESULTS+=("  ✅ ${platform}: ${GREEN}${file}${RESET} (${size})")
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        RESULTS+=("  ❌ ${platform}: ${RED}FALLÓ${RESET} — ${file}")
    fi
}

# =======================================================================
# BUILD 1: APK ANDROID
# =======================================================================
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${WHITE}  📱 [1/5] COMPILANDO APK PARA ANDROID...${RESET}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

if [ "$JAVA_OK" -eq 1 ] && [ -d "android" ]; then
    set +e
    echo "  Sincronizando con Capacitor..."
    npx cap sync android 2>&1 | tail -3
    
    echo "  Compilando APK con Gradle..."
    cd android
    ./gradlew assembleRelease 2>&1 | tail -5
    APK_EXIT=$?
    cd ..
    set -e
    
    APK_SRC="android/app/build/outputs/apk/release/app-release.apk"
    APK_DEST="${OUTPUT_DIR}/DJ-Panel-v${VERSION}-android.apk"
    
    if [ $APK_EXIT -eq 0 ] && [ -f "$APK_SRC" ]; then
        cp "$APK_SRC" "$APK_DEST"
        log_result "Android APK" "OK" "$APK_DEST"
        echo -e "  ${GREEN}✅ APK Android completado${RESET}"
    else
        # Intentar con debug build si release falla
        echo -e "  ${YELLOW}⚠️  Release falló, intentando debug build...${RESET}"
        set +e
        cd android
        ./gradlew assembleDebug 2>&1 | tail -5
        DBG_EXIT=$?
        cd ..
        set -e
        APK_SRC_DBG="android/app/build/outputs/apk/debug/app-debug.apk"
        APK_DEST_DBG="${OUTPUT_DIR}/DJ-Panel-v${VERSION}-android-debug.apk"
        if [ $DBG_EXIT -eq 0 ] && [ -f "$APK_SRC_DBG" ]; then
            cp "$APK_SRC_DBG" "$APK_DEST_DBG"
            log_result "Android APK (debug)" "OK" "$APK_DEST_DBG"
            echo -e "  ${GREEN}✅ APK Android (debug) completado${RESET}"
        else
            log_result "Android APK" "FAIL" "Gradle falló"
        fi
    fi
else
    if [ "$JAVA_OK" -eq 0 ]; then
        log_result "Android APK" "FAIL" "Java/JDK no disponible"
    else
        log_result "Android APK" "FAIL" "Directorio android/ no encontrado"
    fi
fi
echo ""

# =======================================================================
# BUILD 2: macOS DMG — Apple Silicon (arm64)
# =======================================================================
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${WHITE}  🍎 [2/5] COMPILANDO DMG PARA macOS APPLE SILICON (arm64)...${RESET}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

rm -rf dist-desktop
set +e
CSC_IDENTITY_AUTO_DISCOVERY=false \
CSC_LINK="" \
npx electron-builder --mac --arm64 --publish never 2>&1 | tail -10
MAC_ARM_EXIT=$?
set -e

if [ $MAC_ARM_EXIT -eq 0 ]; then
    DMG_ARM=$(find dist-desktop -name "*arm64*.dmg" 2>/dev/null | head -1)
    if [ -z "$DMG_ARM" ]; then
        DMG_ARM=$(find dist-desktop -name "*.dmg" 2>/dev/null | head -1)
    fi
    if [ -n "$DMG_ARM" ]; then
        DMG_ARM_DEST="${OUTPUT_DIR}/DJ-Panel-v${VERSION}-macOS-Silicon.dmg"
        cp "$DMG_ARM" "$DMG_ARM_DEST"
        # Firma ad-hoc
        codesign --force --sign - "$DMG_ARM_DEST" 2>/dev/null || true
        log_result "macOS Silicon DMG" "OK" "$DMG_ARM_DEST"
        echo -e "  ${GREEN}✅ macOS Silicon DMG completado${RESET}"
    else
        log_result "macOS Silicon DMG" "FAIL" "DMG no encontrado en dist-desktop/"
    fi
else
    log_result "macOS Silicon DMG" "FAIL" "electron-builder falló"
fi
echo ""

# =======================================================================
# BUILD 3: macOS DMG — Universal (arm64 + x64)
# =======================================================================
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${WHITE}  🍎 [3/5] COMPILANDO DMG PARA macOS UNIVERSAL (arm64 + x64)...${RESET}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

rm -rf dist-desktop
set +e
CSC_IDENTITY_AUTO_DISCOVERY=false \
CSC_LINK="" \
npx electron-builder --mac --universal --publish never 2>&1 | tail -10
MAC_UNI_EXIT=$?
set -e

if [ $MAC_UNI_EXIT -eq 0 ]; then
    DMG_UNI=$(find dist-desktop -name "*universal*.dmg" 2>/dev/null | head -1)
    if [ -z "$DMG_UNI" ]; then
        DMG_UNI=$(find dist-desktop -name "*.dmg" 2>/dev/null | head -1)
    fi
    if [ -n "$DMG_UNI" ]; then
        DMG_UNI_DEST="${OUTPUT_DIR}/DJ-Panel-v${VERSION}-macOS-Universal.dmg"
        cp "$DMG_UNI" "$DMG_UNI_DEST"
        codesign --force --sign - "$DMG_UNI_DEST" 2>/dev/null || true
        log_result "macOS Universal DMG" "OK" "$DMG_UNI_DEST"
        echo -e "  ${GREEN}✅ macOS Universal DMG completado${RESET}"
    else
        log_result "macOS Universal DMG" "FAIL" "DMG no encontrado en dist-desktop/"
    fi
else
    log_result "macOS Universal DMG" "FAIL" "electron-builder falló"
fi
echo ""

# =======================================================================
# BUILD 4: macOS DMG — Legacy (macOS 10.14 Mojave / Intel x64)
# =======================================================================
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${WHITE}  🍎 [4/5] COMPILANDO DMG PARA macOS 10.14+ (Intel x64)...${RESET}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

rm -rf dist-desktop
set +e
CSC_IDENTITY_AUTO_DISCOVERY=false \
CSC_LINK="" \
npx electron-builder --mac --x64 --publish never 2>&1 | tail -10
MAC_X64_EXIT=$?
set -e

if [ $MAC_X64_EXIT -eq 0 ]; then
    DMG_X64=$(find dist-desktop -name "*.dmg" 2>/dev/null | head -1)
    if [ -n "$DMG_X64" ]; then
        DMG_X64_DEST="${OUTPUT_DIR}/DJ-Panel-v${VERSION}-macOS-10.14-Intel.dmg"
        cp "$DMG_X64" "$DMG_X64_DEST"
        codesign --force --sign - "$DMG_X64_DEST" 2>/dev/null || true
        log_result "macOS 10.14 Intel DMG" "OK" "$DMG_X64_DEST"
        echo -e "  ${GREEN}✅ macOS 10.14 Intel DMG completado${RESET}"
    else
        log_result "macOS 10.14 Intel DMG" "FAIL" "DMG no encontrado en dist-desktop/"
    fi
else
    log_result "macOS 10.14 Intel DMG" "FAIL" "electron-builder falló"
fi
echo ""

# =======================================================================
# BUILD 5: Windows EXE — NSIS Installer (x64)
# =======================================================================
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${WHITE}  🪟 [5/5] COMPILANDO EXE PARA WINDOWS (x64 NSIS)...${RESET}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${YELLOW}ℹ️  Cross-compile desde macOS → Windows. Puede tardar más.${RESET}"

rm -rf dist-desktop
set +e
CSC_IDENTITY_AUTO_DISCOVERY=false \
CSC_LINK="" \
npx electron-builder --win --x64 --publish never 2>&1 | tail -15
WIN_EXIT=$?
set -e

if [ $WIN_EXIT -eq 0 ]; then
    EXE_FILE=$(find dist-desktop -name "*.exe" 2>/dev/null | head -1)
    if [ -n "$EXE_FILE" ]; then
        EXE_DEST="${OUTPUT_DIR}/DJ-Panel-v${VERSION}-Windows-x64-Setup.exe"
        cp "$EXE_FILE" "$EXE_DEST"
        log_result "Windows x64 EXE" "OK" "$EXE_DEST"
        echo -e "  ${GREEN}✅ Windows EXE completado${RESET}"
    else
        log_result "Windows x64 EXE" "FAIL" "EXE no encontrado en dist-desktop/"
    fi
else
    log_result "Windows x64 EXE" "FAIL" "electron-builder falló (cross-compile)"
fi
echo ""

# =======================================================================
# RESUMEN FINAL
# =======================================================================
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${PURPLE}║${WHITE}              📦 RESUMEN DE COMPILACIÓN COMPLETO                 ${PURPLE}║${RESET}"
echo -e "${PURPLE}╠═══════════════════════════════════════════════════════════════════╣${RESET}"
echo -e "${PURPLE}║${RESET}  Versión  : ${CYAN}${VERSION}${RESET}"
echo -e "${PURPLE}║${RESET}  Fecha    : ${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo -e "${PURPLE}║${RESET}  Éxitos   : ${GREEN}${SUCCESS_COUNT}${RESET}  |  Fallos: ${RED}${FAIL_COUNT}${RESET}"
echo -e "${PURPLE}╠═══════════════════════════════════════════════════════════════════╣${RESET}"

for r in "${RESULTS[@]}"; do
    echo -e "${PURPLE}║${RESET} ${r}"
done

echo -e "${PURPLE}╠═══════════════════════════════════════════════════════════════════╣${RESET}"
echo -e "${PURPLE}║${RESET}  📂 Directorio de salida: ${CYAN}${OUTPUT_DIR}/${RESET}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Listar archivos generados
echo -e "${CYAN}Archivos generados:${RESET}"
ls -lh "${OUTPUT_DIR}/" 2>/dev/null | grep -v "^total" | awk '{print "  " $NF " — " $5}'
echo ""

# Abrir carpeta en Finder si es interactivo
if [ -t 0 ] && command -v open &> /dev/null; then
    open "${OUTPUT_DIR}"
fi

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todas las compilaciones finalizaron exitosamente!${RESET}"
else
    echo -e "${YELLOW}⚠️  ${FAIL_COUNT} compilación(es) fallaron. Revisa los mensajes de error arriba.${RESET}"
fi

exit 0
