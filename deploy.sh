#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#  DJ PANEL PRO — SCRIPT MAESTRO DE COMPILACIÓN Y DESPLIEGUE
# ══════════════════════════════════════════════════════════════════════════════
#  Compila, empaqueta y despliega la plataforma DJ Panel Pro a todas las
#  plataformas soportadas, con opción de seleccionar qué compilar.
#
#  Plataformas:  Android APK · macOS DMG (Silicon + Intel) · Windows EXE
#  Servicios:    GitHub Releases · Vercel · Render · Firebase RTDB
#
#  USO:  bash deploy.sh [opciones]
#  AYUDA: bash deploy.sh --help
# ══════════════════════════════════════════════════════════════════════════════

set -uo pipefail

# ─── COLORES ──────────────────────────────────────────────────────────────────
RED='\033[1;31m';    GREEN='\033[1;32m';  YELLOW='\033[1;33m'
CYAN='\033[1;36m';   PURPLE='\033[1;35m'; BLUE='\033[1;34m'
WHITE='\033[1;37m';  DIM='\033[2m';       RESET='\033[0m'
BG_GREEN='\033[42m'; BG_RED='\033[41m';   BG_PURPLE='\033[45m'
BOLD='\033[1m'

# ─── VARIABLES GLOBALES ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
RESULTS=()
BUILD_LOG="${PROJECT_DIR}/deploy_${TIMESTAMP}.log"

# Flags de selección (0 = no seleccionado, 1 = seleccionado)
BUILD_ANDROID=0
BUILD_MACOS_SILICON=0
BUILD_MACOS_INTEL=0
BUILD_WINDOWS=0
DEPLOY_GITHUB=0
DEPLOY_VERCEL=0
DEPLOY_RENDER=0  # Render se despliega automáticamente al hacer push
SYNC_FIREBASE=0
DO_GIT_PUSH=0
BUILD_ALL=0
CUSTOM_VERSION=""
SKIP_MENU=0
QUIET=0

# ─── FUNCIONES UTILITARIAS ───────────────────────────────────────────────────

print_header() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${PURPLE}║${RESET}  ${WHITE}💿  DJ PANEL PRO — COMPILACIÓN Y DESPLIEGUE MULTIPLATAFORMA${RESET}  ${PURPLE}║${RESET}"
    echo -e "${PURPLE}╠══════════════════════════════════════════════════════════════════════╣${RESET}"
    echo -e "${PURPLE}║${RESET}  ${DIM}Compila · Empaqueta · Sube a GitHub · Despliega a producción${RESET}   ${PURPLE}║${RESET}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
}

print_step() {
    local step="$1"
    local total="$2"
    local msg="$3"
    local icon="${4:-⚙️}"
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "  ${icon}  ${WHITE}[${step}/${total}] ${msg}${RESET}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

log_ok()   { echo -e "  ${GREEN}✅ $1${RESET}"; }
log_warn() { echo -e "  ${YELLOW}⚠️  $1${RESET}"; }
log_err()  { echo -e "  ${RED}❌ $1${RESET}"; }
log_info() { echo -e "  ${CYAN}ℹ️  $1${RESET}"; }

log_result() {
    local platform="$1" status="$2" detail="$3"
    if [ "$status" = "OK" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        RESULTS+=("  ${GREEN}✅ ${platform}: ${detail}${RESET}")
    elif [ "$status" = "SKIP" ]; then
        SKIP_COUNT=$((SKIP_COUNT + 1))
        RESULTS+=("  ${DIM}⏭️  ${platform}: Omitido${RESET}")
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        RESULTS+=("  ${RED}❌ ${platform}: ${detail}${RESET}")
    fi
}

spinner() {
    local pid=$1
    local spin='⣾⣽⣻⢿⡿⣟⣯⣷'
    local i=0
    while kill -0 "$pid" 2>/dev/null; do
        printf "\r  ${PURPLE}${spin:i++%${#spin}:1}${RESET} Procesando..."
        sleep 0.1
    done
    printf "\r                          \r"
}

# Obtener la versión actual del proyecto
get_current_version() {
    node -e "
        const fs = require('fs');
        try {
            const c = fs.readFileSync('src/utils/AppVersionConfig.js','utf8');
            const m = c.match(/CURRENT_APP_VERSION\s*=\s*[\"']([^\"']+)[\"']/);
            console.log(m ? m[1] : '1.0.0.0');
        } catch(e) { console.log('1.0.0.0'); }
    "
}

# Incrementar versión automáticamente (último dígito +1)
increment_version() {
    local current="$1"
    local base="${current%.*}"
    local patch="${current##*.}"
    echo "${base}.$((patch + 1))"
}

# ─── AYUDA (--help) ──────────────────────────────────────────────────────────

show_help() {
    cat << 'HELP_END'

╔══════════════════════════════════════════════════════════════════════╗
║     💿 DJ PANEL PRO — MANUAL DEL SCRIPT DE DESPLIEGUE (deploy.sh)  ║
╚══════════════════════════════════════════════════════════════════════╝

DESCRIPCIÓN
  Script maestro que compila, empaqueta y despliega DJ Panel Pro a
  todas las plataformas soportadas con un solo comando o de forma
  selectiva mediante un menú interactivo.

USO
  bash deploy.sh                 Abre el menú interactivo
  bash deploy.sh --all           Compila TODO y despliega
  bash deploy.sh --android       Solo compila APK Android
  bash deploy.sh --macos         Compila DMG Silicon + Intel
  bash deploy.sh --silicon       Solo DMG Apple Silicon (arm64)
  bash deploy.sh --intel         Solo DMG Intel (x64)
  bash deploy.sh --windows       Solo EXE Windows (x64)
  bash deploy.sh --version X.Y.Z.W  Especifica la versión manualmente
  bash deploy.sh --help          Muestra esta ayuda

OPCIONES COMBINABLES (pueden usarse juntas)
  --android          Compilar APK Android
  --silicon          Compilar DMG macOS Apple Silicon (arm64)
  --intel            Compilar DMG macOS Intel (x64)
  --macos            Equivale a --silicon --intel
  --windows          Compilar EXE Windows (cross-compile)
  --github           Crear GitHub Release y subir binarios
  --vercel           Desplegar frontend a Vercel
  --firebase         Sincronizar version en Firebase RTDB
  --push             Hacer git commit + push al remoto
  --all              Seleccionar TODO (compilar + desplegar + push)
  --version X.Y.Z.W  Versión manual (si se omite, auto-incrementa)
  --quiet            Menos output (solo resumen final)

EJEMPLOS
  # Compilar solo Android y hacer push:
  bash deploy.sh --android --push

  # Release completo con versión específica:
  bash deploy.sh --all --version 1.0.1.0

  # Solo macOS y subir a GitHub:
  bash deploy.sh --macos --github --push

  # Solo sincronizar Firebase y Vercel sin compilar:
  bash deploy.sh --firebase --vercel --push

MENÚ INTERACTIVO
  Si ejecutas el script sin argumentos, se mostrará un menú con
  checkboxes donde puedes seleccionar qué plataformas compilar y
  qué servicios actualizar.

FLUJO DE EJECUCIÓN
  1. Verificar entorno (Node, Java, Wine, Git)
  2. Incrementar versión (o usar la proporcionada con --version)
  3. Compilar frontend web (Vite)
  4. Compilar plataformas seleccionadas (Android/macOS/Windows)
  5. Crear GitHub Release y subir binarios (si seleccionado)
  6. Actualizar version.json + Firebase RTDB
  7. Desplegar a Vercel (si seleccionado)
  8. Git commit + push (Render se despliega automáticamente)
  9. Resumen final con URLs

REQUISITOS
  • Node.js v18+
  • Java JDK 17+ (para Android, auto-detecta Android Studio JBR)
  • Xcode Command Line Tools (para macOS)
  • Wine (opcional, para cross-compile Windows desde macOS)
  • Git configurado con acceso al repositorio
  • .env con GITHUB_TOKEN y GITHUB_REPO definidos
  • serviceAccountKey.json para Firebase RTDB

ARCHIVOS GENERADOS
  releases/<version>/          Directorio con todos los binarios
  deploy_<timestamp>.log       Log completo de la sesión
  public/version.json          Actualizado con nueva versión + URLs
  src/utils/AppVersionConfig.js  Versión interna de la app

SERVICIOS ACTUALIZADOS
  • GitHub Releases   → DMGs arm64/x64 como assets del release
  • Vercel            → Frontend web (https://dj-vip.vercel.app)
  • Render            → Backend API (se despliega con git push)
  • Firebase RTDB     → config/updates con versión y URLs de descarga

HELP_END
    exit 0
}

# ─── PARSEAR ARGUMENTOS ──────────────────────────────────────────────────────

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help|-h)       show_help ;;
            --all|-a)        BUILD_ALL=1; SKIP_MENU=1 ;;
            --android)       BUILD_ANDROID=1; SKIP_MENU=1 ;;
            --silicon)       BUILD_MACOS_SILICON=1; SKIP_MENU=1 ;;
            --intel)         BUILD_MACOS_INTEL=1; SKIP_MENU=1 ;;
            --macos)         BUILD_MACOS_SILICON=1; BUILD_MACOS_INTEL=1; SKIP_MENU=1 ;;
            --windows|--win) BUILD_WINDOWS=1; SKIP_MENU=1 ;;
            --github)        DEPLOY_GITHUB=1; SKIP_MENU=1 ;;
            --vercel)        DEPLOY_VERCEL=1; SKIP_MENU=1 ;;
            --firebase)      SYNC_FIREBASE=1; SKIP_MENU=1 ;;
            --push)          DO_GIT_PUSH=1; SKIP_MENU=1 ;;
            --quiet|-q)      QUIET=1 ;;
            --version|-v)
                shift
                if [[ $# -gt 0 ]]; then
                    CUSTOM_VERSION="$1"
                else
                    echo -e "${RED}❌ --version requiere un valor (ej: 1.0.0.50)${RESET}"
                    exit 1
                fi
                ;;
            *)
                echo -e "${RED}❌ Opción desconocida: $1${RESET}"
                echo "   Usa: bash deploy.sh --help"
                exit 1
                ;;
        esac
        shift
    done

    # Si se seleccionó --all, activar todo
    if [ "$BUILD_ALL" -eq 1 ]; then
        BUILD_ANDROID=1
        BUILD_MACOS_SILICON=1
        BUILD_MACOS_INTEL=1
        BUILD_WINDOWS=1
        DEPLOY_GITHUB=1
        DEPLOY_VERCEL=1
        SYNC_FIREBASE=1
        DO_GIT_PUSH=1
    fi
}

# ─── MENÚ INTERACTIVO ────────────────────────────────────────────────────────

show_interactive_menu() {
    local CURRENT_VER
    CURRENT_VER=$(get_current_version)
    local NEXT_VER
    NEXT_VER=$(increment_version "$CURRENT_VER")

    echo -e "${CYAN}  Versión actual: ${WHITE}${CURRENT_VER}${RESET}"
    echo -e "${CYAN}  Próxima versión: ${GREEN}${NEXT_VER}${RESET} ${DIM}(auto-incremento)${RESET}"
    echo ""
    echo -e "${WHITE}  Selecciona las plataformas y servicios a ejecutar:${RESET}"
    echo -e "${DIM}  (Escribe los números separados por espacio y presiona Enter)${RESET}"
    echo ""
    echo -e "  ${YELLOW}── COMPILAR ──────────────────────────────────────────────${RESET}"
    echo -e "   ${GREEN}1${RESET}) 📱 Android APK"
    echo -e "   ${GREEN}2${RESET}) 🍎 macOS DMG — Apple Silicon (arm64)"
    echo -e "   ${GREEN}3${RESET}) 💻 macOS DMG — Intel x64 (macOS 10.14+)"
    echo -e "   ${GREEN}4${RESET}) 🪟 Windows EXE — Instalador NSIS (x64)"
    echo ""
    echo -e "  ${YELLOW}── DESPLEGAR ─────────────────────────────────────────────${RESET}"
    echo -e "   ${GREEN}5${RESET}) 🐙 GitHub Release (crear release + subir binarios)"
    echo -e "   ${GREEN}6${RESET}) ▲  Vercel (desplegar frontend web)"
    echo -e "   ${GREEN}7${RESET}) 🔥 Firebase RTDB (sincronizar versión y URLs)"
    echo -e "   ${GREEN}8${RESET}) 📤 Git Push (commit + push → Render se autodespliega)"
    echo ""
    echo -e "  ${YELLOW}── ATAJOS ────────────────────────────────────────────────${RESET}"
    echo -e "   ${GREEN}9${RESET}) ⭐ TODO (compilar todas las plataformas + desplegar todo)"
    echo -e "   ${GREEN}0${RESET}) ❌ Cancelar"
    echo ""
    echo -ne "  ${WHITE}Tu selección: ${RESET}"

    read -r SELECTION

    if [ -z "$SELECTION" ] || [ "$SELECTION" = "0" ]; then
        echo ""
        echo -e "  ${YELLOW}Operación cancelada.${RESET}"
        exit 0
    fi

    for opt in $SELECTION; do
        case "$opt" in
            1) BUILD_ANDROID=1 ;;
            2) BUILD_MACOS_SILICON=1 ;;
            3) BUILD_MACOS_INTEL=1 ;;
            4) BUILD_WINDOWS=1 ;;
            5) DEPLOY_GITHUB=1 ;;
            6) DEPLOY_VERCEL=1 ;;
            7) SYNC_FIREBASE=1 ;;
            8) DO_GIT_PUSH=1 ;;
            9) BUILD_ANDROID=1; BUILD_MACOS_SILICON=1; BUILD_MACOS_INTEL=1
               BUILD_WINDOWS=1; DEPLOY_GITHUB=1; DEPLOY_VERCEL=1
               SYNC_FIREBASE=1; DO_GIT_PUSH=1 ;;
            0) echo -e "  ${YELLOW}Cancelado.${RESET}"; exit 0 ;;
            *) echo -e "  ${RED}Opción inválida: ${opt} (ignorada)${RESET}" ;;
        esac
    done

    # Si no seleccionó nada válido
    if [ $BUILD_ANDROID -eq 0 ] && [ $BUILD_MACOS_SILICON -eq 0 ] && \
       [ $BUILD_MACOS_INTEL -eq 0 ] && [ $BUILD_WINDOWS -eq 0 ] && \
       [ $DEPLOY_GITHUB -eq 0 ] && [ $DEPLOY_VERCEL -eq 0 ] && \
       [ $SYNC_FIREBASE -eq 0 ] && [ $DO_GIT_PUSH -eq 0 ]; then
        echo -e "  ${YELLOW}No se seleccionó ninguna opción válida.${RESET}"
        exit 0
    fi

    # Preguntar por versión personalizada
    echo ""
    echo -ne "  ${CYAN}¿Versión personalizada? ${DIM}(Enter para ${NEXT_VER}): ${RESET}"
    read -r VER_INPUT
    if [ -n "$VER_INPUT" ]; then
        CUSTOM_VERSION="$VER_INPUT"
    fi
}

# ─── MOSTRAR SELECCIÓN ───────────────────────────────────────────────────────

show_selection_summary() {
    echo ""
    echo -e "${CYAN}  ╭─ Selección confirmada ────────────────────────────────────╮${RESET}"
    [ $BUILD_ANDROID -eq 1 ]       && echo -e "${CYAN}  │${RESET}  📱 Android APK                                         ${CYAN}│${RESET}"
    [ $BUILD_MACOS_SILICON -eq 1 ] && echo -e "${CYAN}  │${RESET}  🍎 macOS DMG Apple Silicon (arm64)                      ${CYAN}│${RESET}"
    [ $BUILD_MACOS_INTEL -eq 1 ]   && echo -e "${CYAN}  │${RESET}  💻 macOS DMG Intel x64                                  ${CYAN}│${RESET}"
    [ $BUILD_WINDOWS -eq 1 ]       && echo -e "${CYAN}  │${RESET}  🪟 Windows EXE x64                                      ${CYAN}│${RESET}"
    [ $DEPLOY_GITHUB -eq 1 ]       && echo -e "${CYAN}  │${RESET}  🐙 GitHub Release                                       ${CYAN}│${RESET}"
    [ $DEPLOY_VERCEL -eq 1 ]       && echo -e "${CYAN}  │${RESET}  ▲  Vercel deploy                                        ${CYAN}│${RESET}"
    [ $SYNC_FIREBASE -eq 1 ]       && echo -e "${CYAN}  │${RESET}  🔥 Firebase RTDB sync                                   ${CYAN}│${RESET}"
    [ $DO_GIT_PUSH -eq 1 ]         && echo -e "${CYAN}  │${RESET}  📤 Git Push (→ Render autodeploy)                       ${CYAN}│${RESET}"
    echo -e "${CYAN}  ╰──────────────────────────────────────────────────────────╯${RESET}"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
#  FUNCIONES DE COMPILACIÓN
# ═══════════════════════════════════════════════════════════════════════════════

verify_environment() {
    print_step "1" "$TOTAL_STEPS" "Verificando entorno del sistema" "🔍"

    # Node.js
    if ! command -v node &> /dev/null; then
        log_err "Node.js no está instalado"
        exit 1
    fi
    log_ok "Node.js $(node -v) | npm $(npm -v)"

    # Arquitectura
    ARCH=$(uname -m)
    log_ok "Sistema: $(uname -s) ${ARCH}"

    # Git
    if command -v git &> /dev/null; then
        local branch
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
        log_ok "Git: rama ${branch}"
    else
        log_warn "Git no disponible"
    fi

    # Java (para Android)
    JAVA_OK=0
    if [ $BUILD_ANDROID -eq 1 ]; then
        local AS_JDK="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
        local AS_JDK_ALT="/Applications/Android Studio.app/Contents/jre/Contents/Home"

        if [ -n "${JAVA_HOME:-}" ]; then
            JAVA_OK=1
            log_ok "Java: JAVA_HOME configurado"
        elif [ -d "$AS_JDK" ]; then
            export JAVA_HOME="$AS_JDK"
            JAVA_OK=1
            log_ok "Java: Android Studio JBR"
        elif [ -d "$AS_JDK_ALT" ]; then
            export JAVA_HOME="$AS_JDK_ALT"
            JAVA_OK=1
            log_ok "Java: Android Studio JRE"
        elif command -v java &> /dev/null; then
            JAVA_OK=1
            log_ok "Java: Sistema"
        else
            log_warn "Java no encontrado — Android build se omitirá"
            BUILD_ANDROID=0
        fi
    fi

    # Wine (para Windows)
    if [ $BUILD_WINDOWS -eq 1 ]; then
        if command -v wine64 &> /dev/null || command -v wine &> /dev/null; then
            log_ok "Wine: disponible para cross-compile Windows"
        else
            log_info "Wine no encontrado — se usará electron-builder nativo"
        fi
    fi

    # GitHub Token
    if [ $DEPLOY_GITHUB -eq 1 ]; then
        if [ -z "${GITHUB_TOKEN:-}" ]; then
            log_warn "GITHUB_TOKEN no configurado en .env — GitHub Release se omitirá"
            DEPLOY_GITHUB=0
        else
            log_ok "GitHub: token ****${GITHUB_TOKEN: -6} | repo ${GITHUB_REPO:-xsoly1-boop/DJ_VIP}"
        fi
    fi
}

bump_version() {
    print_step "2" "$TOTAL_STEPS" "Actualizando versión del proyecto" "🏷️"

    CURRENT_VERSION=$(get_current_version)

    if [ -n "$CUSTOM_VERSION" ]; then
        NEW_VERSION="$CUSTOM_VERSION"
    else
        NEW_VERSION=$(increment_version "$CURRENT_VERSION")
    fi

    echo -e "  ${DIM}Anterior:${RESET} ${YELLOW}${CURRENT_VERSION}${RESET}"
    echo -e "  ${DIM}Nueva:${RESET}    ${GREEN}${NEW_VERSION}${RESET}"

    # Actualizar AppVersionConfig.js
    sed -i '' "s/CURRENT_APP_VERSION = \".*\"/CURRENT_APP_VERSION = \"${NEW_VERSION}\"/" \
        src/utils/AppVersionConfig.js
    log_ok "AppVersionConfig.js → ${NEW_VERSION}"

    # Actualizar version.json
    node -e "
        const fs = require('fs');
        const v = JSON.parse(fs.readFileSync('public/version.json','utf8'));
        v.latestVersion = '${NEW_VERSION}';
        fs.writeFileSync('public/version.json', JSON.stringify(v, null, 2) + '\n', 'utf8');
    "
    log_ok "version.json → ${NEW_VERSION}"

    # Actualizar build.gradle (Android versionCode + versionName)
    if [ -f "android/app/build.gradle" ]; then
        node -e "
            const fs = require('fs');
            let g = fs.readFileSync('android/app/build.gradle','utf8');
            const cm = g.match(/versionCode\s+(\d+)/);
            if (cm) g = g.replace(/versionCode\s+\d+/, 'versionCode ' + (parseInt(cm[1])+1));
            g = g.replace(/versionName\s+[\"'][^\"']+[\"']/, 'versionName \"${NEW_VERSION}\"');
            fs.writeFileSync('android/app/build.gradle', g, 'utf8');
        "
        log_ok "build.gradle → ${NEW_VERSION}"
    fi

    TAG="v${NEW_VERSION}"
    OUTPUT_DIR="releases/${NEW_VERSION}"
    mkdir -p "$OUTPUT_DIR"
}

build_frontend() {
    print_step "3" "$TOTAL_STEPS" "Compilando frontend React + Vite" "⚡"

    npm run build 2>&1 | tail -5
    log_ok "Frontend compilado → dist/"
}

build_android() {
    if [ $BUILD_ANDROID -eq 0 ]; then
        log_result "Android APK" "SKIP" ""
        return
    fi

    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Compilando APK para Android" "📱"
    CURRENT_STEP=$((CURRENT_STEP + 1))

    # Limpiar APKs viejos de dist/assets para evitar anidamiento
    echo -e "  ${DIM}Limpiando binarios de dist/assets...${RESET}"
    rm -f dist/*.apk dist/*.dmg dist/*.ipa 2>/dev/null || true
    rm -f "android/app/src/main/assets/public"/*.apk 2>/dev/null || true
    rm -f "android/app/src/main/assets/public"/*.dmg 2>/dev/null || true
    rm -f "android/app/src/main/assets/public"/*.ipa 2>/dev/null || true

    echo -e "  ${DIM}Sincronizando con Capacitor...${RESET}"
    npx cap sync android 2>&1 | tail -3

    echo -e "  ${DIM}Compilando APK con Gradle...${RESET}"
    set +e
    cd android
    ./gradlew assembleRelease 2>&1 | tee -a "$BUILD_LOG" | tail -8
    local APK_EXIT=$?
    cd ..
    set -e

    local APK_SRC="android/app/build/outputs/apk/release/app-release.apk"
    local APK_DEST="${OUTPUT_DIR}/DJ-Panel-Pro-v${NEW_VERSION}-android.apk"

    if [ $APK_EXIT -eq 0 ] && [ -f "$APK_SRC" ]; then
        cp "$APK_SRC" "$APK_DEST"
        # Copiar a public/ y raíz para Vercel
        cp "$APK_SRC" "./DJ a la Carta Pro.apk"
        cp "$APK_SRC" "./public/DJ a la Carta Pro.apk"
        local size
        size=$(du -sh "$APK_DEST" | cut -f1)
        log_ok "APK Android compilado (${size})"
        log_result "Android APK" "OK" "${APK_DEST} (${size})"
    else
        log_err "Gradle falló. Intentando build debug..."
        set +e
        cd android
        ./gradlew assembleDebug 2>&1 | tail -5
        local DBG_EXIT=$?
        cd ..
        set -e
        local APK_DBG="android/app/build/outputs/apk/debug/app-debug.apk"
        if [ $DBG_EXIT -eq 0 ] && [ -f "$APK_DBG" ]; then
            cp "$APK_DBG" "${OUTPUT_DIR}/DJ-Panel-Pro-v${NEW_VERSION}-android-debug.apk"
            log_warn "Solo build debug exitoso"
            log_result "Android APK (debug)" "OK" "${OUTPUT_DIR}/DJ-Panel-Pro-v${NEW_VERSION}-android-debug.apk"
        else
            log_result "Android APK" "FAIL" "Gradle falló en release y debug"
        fi
    fi
}

build_macos_silicon() {
    if [ $BUILD_MACOS_SILICON -eq 0 ]; then
        log_result "macOS Silicon DMG" "SKIP" ""
        return
    fi

    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Compilando DMG macOS Apple Silicon (arm64)" "🍎"
    CURRENT_STEP=$((CURRENT_STEP + 1))

    rm -rf dist-desktop/*.dmg dist-desktop/*.blockmap 2>/dev/null || true

    set +e
    CSC_IDENTITY_AUTO_DISCOVERY=false \
    CSC_LINK="" \
    npx electron-builder --mac --arm64 --publish never 2>&1 | tee -a "$BUILD_LOG" | tail -10
    local EXIT_CODE=$?
    set -e

    if [ $EXIT_CODE -eq 0 ]; then
        DMG_ARM=$(find dist-desktop -maxdepth 1 -name "*arm64*.dmg" 2>/dev/null | head -1)
        [ -z "$DMG_ARM" ] && DMG_ARM=$(find dist-desktop -maxdepth 1 -name "*.dmg" 2>/dev/null | head -1)

        if [ -n "$DMG_ARM" ]; then
            local ARM_DEST="${OUTPUT_DIR}/DJ-Panel-Pro-v${NEW_VERSION}-macOS-Silicon-arm64.dmg"
            cp "$DMG_ARM" "$ARM_DEST"
            # Firma ad-hoc
            codesign --force --sign - "$ARM_DEST" 2>/dev/null || true
            local size
            size=$(du -sh "$ARM_DEST" | cut -f1)
            log_ok "macOS Silicon DMG compilado (${size})"
            log_result "macOS Silicon DMG" "OK" "${ARM_DEST} (${size})"

            # Renombrar en dist-desktop para GitHub upload
            DMG_ARM_FINAL="dist-desktop/DJ Panel Pro-${NEW_VERSION}-arm64.dmg"
            cp "$DMG_ARM" "$DMG_ARM_FINAL" 2>/dev/null || DMG_ARM_FINAL="$DMG_ARM"
        else
            log_result "macOS Silicon DMG" "FAIL" "DMG no encontrado en dist-desktop/"
        fi
    else
        log_result "macOS Silicon DMG" "FAIL" "electron-builder falló"
    fi
}

build_macos_intel() {
    if [ $BUILD_MACOS_INTEL -eq 0 ]; then
        log_result "macOS Intel DMG" "SKIP" ""
        return
    fi

    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Compilando DMG macOS Intel x64 (macOS 10.14+)" "💻"
    CURRENT_STEP=$((CURRENT_STEP + 1))

    # No limpiar dist-desktop si Silicon ya generó su DMG (lo necesitamos para GitHub)
    # Solo limpiar blockmaps
    rm -f dist-desktop/*.blockmap 2>/dev/null || true

    set +e
    CSC_IDENTITY_AUTO_DISCOVERY=false \
    CSC_LINK="" \
    npx electron-builder --mac --x64 --publish never 2>&1 | tee -a "$BUILD_LOG" | tail -10
    local EXIT_CODE=$?
    set -e

    if [ $EXIT_CODE -eq 0 ]; then
        # Buscar el DMG x64 (no arm64)
        DMG_X64=$(find dist-desktop -maxdepth 1 -name "*.dmg" ! -name "*arm64*" 2>/dev/null | head -1)

        if [ -n "$DMG_X64" ]; then
            local X64_DEST="${OUTPUT_DIR}/DJ-Panel-Pro-v${NEW_VERSION}-macOS-Intel-x64.dmg"
            cp "$DMG_X64" "$X64_DEST"
            codesign --force --sign - "$X64_DEST" 2>/dev/null || true
            local size
            size=$(du -sh "$X64_DEST" | cut -f1)
            log_ok "macOS Intel x64 DMG compilado (${size})"
            log_result "macOS Intel DMG" "OK" "${X64_DEST} (${size})"

            # Renombrar en dist-desktop para GitHub upload
            DMG_X64_FINAL="dist-desktop/DJ Panel Pro-${NEW_VERSION}-x64.dmg"
            cp "$DMG_X64" "$DMG_X64_FINAL" 2>/dev/null || DMG_X64_FINAL="$DMG_X64"
        else
            log_result "macOS Intel DMG" "FAIL" "DMG no encontrado en dist-desktop/"
        fi
    else
        log_result "macOS Intel DMG" "FAIL" "electron-builder falló"
    fi
}

build_windows() {
    if [ $BUILD_WINDOWS -eq 0 ]; then
        log_result "Windows EXE" "SKIP" ""
        return
    fi

    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Compilando EXE Windows x64 (cross-compile)" "🪟"
    CURRENT_STEP=$((CURRENT_STEP + 1))

    log_info "Cross-compile desde macOS → Windows. Puede tardar más."

    set +e
    CSC_IDENTITY_AUTO_DISCOVERY=false \
    CSC_LINK="" \
    WIN_CSC_LINK="" \
    WIN_CSC_KEY_PASSWORD="" \
    npx electron-builder --win --x64 --publish never 2>&1 | tee -a "$BUILD_LOG" | tail -15
    local EXIT_CODE=$?
    set -e

    if [ $EXIT_CODE -eq 0 ]; then
        local EXE_FILE
        EXE_FILE=$(find dist-desktop -maxdepth 1 -name "*.exe" 2>/dev/null | head -1)
        if [ -n "$EXE_FILE" ]; then
            local EXE_DEST="${OUTPUT_DIR}/DJ-Panel-Pro-v${NEW_VERSION}-Windows-x64-Setup.exe"
            cp "$EXE_FILE" "$EXE_DEST"
            local size
            size=$(du -sh "$EXE_DEST" | cut -f1)
            log_ok "Windows EXE compilado (${size})"
            log_result "Windows EXE" "OK" "${EXE_DEST} (${size})"
        else
            log_result "Windows EXE" "FAIL" "EXE no encontrado en dist-desktop/"
        fi
    else
        log_result "Windows EXE" "FAIL" "electron-builder cross-compile falló"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
#  FUNCIONES DE DESPLIEGUE
# ═══════════════════════════════════════════════════════════════════════════════

deploy_github_release() {
    if [ $DEPLOY_GITHUB -eq 0 ]; then
        return
    fi

    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Creando GitHub Release v${NEW_VERSION}" "🐙"
    CURRENT_STEP=$((CURRENT_STEP + 1))

    GITHUB_REPO="${GITHUB_REPO:-xsoly1-boop/DJ_VIP}"

    # Crear payload JSON de forma segura con Node
    local JSON_FILE
    JSON_FILE=$(mktemp)
    node -e "
        const fs = require('fs');
        const v = JSON.parse(fs.readFileSync('public/version.json','utf8'));
        const notes = (v.releaseNotes || []).map((n,i) => (i+1)+'. '+n).join('\n');
        const body = '### DJ Panel Pro ${NEW_VERSION}\n\n' + notes +
            '\n\n---\n**Descarga según tu plataforma:**\n' +
            '- 🍎 **Apple Silicon (M1-M4):** DJ Panel Pro-${NEW_VERSION}-arm64.dmg\n' +
            '- 💻 **Intel (macOS 10.14+):** DJ Panel Pro-${NEW_VERSION}-x64.dmg\n' +
            '- 📱 **Android:** DJ-Panel-Pro-v${NEW_VERSION}-android.apk\n' +
            '- 🪟 **Windows:** DJ-Panel-Pro-v${NEW_VERSION}-Windows-x64-Setup.exe\n' +
            '\n*macOS: clic derecho → Abrir (Gatekeeper)*';
        const payload = {
            tag_name: '${TAG}',
            name: 'DJ Panel Pro v${NEW_VERSION}',
            body: body,
            draft: false,
            prerelease: false
        };
        fs.writeFileSync('${JSON_FILE}', JSON.stringify(payload), 'utf8');
    "

    # Crear el release
    local RELEASE_RESPONSE
    RELEASE_RESPONSE=$(curl -s -X POST \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Content-Type: application/json" \
        "https://api.github.com/repos/${GITHUB_REPO}/releases" \
        -d @"${JSON_FILE}")

    rm -f "${JSON_FILE}"

    local RELEASE_ID UPLOAD_URL
    RELEASE_ID=$(echo "$RELEASE_RESPONSE" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id||'')}catch(e){console.log('')}})")
    UPLOAD_URL=$(echo "$RELEASE_RESPONSE" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const u=JSON.parse(d).upload_url||'';console.log(u.replace('{?name,label}',''))}catch(e){console.log('')}})")

    if [ -z "${RELEASE_ID:-}" ]; then
        log_err "Error al crear GitHub Release"
        echo -e "  ${DIM}Respuesta: ${RELEASE_RESPONSE}${RESET}" | head -3
        log_result "GitHub Release" "FAIL" "Error al crear release"
        return
    fi

    log_ok "Release creado: ID ${RELEASE_ID}"

    # Subir binarios como assets
    local upload_count=0

    # DMG arm64
    if [ -n "${DMG_ARM_FINAL:-}" ] && [ -f "${DMG_ARM_FINAL}" ]; then
        echo -e "  ${DIM}📤 Subiendo DMG arm64...${RESET}"
        local ARM_NAME
        ARM_NAME=$(basename "${DMG_ARM_FINAL}" | sed 's/ /%20/g')
        curl -s -X POST \
            -H "Authorization: token ${GITHUB_TOKEN}" \
            -H "Content-Type: application/octet-stream" \
            "${UPLOAD_URL}?name=${ARM_NAME}" \
            --data-binary @"${DMG_ARM_FINAL}" > /dev/null
        log_ok "DMG arm64 subido"
        upload_count=$((upload_count + 1))
    fi

    # DMG x64
    if [ -n "${DMG_X64_FINAL:-}" ] && [ -f "${DMG_X64_FINAL}" ]; then
        echo -e "  ${DIM}📤 Subiendo DMG x64...${RESET}"
        local X64_NAME
        X64_NAME=$(basename "${DMG_X64_FINAL}" | sed 's/ /%20/g')
        curl -s -X POST \
            -H "Authorization: token ${GITHUB_TOKEN}" \
            -H "Content-Type: application/octet-stream" \
            "${UPLOAD_URL}?name=${X64_NAME}" \
            --data-binary @"${DMG_X64_FINAL}" > /dev/null
        log_ok "DMG x64 subido"
        upload_count=$((upload_count + 1))
    fi

    # APK
    local APK_FILE="${OUTPUT_DIR}/DJ-Panel-Pro-v${NEW_VERSION}-android.apk"
    if [ -f "$APK_FILE" ]; then
        echo -e "  ${DIM}📤 Subiendo APK Android...${RESET}"
        curl -s -X POST \
            -H "Authorization: token ${GITHUB_TOKEN}" \
            -H "Content-Type: application/octet-stream" \
            "${UPLOAD_URL}?name=DJ-Panel-Pro-v${NEW_VERSION}-android.apk" \
            --data-binary @"${APK_FILE}" > /dev/null
        log_ok "APK Android subido"
        upload_count=$((upload_count + 1))
    fi

    # EXE
    local EXE_FILE="${OUTPUT_DIR}/DJ-Panel-Pro-v${NEW_VERSION}-Windows-x64-Setup.exe"
    if [ -f "$EXE_FILE" ]; then
        echo -e "  ${DIM}📤 Subiendo EXE Windows...${RESET}"
        curl -s -X POST \
            -H "Authorization: token ${GITHUB_TOKEN}" \
            -H "Content-Type: application/octet-stream" \
            "${UPLOAD_URL}?name=DJ-Panel-Pro-v${NEW_VERSION}-Windows-x64-Setup.exe" \
            --data-binary @"${EXE_FILE}" > /dev/null
        log_ok "EXE Windows subido"
        upload_count=$((upload_count + 1))
    fi

    log_ok "${upload_count} binario(s) subidos a GitHub Release"
    log_result "GitHub Release" "OK" "https://github.com/${GITHUB_REPO}/releases/tag/${TAG}"

    # Actualizar URLs en version.json
    DMG_ARM_URL="https://github.com/${GITHUB_REPO}/releases/download/${TAG}/DJ%20Panel%20Pro-${NEW_VERSION}-arm64.dmg"
    DMG_X64_URL="https://github.com/${GITHUB_REPO}/releases/download/${TAG}/DJ%20Panel%20Pro-${NEW_VERSION}-x64.dmg"

    node -e "
        const fs = require('fs');
        const v = JSON.parse(fs.readFileSync('public/version.json','utf8'));
        v.dmgUrl = '${DMG_ARM_URL}';
        v.dmgUrlIntel = '${DMG_X64_URL}';
        fs.writeFileSync('public/version.json', JSON.stringify(v, null, 2) + '\n', 'utf8');
    "
    log_ok "version.json actualizado con URLs de GitHub"
}

sync_firebase() {
    if [ $SYNC_FIREBASE -eq 0 ]; then
        return
    fi

    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Sincronizando Firebase RTDB" "🔥"
    CURRENT_STEP=$((CURRENT_STEP + 1))

    if [ ! -f "serviceAccountKey.json" ]; then
        log_warn "serviceAccountKey.json no encontrado — Firebase sync omitido"
        log_result "Firebase RTDB" "FAIL" "Sin credenciales"
        return
    fi

    set +e
    node -e "
        const fs = require('fs');
        const admin = require('firebase-admin');
        const sa = require('./serviceAccountKey.json');
        const v = JSON.parse(fs.readFileSync('public/version.json','utf8'));

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(sa),
                databaseURL: 'https://djvip-c2cc9-default-rtdb.firebaseio.com'
            });
        }

        admin.database().ref('config/updates').update({
            latestVersion: v.latestVersion,
            apkUrl: v.apkUrl,
            dmgUrl: v.dmgUrl,
            dmgUrlIntel: v.dmgUrlIntel,
            ipaUrl: v.ipaUrl || 'https://dj-vip.vercel.app/DJ-Panel-Pro.ipa',
            exeUrl: v.exeUrl || 'https://dj-vip.vercel.app/DJ-Panel-Pro-Setup.exe',
            releaseNotes: v.releaseNotes || []
        }).then(() => {
            console.log('Firebase RTDB sincronizado con v${NEW_VERSION}');
            process.exit(0);
        }).catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
    " 2>&1
    local FB_EXIT=$?
    set -e

    if [ $FB_EXIT -eq 0 ]; then
        log_ok "Firebase RTDB → config/updates sincronizado"
        log_result "Firebase RTDB" "OK" "config/updates → v${NEW_VERSION}"
    else
        log_result "Firebase RTDB" "FAIL" "Error al sincronizar"
    fi
}

deploy_vercel() {
    if [ $DEPLOY_VERCEL -eq 0 ]; then
        return
    fi

    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Desplegando a Vercel (producción)" "▲ "
    CURRENT_STEP=$((CURRENT_STEP + 1))

    # Limpiar binarios pesados de dist/ para que Vercel no suba 500MB
    rm -f dist/*.dmg dist/*.exe 2>/dev/null || true

    set +e
    npx vercel --prod --yes 2>&1 | tail -8
    local VERCEL_EXIT=$?
    set -e

    if [ $VERCEL_EXIT -eq 0 ]; then
        log_ok "Frontend desplegado en https://dj-vip.vercel.app"
        log_result "Vercel" "OK" "https://dj-vip.vercel.app"
    else
        log_warn "Vercel deploy tuvo problemas (código: ${VERCEL_EXIT})"
        log_result "Vercel" "FAIL" "Deploy falló"
    fi
}

do_git_push() {
    if [ $DO_GIT_PUSH -eq 0 ]; then
        return
    fi

    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Git commit + push (→ Render autodeploy)" "📤"
    CURRENT_STEP=$((CURRENT_STEP + 1))

    # Construir mensaje de commit dinámico
    local COMMIT_PARTS=()
    [ $BUILD_ANDROID -eq 1 ]       && COMMIT_PARTS+=("APK")
    [ $BUILD_MACOS_SILICON -eq 1 ] && COMMIT_PARTS+=("DMG-arm64")
    [ $BUILD_MACOS_INTEL -eq 1 ]   && COMMIT_PARTS+=("DMG-x64")
    [ $BUILD_WINDOWS -eq 1 ]       && COMMIT_PARTS+=("EXE")

    local PLATFORMS=""
    if [ ${#COMMIT_PARTS[@]} -gt 0 ]; then
        PLATFORMS=$(IFS='+'; echo "${COMMIT_PARTS[*]}")
        PLATFORMS=" — ${PLATFORMS}"
    fi

    local COMMIT_MSG="release: v${NEW_VERSION}${PLATFORMS}, deploy automático"

    git add -A
    set +e
    git commit -m "$COMMIT_MSG" 2>&1 | tail -3
    local COMMIT_EXIT=$?
    set -e

    if [ $COMMIT_EXIT -eq 0 ]; then
        log_ok "Commit: ${COMMIT_MSG}"
    else
        log_info "Nada nuevo que commitear"
    fi

    set +e
    git push origin main 2>&1 | tail -3
    local PUSH_EXIT=$?
    set -e

    if [ $PUSH_EXIT -eq 0 ]; then
        log_ok "Push a origin/main completado"
        log_info "Render se autodesplegará al detectar el push"
        log_result "Git Push / Render" "OK" "Código publicado → Render autodeploy"
    else
        log_err "Git push falló"
        log_result "Git Push" "FAIL" "Error al hacer push"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
#  RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════════════════════

print_summary() {
    local ELAPSED=$(( $(date +%s) - START_TIME ))
    local MINS=$((ELAPSED / 60))
    local SECS=$((ELAPSED % 60))

    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${PURPLE}║${RESET}  ${WHITE}📦  RESUMEN DE COMPILACIÓN Y DESPLIEGUE${RESET}                          ${PURPLE}║${RESET}"
    echo -e "${PURPLE}╠══════════════════════════════════════════════════════════════════════╣${RESET}"
    echo -e "${PURPLE}║${RESET}  Versión  : ${GREEN}v${NEW_VERSION}${RESET}"
    echo -e "${PURPLE}║${RESET}  Fecha    : ${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${RESET}"
    echo -e "${PURPLE}║${RESET}  Duración : ${CYAN}${MINS}m ${SECS}s${RESET}"
    echo -e "${PURPLE}║${RESET}  Éxitos   : ${GREEN}${SUCCESS_COUNT}${RESET}  |  Fallos: ${RED}${FAIL_COUNT}${RESET}  |  Omitidos: ${DIM}${SKIP_COUNT}${RESET}"
    echo -e "${PURPLE}╠══════════════════════════════════════════════════════════════════════╣${RESET}"

    for r in "${RESULTS[@]}"; do
        echo -e "${PURPLE}║${RESET} ${r}"
    done

    echo -e "${PURPLE}╠══════════════════════════════════════════════════════════════════════╣${RESET}"
    echo -e "${PURPLE}║${RESET}  📂 Binarios: ${CYAN}${OUTPUT_DIR}/${RESET}"
    echo -e "${PURPLE}║${RESET}  📋 Log:      ${CYAN}${BUILD_LOG}${RESET}"
    echo -e "${PURPLE}╠══════════════════════════════════════════════════════════════════════╣${RESET}"
    echo -e "${PURPLE}║${RESET}  ${WHITE}URLs de producción:${RESET}"
    echo -e "${PURPLE}║${RESET}  🌐 Web     : ${CYAN}https://dj-vip.vercel.app${RESET}"
    echo -e "${PURPLE}║${RESET}  🔧 API     : ${CYAN}https://dj-vip-pro.onrender.com${RESET}"
    echo -e "${PURPLE}║${RESET}  📋 Release : ${CYAN}https://github.com/${GITHUB_REPO:-xsoly1-boop/DJ_VIP}/releases/tag/${TAG:-latest}${RESET}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""

    # Listar archivos generados
    if [ -d "${OUTPUT_DIR}" ] && [ "$(ls -A "${OUTPUT_DIR}" 2>/dev/null)" ]; then
        echo -e "${CYAN}  Archivos generados:${RESET}"
        ls -lh "${OUTPUT_DIR}/" 2>/dev/null | grep -v "^total" | awk '{printf "    %-50s %s\n", $NF, $5}'
        echo ""
    fi

    # Abrir carpeta en Finder
    if [ -t 0 ] && command -v open &> /dev/null && [ -d "${OUTPUT_DIR}" ]; then
        open "${OUTPUT_DIR}" 2>/dev/null || true
    fi

    if [ "$FAIL_COUNT" -eq 0 ]; then
        echo -e "  ${GREEN}🎉 ¡Todo completado exitosamente!${RESET}"
    else
        echo -e "  ${YELLOW}⚠️  ${FAIL_COUNT} tarea(s) fallaron. Revisa el log: ${BUILD_LOG}${RESET}"
    fi
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    START_TIME=$(date +%s)

    # Verificar directorio del proyecto
    cd "$PROJECT_DIR"
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Error: Ejecuta este script desde la carpeta raíz del proyecto.${RESET}"
        exit 1
    fi

    # Cargar .env
    if [ -f ".env" ]; then
        while IFS='=' read -r key value || [[ -n "$key" ]]; do
            [[ "$key" =~ ^[[:space:]]*#.*$ || -z "${key// }" ]] && continue
            [[ ! "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] && continue
            value="${value%%#*}"
            value="${value#"${value%%[![:space:]]*}"}"
            value="${value%"${value##*[![:space:]]}"}"
            value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
            export "${key}=${value}"
        done < .env
    fi

    # Parsear argumentos CLI
    parse_args "$@"

    # Mostrar header
    if [ -t 0 ]; then clear; fi
    print_header

    # Si no se pasaron flags CLI, mostrar menú interactivo
    if [ $SKIP_MENU -eq 0 ]; then
        show_interactive_menu
    fi

    # Mostrar resumen de selección
    show_selection_summary

    # Calcular total de pasos
    TOTAL_STEPS=3  # base: verificar + versión + frontend
    [ $BUILD_ANDROID -eq 1 ]       && TOTAL_STEPS=$((TOTAL_STEPS + 1))
    [ $BUILD_MACOS_SILICON -eq 1 ] && TOTAL_STEPS=$((TOTAL_STEPS + 1))
    [ $BUILD_MACOS_INTEL -eq 1 ]   && TOTAL_STEPS=$((TOTAL_STEPS + 1))
    [ $BUILD_WINDOWS -eq 1 ]       && TOTAL_STEPS=$((TOTAL_STEPS + 1))
    [ $DEPLOY_GITHUB -eq 1 ]       && TOTAL_STEPS=$((TOTAL_STEPS + 1))
    [ $SYNC_FIREBASE -eq 1 ]       && TOTAL_STEPS=$((TOTAL_STEPS + 1))
    [ $DEPLOY_VERCEL -eq 1 ]       && TOTAL_STEPS=$((TOTAL_STEPS + 1))
    [ $DO_GIT_PUSH -eq 1 ]         && TOTAL_STEPS=$((TOTAL_STEPS + 1))

    CURRENT_STEP=4  # después de verificar(1), versión(2), frontend(3)

    # ── EJECUCIÓN ─────────────────────────────────────────────────────────────

    # 1. Verificar entorno
    verify_environment

    # 2. Bump de versión
    bump_version

    # 3. Compilar frontend
    build_frontend

    # 4-7. Compilar plataformas
    build_android
    build_macos_silicon
    build_macos_intel
    build_windows

    # 8. GitHub Release
    deploy_github_release

    # 9. Firebase RTDB
    sync_firebase

    # 10. Vercel
    deploy_vercel

    # 11. Git Push → Render
    do_git_push

    # ── RESUMEN FINAL ─────────────────────────────────────────────────────────
    print_summary
}

# Ejecutar
main "$@"
