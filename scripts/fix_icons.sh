#!/bin/bash
# ==============================================================================
# SCRIPT: Genera y distribuye iconos del app en todos los formatos requeridos
# - Android: mipmap-ldpi/mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi  (ic_launcher*.png)
# - Windows: build-resources/icon.ico  (multi-resolución ICO)
# - macOS/Linux: build-resources/icon.png  (1024x1024)
# Requiere: sips (nativo macOS) + ImageMagick o Python3/Pillow para .ico
# ==============================================================================

set -euo pipefail

RED='\033[1;31m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'
CYAN='\033[1;36m'; RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_ICON="$ROOT/public/icon-512.png"
RES_DIR="$ROOT/android/app/src/main/res"
BUILD_RES="$ROOT/build-resources"
TMP_DIR="$ROOT/.icon_tmp"

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║   🎨 DJ Panel Pro — Generador de Iconos          ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""

# Verificar imagen fuente
if [ ! -f "$SRC_ICON" ]; then
  echo -e "${RED}❌ No se encontró la imagen fuente: $SRC_ICON${RESET}"
  exit 1
fi
echo -e "  ✅ Imagen fuente: ${GREEN}$SRC_ICON${RESET}"

# Crear directorio temporal
rm -rf "$TMP_DIR" && mkdir -p "$TMP_DIR"

# ==============================================================================
# PARTE 1: ANDROID — Generar mipmaps
# Tamaños estándar Android:
#   ldpi=36, mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192
# ==============================================================================
echo ""
echo -e "${CYAN}[1/3] Generando íconos Android (mipmap)...${RESET}"

# Arrays paralelos para compatibilidad bash/zsh
DENSITIES=("ldpi" "mdpi" "hdpi" "xhdpi" "xxhdpi" "xxxhdpi")
SIZES=("36"     "48"   "72"   "96"    "144"    "192")

for i in "${!DENSITIES[@]}"; do
  DENSITY="${DENSITIES[$i]}"
  SIZE="${SIZES[$i]}"
  TARGET_DIR="$RES_DIR/mipmap-$DENSITY"

  if [ ! -d "$TARGET_DIR" ]; then
    echo -e "  ${YELLOW}⚠️  Creando directorio: mipmap-$DENSITY${RESET}"
    mkdir -p "$TARGET_DIR"
  fi

  # ic_launcher.png — ícono cuadrado principal
  sips -z "$SIZE" "$SIZE" "$SRC_ICON" --out "$TARGET_DIR/ic_launcher.png" > /dev/null 2>&1
  # ic_launcher_round.png — ícono circular (Android lo recorta en círculo)
  sips -z "$SIZE" "$SIZE" "$SRC_ICON" --out "$TARGET_DIR/ic_launcher_round.png" > /dev/null 2>&1
  # ic_launcher_foreground.png — capa frontal del ícono adaptativo
  sips -z "$SIZE" "$SIZE" "$SRC_ICON" --out "$TARGET_DIR/ic_launcher_foreground.png" > /dev/null 2>&1
  # ic_launcher_background.png — fondo para adaptive icon (misma imagen, Android gestiona)
  sips -z "$SIZE" "$SIZE" "$SRC_ICON" --out "$TARGET_DIR/ic_launcher_background.png" > /dev/null 2>&1

  echo -e "  ✅ mipmap-${DENSITY}: ${SIZE}x${SIZE}px"
done

# ==============================================================================
# PARTE 2: ANDROID — Ícono adaptativo (anydpi-v26) — simplificado
# Reescribir XMLs para usar drawable en lugar de inset (más compatible)
# ==============================================================================
echo ""
echo -e "${CYAN}[2/3] Actualizando íconos adaptativos (anydpi-v26)...${RESET}"

ANYDPI_DIR="$RES_DIR/mipmap-anydpi-v26"
mkdir -p "$ANYDPI_DIR"

cat > "$ANYDPI_DIR/ic_launcher.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat > "$ANYDPI_DIR/ic_launcher_round.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF

echo -e "  ✅ ic_launcher.xml y ic_launcher_round.xml actualizados"

# ==============================================================================
# PARTE 3: WINDOWS — Generar icon.ico multi-resolución
# ICO necesita: 16, 24, 32, 48, 64, 128, 256 px
# ==============================================================================
echo ""
echo -e "${CYAN}[3/3] Generando icon.ico para Windows...${RESET}"

mkdir -p "$TMP_DIR/ico_frames"

ICO_SIZES=(256 128 64 48 32 24 16)
ICO_FILES=()

for SZ in "${ICO_SIZES[@]}"; do
  FRAME="$TMP_DIR/ico_frames/icon_${SZ}.png"
  sips -z "$SZ" "$SZ" "$SRC_ICON" --out "$FRAME" > /dev/null 2>&1
  ICO_FILES+=("$FRAME")
  echo -e "  📐 Frame ${SZ}x${SZ}px generado"
done

ICO_GENERATED=0

# Intentar con ImageMagick (magick o convert)
if command -v magick &> /dev/null; then
  echo -e "  🔧 Usando ImageMagick (magick) para crear .ico..."
  magick "${ICO_FILES[@]}" "$BUILD_RES/icon.ico"
  ICO_GENERATED=1
elif command -v convert &> /dev/null; then
  echo -e "  🔧 Usando ImageMagick (convert) para crear .ico..."
  convert "${ICO_FILES[@]}" "$BUILD_RES/icon.ico"
  ICO_GENERATED=1
fi

# Si ImageMagick no está disponible, usar Python3 con Pillow
if [ $ICO_GENERATED -eq 0 ] && command -v python3 &> /dev/null; then
  # Comprobar si Pillow está instalado
  if python3 -c "import PIL" 2>/dev/null; then
    echo -e "  🔧 Usando Python3 + Pillow para crear .ico..."
    python3 << PYEOF
import sys
from PIL import Image

output_path = "$BUILD_RES/icon.ico"
frame_paths = [$(printf '"%s", ' "${ICO_FILES[@]}")]

images = []
for p in frame_paths:
    img = Image.open(p).convert("RGBA")
    images.append(img)

images[0].save(
    output_path,
    format="ICO",
    sizes=[(img.width, img.height) for img in images],
    append_images=images[1:]
)
print(f"  ✅ ICO guardado: {output_path}")
PYEOF
    ICO_GENERATED=1
  else
    echo -e "  ${YELLOW}⚠️  Pillow no instalado. Instalando...${RESET}"
    pip3 install Pillow --quiet 2>/dev/null && python3 << PYEOF
from PIL import Image

output_path = "$BUILD_RES/icon.ico"
frame_paths = [$(printf '"%s", ' "${ICO_FILES[@]}")]

images = []
for p in frame_paths:
    img = Image.open(p).convert("RGBA")
    images.append(img)

images[0].save(
    output_path,
    format="ICO",
    sizes=[(img.width, img.height) for img in images],
    append_images=images[1:]
)
print("  ICO guardado correctamente")
PYEOF
    ICO_GENERATED=1
  fi
fi

if [ $ICO_GENERATED -eq 1 ]; then
  echo -e "  ✅ icon.ico generado correctamente"
else
  echo -e "  ${YELLOW}⚠️  No se pudo generar .ico. El icono de Windows puede no actualizarse.${RESET}"
  echo -e "  ${YELLOW}    Instala ImageMagick: brew install imagemagick${RESET}"
fi

# ==============================================================================
# ACTUALIZAR icon.png de build-resources (1024x1024 para macOS/Linux)
# ==============================================================================
echo ""
echo -e "${CYAN}[+] Actualizando build-resources/icon.png (1024x1024)...${RESET}"
# Generar versión 1024x1024 de la imagen fuente
sips -z 1024 1024 "$SRC_ICON" --out "$BUILD_RES/icon.png" > /dev/null 2>&1
echo -e "  ✅ build-resources/icon.png actualizado (1024x1024)"

# ==============================================================================
# LIMPIEZA
# ==============================================================================
rm -rf "$TMP_DIR"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║  ✅ ¡Todos los íconos actualizados correctamente! ║${RESET}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Próximo paso: ejecuta ${CYAN}bash build-android.sh${RESET} para recompilar el APK"
echo ""
