#!/bin/bash

# ===========================================================================
# Compilador de la App Nativa "DJ Builder"
# Usa swiftc (incluido con Xcode Command Line Tools — sin Xcode completo)
# ===========================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SWIFT_SRC="$SCRIPT_DIR/DJBuilder.swift"
APP_NAME="DJ Builder"
APP_BUNDLE="$SCRIPT_DIR/$APP_NAME.app"
BINARY_NAME="DJBuilder"
BINARY_PATH="$APP_BUNDLE/Contents/MacOS/$BINARY_NAME"

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║   🔨  Compilando DJ Builder — App Nativa macOS   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# ── Verificar swiftc ──────────────────────────────────────────────────────
if ! command -v swiftc &>/dev/null; then
    echo "❌ swiftc no encontrado."
    echo "   Instala Xcode Command Line Tools con:"
    echo "   xcode-select --install"
    exit 1
fi

SWIFT_VER=$(swiftc --version 2>&1 | head -1)
echo "✅ Compilador: $SWIFT_VER"
echo ""

# ── Crear estructura .app ─────────────────────────────────────────────────
echo "📁 Creando bundle de la app..."
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# ── Info.plist ────────────────────────────────────────────────────────────
cat > "$APP_BUNDLE/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>      <string>DJBuilder</string>
  <key>CFBundleIdentifier</key>     <string>com.djvip.builder</string>
  <key>CFBundleName</key>           <string>DJ Builder</string>
  <key>CFBundleDisplayName</key>    <string>DJ Builder</string>
  <key>CFBundleVersion</key>        <string>1.0.0</string>
  <key>CFBundleShortVersionString</key><string>1.0.0</string>
  <key>CFBundlePackageType</key>    <string>APPL</string>
  <key>LSMinimumSystemVersion</key> <string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key>       <string>NSApplication</string>
  <key>NSHumanReadableCopyright</key><string>© 2026 DJ a la Carta</string>
  <key>LSUIElement</key>            <false/>
</dict>
</plist>
PLIST

# ── Compilar el binario Swift ─────────────────────────────────────────────
echo "⚙️  Compilando Swift → binario nativo..."
swiftc \
  "$SWIFT_SRC" \
  -framework AppKit \
  -framework Foundation \
  -target arm64-apple-macos12 \
  -O \
  -o "$BINARY_PATH" \
  2>&1

BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
    echo "❌ Error al compilar el Swift. Revisa los errores de arriba."
    exit $BUILD_EXIT
fi

# ── Firma ad-hoc ──────────────────────────────────────────────────────────
echo "🔏 Aplicando firma ad-hoc..."
codesign --force --deep --sign - "$APP_BUNDLE" 2>/dev/null || true

# ── Quitar quarantine para que macOS no bloquee la primera apertura ───────
xattr -cr "$APP_BUNDLE" 2>/dev/null || true

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅  ¡App compilada exitosamente!                 ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "📦 App Bundle: $APP_BUNDLE"
echo "📏 Tamaño:     $(du -sh "$APP_BUNDLE" | cut -f1)"
echo ""
echo "Para abrirla:"
echo "  open \"$APP_BUNDLE\""
echo ""

# Abrir la app inmediatamente
if [ -t 0 ]; then
    open "$APP_BUNDLE"
fi

exit 0
