#!/bin/bash

# ==============================================================================
# SCRIPT DE COMPILACIÓN UNIVERSAL/SELECTIVA PARA MACOS — DJ CONTROL PANEL
# Compatible con Intel (x64) y Apple Silicon (arm64) — DMG Distribuible
# ==============================================================================

set -euo pipefail   # Abortar en cualquier error inesperado

# Colores
RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'
CYAN='\033[1;36m'; PURPLE='\033[1;35m'; RESET='\033[0m'

# Limpiar pantalla si es interactivo y mostrar banner
if [ -t 0 ]; then
    clear
fi

echo -e "${PURPLE}===================================================================${RESET}"
echo -e "${CYAN}      💿 DJ A LA CARTA — COMPILADOR UNIVERSAL PARA MACOS 💿      ${RESET}"
echo -e "${PURPLE}===================================================================${RESET}"
echo -e "  Genera un instalador .dmg compatible con ${GREEN}Intel y Apple Silicon${RESET}"
echo -e "  Funciona en cualquier Mac sin necesidad de Developer ID."
echo ""

# Determinar si la terminal es interactiva (TTY en stdin)
INTERACTIVE=0
if [ -t 0 ]; then
    INTERACTIVE=1
fi

# -----------------------------------------------------------------------
# 0. Verificar que se ejecuta desde la raíz del proyecto
# -----------------------------------------------------------------------
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la carpeta raíz del proyecto.${RESET}"
    echo "   Ej: cd 'DJ_a la Carta2.0' && bash build-macos.sh"
    exit 1
fi

# -----------------------------------------------------------------------
# 1. Verificar entorno del sistema y argumentos de arquitectura
# -----------------------------------------------------------------------
echo -e "${CYAN}[1/6] Verificando entorno del sistema...${RESET}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado.${RESET}"
    echo "   Descárgalo desde: https://nodejs.org/ (versión LTS)"
    exit 1
fi
NODE_VER=$(node -v)
NPM_VER=$(npm -v)
echo -e "  ✅ Node.js ${GREEN}${NODE_VER}${RESET}  |  npm ${GREEN}${NPM_VER}${RESET}"

# Detectar arquitectura del Mac de origen
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    echo -e "  ✅ Chip detectado: ${GREEN}Apple Silicon (M1/M2/M3/M4)${RESET}"
else
    echo -e "  ✅ Chip detectado: ${GREEN}Intel x86_64${RESET}"
fi

# Valores por defecto para la arquitectura
TARGET_ARCH="universal"

# Leer argumentos de línea de comandos
while [[ $# -gt 0 ]]; do
    case "$1" in
        --current)
            if [ "$ARCH" = "arm64" ]; then
                TARGET_ARCH="arm64"
            else
                TARGET_ARCH="x64"
            fi
            shift
            ;;
        arm64|x64|universal)
            TARGET_ARCH="$1"
            shift
            ;;
        *)
            echo -e "${RED}❌ Parámetro desconocido: $1${RESET}"
            echo "   Opciones válidas: --current, arm64, x64, universal"
            exit 1
            ;;
    esac
done

# Verificar Rosetta 2 si es Apple Silicon (sólo si se compila x64 o universal)
if [ "$ARCH" = "arm64" ] && { [ "$TARGET_ARCH" = "universal" ] || [ "$TARGET_ARCH" = "x64" ]; }; then
    if ! /usr/bin/pgrep -q oahd; then
        echo -e "  ${YELLOW}⚠️  Instalando Rosetta 2 para builds universales...${RESET}"
        softwareupdate --install-rosetta --agree-to-license 2>/dev/null || true
    fi
fi

echo ""

# -----------------------------------------------------------------------
# 2. Verificar y cargar archivo .env
# -----------------------------------------------------------------------
echo -e "${CYAN}[2/6] Verificando configuración (.env)...${RESET}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No se encontró .env — la app compilará en modo LOCAL (sin Firebase).${RESET}"
    echo -e "   Puedes crear el .env con tus credenciales de Firebase antes de compilar."
    if [ "$INTERACTIVE" -eq 1 ]; then
        read -p "   ¿Continuar en modo local? [S/n]: " CONT_LOCAL
        if [[ "${CONT_LOCAL,,}" == "n" ]]; then
            echo "Crea el archivo .env con tus credenciales y vuelve a ejecutar el script."
            exit 1
        fi
    else
        echo "   [No interactivo] Continuando automáticamente en modo local."
    fi
else
    # Cargar variables del .env de forma segura (ignorar comentarios y líneas vacías)
    # || [[ -n "$key" ]] previene omitir la última línea si no termina en salto de línea
    while IFS='=' read -r key value || [[ -n "$key" ]]; do
        # Saltar comentarios y líneas vacías
        [[ "$key" =~ ^[[:space:]]*#.*$ || -z "${key// }" ]] && continue
        
        # Validar que la clave sea un identificador bash válido para evitar errores de sintaxis
        if [[ ! "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
            continue
        fi

        value="${value%%#*}"                                  # Quitar comentarios inline
        value="${value#"${value%%[![:space:]]*}"}"            # Trim leading spaces
        value="${value%"${value##*[![:space:]]}"}"            # Trim trailing spaces
        value="${value%\"}"                                   # Quitar comillas dobles finales
        value="${value#\"}"                                   # Quitar comillas dobles iniciales
        value="${value%\'}"                                   # Quitar comillas simples finales
        value="${value#\'}"                                   # Quitar comillas simples iniciales
        export "${key}=${value}"
    done < .env

    # Verificar Firebase API Key
    if [ -z "${VITE_FIREBASE_API_KEY:-}" ]; then
        echo -e "  ${YELLOW}⚠️  VITE_FIREBASE_API_KEY no configurada — modo LOCAL sin Firebase.${RESET}"
    else
        echo -e "  ✅ Firebase API Key detectada"
    fi

    if [ -z "${VITE_FIREBASE_STORAGE_BUCKET:-}" ]; then
        echo -e "  ${YELLOW}⚠️  VITE_FIREBASE_STORAGE_BUCKET no configurado — logos locales sólo.${RESET}"
    else
        echo -e "  ✅ Firebase Storage: ${GREEN}${VITE_FIREBASE_STORAGE_BUCKET}${RESET}"
    fi
fi

# URL de producción para el QR
if [ -z "${VITE_PUBLIC_URL:-}" ]; then
    echo ""
    echo -e "  ${YELLOW}⚠️  VITE_PUBLIC_URL no configurada — el QR no apuntará a tu sitio.${RESET}"
    if [ "$INTERACTIVE" -eq 1 ]; then
        read -p "  Ingresa tu URL de Vercel (ej: https://mi-app.vercel.app) o Enter para omitir: " MANUAL_URL
        if [ -n "${MANUAL_URL:-}" ]; then
            MANUAL_URL="${MANUAL_URL%/}"   # Quitar slash final
            if grep -q "VITE_PUBLIC_URL" .env 2>/dev/null; then
                sed -i '' "s|VITE_PUBLIC_URL=.*|VITE_PUBLIC_URL=${MANUAL_URL}|" .env
            else
                echo "VITE_PUBLIC_URL=${MANUAL_URL}" >> .env
            fi
            export VITE_PUBLIC_URL="${MANUAL_URL}"
            echo -e "  ✅ URL guardada: ${GREEN}${VITE_PUBLIC_URL}${RESET}"
        fi
    else
        echo "   [No interactivo] Omitiendo configuración manual de URL."
    fi
else
    echo -e "  ✅ URL de Vercel (QR): ${GREEN}${VITE_PUBLIC_URL}${RESET}"
fi

echo ""
echo -e "${PURPLE}┌─────────────────────────────────────────────────────────┐${RESET}"
echo -e "${PURPLE}│           RESUMEN PRE-COMPILACIÓN                       │${RESET}"
echo -e "${PURPLE}└─────────────────────────────────────────────────────────┘${RESET}"
echo -e "  🔥 Firebase Proyecto  : ${CYAN}${VITE_FIREBASE_PROJECT_ID:-⚠️  No configurado}${RESET}"
echo -e "  🌐 URL Vercel (QR)    : ${CYAN}${VITE_PUBLIC_URL:-⚠️  Sin configurar}${RESET}"
echo -e "  💾 Storage Logos      : ${CYAN}${VITE_FIREBASE_STORAGE_BUCKET:-⚠️  No configurado}${RESET}"
echo -e "  🖥️  Arquitectura target : ${CYAN}${TARGET_ARCH}${RESET}"
echo ""

if [ "$INTERACTIVE" -eq 1 ]; then
    read -p "¿Todo se ve correcto? Presiona Enter para compilar o Ctrl+C para cancelar... "
else
    echo "  [No interactivo] Procediendo con la compilación..."
fi
echo ""

# -----------------------------------------------------------------------
# 3. Limpiar builds anteriores
# -----------------------------------------------------------------------
echo -e "${CYAN}[3/6] Limpiando compilaciones anteriores...${RESET}"
rm -rf dist dist-desktop
echo -e "  ✅ Carpetas dist/ y dist-desktop/ eliminadas"
echo ""

# -----------------------------------------------------------------------
# 4. Instalar dependencias
# -----------------------------------------------------------------------
echo -e "${CYAN}[4/6] Instalando dependencias del proyecto...${RESET}"
if [ -f "package-lock.json" ]; then
    echo -e "  📦 Detectado package-lock.json, usando 'npm ci' para una instalación limpia y rápida..."
    npm ci --prefer-offline || npm install --prefer-offline
else
    npm install --prefer-offline 2>&1 || npm install
fi
echo -e "  ✅ Dependencias instaladas"
echo ""

# -----------------------------------------------------------------------
# 5. Compilar el frontend web con Vite
# -----------------------------------------------------------------------
echo -e "${CYAN}[5/6] Compilando frontend (React + Vite)...${RESET}"
npm run build
echo -e "  ✅ Frontend compilado correctamente"
echo ""

# -----------------------------------------------------------------------
# 6. Empaquetar con Electron Builder
#    CSC_IDENTITY_AUTO_DISCOVERY=false → deshabilita búsqueda de cert. de Apple
#    CSC_LINK=""      → sin certificado = firma ad-hoc (funciona sin Developer ID)
# -----------------------------------------------------------------------
echo -e "${CYAN}[6/6] Empaquetando instalador macOS (${TARGET_ARCH})...${RESET}"
echo -e "  ${YELLOW}ℹ️  Esto puede tardar varios minutos en la primera vez.${RESET}"
echo ""

# Desactivar temporalmente set -e para capturar código de salida de electron-builder
set +e
CSC_IDENTITY_AUTO_DISCOVERY=false \
CSC_LINK="" \
npx electron-builder --mac --${TARGET_ARCH} --publish never
BUILD_EXIT=$?
set -e

if [ $BUILD_EXIT -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Error durante el empaquetado de Electron.${RESET}"
    echo -e "   Posibles causas:"
    echo -e "   • Falta espacio en disco (se necesitan ~2 GB libres)"
    echo -e "   • Sin conexión a internet para descargar electron binaries"
    echo -e "   • Intenta: ${YELLOW}npm cache clean --force${RESET} y vuelve a ejecutar"
    exit $BUILD_EXIT
fi

echo ""

# -----------------------------------------------------------------------
# Localizar el DMG generado dinámicamente
# -----------------------------------------------------------------------
DMG_FILE=$(find dist-desktop -name "*.dmg" 2>/dev/null | head -1)

# -----------------------------------------------------------------------
# Firma ad-hoc local (para que macOS Gatekeeper no rechace en primera apertura)
# Esto NO requiere Developer ID — permite que se abra en cualquier Mac con
# clic derecho → Abrir, o deshabilitando temporalmente Gatekeeper.
# -----------------------------------------------------------------------
if command -v codesign &> /dev/null; then
    # Firma ad-hoc de la app unpackaged (ayuda si se corre directamente)
    APP_DIR=$(find dist-desktop -name "*.app" -maxdepth 4 2>/dev/null | head -1)
    if [ -n "${APP_DIR:-}" ]; then
        echo -e "  🔏 Aplicando firma ad-hoc a la App unpackaged..."
        codesign --force --deep --sign - "${APP_DIR}" 2>/dev/null && \
            echo -e "  ✅ Firma ad-hoc aplicada a la App" || \
            echo -e "  ${YELLOW}⚠️  No se pudo aplicar firma a la App${RESET}"
    fi

    # Firma ad-hoc del contenedor DMG (ayuda con Gatekeeper al descargar)
    if [ -n "${DMG_FILE:-}" ]; then
        echo -e "  🔏 Aplicando firma ad-hoc al archivo DMG..."
        codesign --force --sign - "${DMG_FILE}" 2>/dev/null && \
            echo -e "  ✅ Firma ad-hoc aplicada al DMG" || \
            echo -e "  ${YELLOW}⚠️  No se pudo aplicar firma al DMG${RESET}"
    fi
fi

# -----------------------------------------------------------------------
# Mostrar resultado final
# -----------------------------------------------------------------------
echo ""
echo -e "${PURPLE}===================================================================${RESET}"
echo -e "${GREEN}       🎉 ¡COMPILACIÓN EXITOSA! EL INSTALADOR ESTÁ LISTO 🎉       ${RESET}"
echo -e "${PURPLE}===================================================================${RESET}"

if [ -n "${DMG_FILE:-}" ]; then
    DMG_SIZE=$(du -sh "${DMG_FILE}" 2>/dev/null | cut -f1)
    echo -e "  📦 Archivo DMG  : ${CYAN}${DMG_FILE}${RESET}"
    echo -e "  📏 Tamaño       : ${CYAN}${DMG_SIZE}${RESET}"
else
    echo -e "  📁 Revisa la carpeta: ${CYAN}dist-desktop/${RESET}"
fi

echo ""
echo -e "${YELLOW}  ┌─────────────────────────────────────────────────────────┐${RESET}"
echo -e "${YELLOW}  │  CÓMO INSTALAR EN OTRO MAC (sin Developer ID)           │${RESET}"
echo -e "${YELLOW}  │                                                         │${RESET}"
echo -e "${YELLOW}  │  1. Copia el .dmg al otro Mac (USB, AirDrop, Drive)    │${RESET}"
echo -e "${YELLOW}  │  2. Doble clic para abrir el .dmg                      │${RESET}"
echo -e "${YELLOW}  │  3. Arrastra 'DJ Control Panel' a Aplicaciones         │${RESET}"
echo -e "${YELLOW}  │  4. Primera apertura: clic derecho → 'Abrir'           │${RESET}"
echo -e "${YELLOW}  │     (solo la primera vez, para omitir Gatekeeper)      │${RESET}"
echo -e "${YELLOW}  │  5. ¡Listo! Ya funciona en cualquier Mac               │${RESET}"
echo -e "${YELLOW}  │                                                         │${RESET}"
echo -e "${YELLOW}  │  💡 Nota: Si Gatekeeper aún bloquea la app, abre       │${RESET}"
echo -e "${YELLOW}  │     la terminal en el Mac de destino y ejecuta:        │${RESET}"
echo -e "${YELLOW}  │     xattr -cr \"/Applications/DJ Control Panel.app\"      │${RESET}"
echo -e "${YELLOW}  └─────────────────────────────────────────────────────────┘${RESET}"
echo ""
echo -e "  🔗 URL Vercel embebida en el QR: ${GREEN}${VITE_PUBLIC_URL:-⚠️ No configurada}${RESET}"
echo ""
echo -e "  ${CYAN}📌 Tip: La compilación '${TARGET_ARCH}' es ideal para este entorno.${RESET}"
echo -e "  ${CYAN}   Puedes compilar sólo para el chip nativo usando: bash build-macos.sh --current${RESET}"
echo ""

# Abrir carpeta en Finder si es interactivo y el comando open está disponible
if [ "$INTERACTIVE" -eq 1 ] && command -v open &> /dev/null; then
    open dist-desktop
fi

if [ "$INTERACTIVE" -eq 1 ]; then
    read -p "Presiona [Enter] para finalizar..."
else
    echo "  [No interactivo] Proceso de compilación terminado."
fi
exit 0
