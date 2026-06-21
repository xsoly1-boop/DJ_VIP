#!/bin/bash
# ==============================================================================
# SCRIPT DE COMPILACIÓN AUTOMATIZADA DE .IPA PARA IOS/IPADOS — DJ PANEL
# Genera el archivo DJ_Panel.ipa listo para subir a Diawi
# ==============================================================================

set -euo pipefail

RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'
CYAN='\033[1;36m'; PURPLE='\033[1;35m'; RESET='\033[0m'

if [ -t 0 ]; then
    clear
fi

echo -e "${PURPLE}===================================================================${RESET}"
echo -e "${CYAN}      💿 DJ A LA CARTA — COMPILADOR DE ARCHIVO .IPA (IOS) 💿      ${RESET}"
echo -e "${PURPLE}===================================================================${RESET}"
echo -e "  Genera el archivo ${GREEN}DJ_Panel.ipa${RESET} para distribución inalámbrica en Diawi."
echo ""

# 0. Verificar que se ejecuta desde la raíz
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la carpeta raíz del proyecto.${RESET}"
    exit 1
fi

# 1. Verificar Xcode y su configuración
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode no está instalado o no se encuentra en el PATH.${RESET}"
    echo "   Por favor, instala Xcode desde la App Store."
    exit 1
fi

if [[ "$(xcode-select -p)" == *CommandLineTools* ]]; then
    echo -e "${RED}❌ Error: Se detectaron solo las Herramientas de Línea de Comandos (CommandLineTools).${RESET}"
    echo -e "   Para empaquetar una app de iOS/iPadOS necesitas tener instalado Xcode.app completo."
    echo -e "   Si ya tienes Xcode instalado, activa su ruta de desarrollo ejecutando:"
    echo -e "   ${YELLOW}sudo xcode-select -s /Applications/Xcode.app/Contents/Developer${RESET}"
    echo ""
    exit 1
fi


# 2. Generar build web y sincronizar con Capacitor
echo -e "${CYAN}[1/4] Compilando recursos web y sincronizando...${RESET}"
npm run build
npx cap sync ios
echo -e "  ✅ Recursos web sincronizados con el proyecto iOS."
echo ""

# 3. Crear exportOptions.plist temporal para la firma de desarrollo
echo -e "${CYAN}[2/4] Preparando perfil de exportación...${RESET}"
cat <<EOF > exportOptions.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF
echo -e "  ✅ exportOptions.plist creado temporariamente."
echo ""

# Limpiar carpetas de build anteriores
rm -rf build

# 4. Generar Archivo (.xcarchive)
echo -e "${CYAN}[3/4] Creando archivo Xcode (.xcarchive)...${RESET}"
set +e
xcodebuild -workspace ios/App/App.xcworkspace \
           -scheme App \
           -configuration Debug \
           -archivePath build/App.xcarchive \
           archive \
           -allowProvisioningUpdates
ARCHIVE_EXIT=$?
set -e

if [ $ARCHIVE_EXIT -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Error durante el archivado de la aplicación en Xcode.${RESET}"
    echo -e "${YELLOW}💡 Causa probable: Falta configurar la firma y el equipo de desarrollador (Team).${RESET}"
    echo "   Sigue estos pasos rápidos para solucionarlo:"
    echo "   1. Abre el proyecto en Xcode ejecutando: npx cap open ios"
    echo "   2. Selecciona el proyecto 'App' en la barra lateral izquierda."
    echo "   3. Ve a la pestaña 'Signing & Capabilities'."
    echo "   4. En 'Team', selecciona tu Apple ID o equipo personal de firma."
    echo "   5. Intenta ejecutar de nuevo este script."
    rm -f exportOptions.plist
    rm -rf build
    exit $ARCHIVE_EXIT
fi

# 5. Exportar el archivo .ipa
echo ""
echo -e "${CYAN}[4/4] Exportando archivo final .ipa para desarrollo...${RESET}"
set +e
xcodebuild -exportArchive \
           -archivePath build/App.xcarchive \
           -exportOptionsPlist exportOptions.plist \
           -exportPath build \
           -allowProvisioningUpdates
EXPORT_EXIT=$?
set -e

rm -f exportOptions.plist

if [ $EXPORT_EXIT -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Error al exportar el archivo .ipa.${RESET}"
    echo -e "${YELLOW}💡 Asegúrate de tener al menos un dispositivo iPad/iPhone registrado en tu Apple ID en Xcode.${RESET}"
    rm -rf build
    exit $EXPORT_EXIT
fi

# Localizar y mover el archivo .ipa
IPA_FILE=$(find build -name "*.ipa" 2>/dev/null | head -1)

if [ -n "${IPA_FILE:-}" ] && [ -f "$IPA_FILE" ]; then
    mv "$IPA_FILE" ./DJ_Panel.ipa
    rm -rf build
    echo ""
    echo -e "${PURPLE}===================================================================${RESET}"
    echo -e "${GREEN}    🎉 ¡COMPILACIÓN EXITOSA! EL ARCHIVO .IPA ESTÁ LISTO 🎉         ${RESET}"
    echo -e "${PURPLE}===================================================================${RESET}"
    echo -e "  📦 Archivo  : ${CYAN}DJ_Panel.ipa${RESET} (guardado en la raíz del proyecto)"
    echo -e "  📏 Tamaño   : ${CYAN}$(du -sh DJ_Panel.ipa | cut -f1)${RESET}"
    echo ""
    echo -e "  👉 ${YELLOW}Siguiente Paso:${RESET} Sube este archivo a ${GREEN}https://www.diawi.com/${RESET}"
    echo "     para obtener tu enlace e instalarlo de forma inalámbrica en tus dispositivos."
    echo ""
else
    echo -e "${RED}❌ No se pudo encontrar el archivo .ipa exportado en la carpeta de compilación.${RESET}"
    rm -rf build
    exit 1
fi
