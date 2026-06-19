#!/bin/bash

# ==============================================================================
# SCRIPT DE COMPILACIÓN NATIVA PARA MACBOOK (DJ CONTROL PANEL)
# Diseñado para usuarios con conocimientos básicos.
# ==============================================================================

# Limpiar pantalla y mostrar banner
clear
echo -e "\033[1;35m==================================================================\033[0m"
echo -e "\033[1;36m       💿 PLATAFORMA INTERACTIVA DJ - COMPILADOR MACBOOK 💿       \033[0m"
echo -e "\033[1;35m==================================================================\033[0m"
echo -e "Este asistente preparará el instalador nativo (.dmg) para tu Mac."
echo ""

# 1. Verificar si Node.js está instalado
echo -e "\033[1;34m[1/5] Verificando entorno de software...\033[0m"
if ! command -v node &> /dev/null
then
    echo -e "\033[1;31m⚠️ Error: Node.js no está instalado en este sistema.\033[0m"
    echo "Para compilar la aplicación, necesitas Node.js."
    echo "Por favor, descárgalo e instálalo desde: https://nodejs.org/ (Versión LTS recomendada)"
    echo "Una vez instalado, vuelve a ejecutar este script."
    read -p "Presiona Enter para salir..."
    exit 1
else
    NODE_VER=$(node -v)
    NPM_VER=$(npm -v)
    echo -e "✅ Node.js detectado: \033[1;32m$NODE_VER\033[0m"
    echo -e "✅ NPM detectado: \033[1;32m$NPM_VER\033[0m"
fi
echo ""

# 2. Verificar archivo .env y variables críticas
echo -e "\033[1;34m[2/5] Verificando configuración de credenciales (.env)...\033[0m"

if [ ! -f ".env" ]; then
    echo -e "\033[1;31m❌ Error: No se encontró el archivo .env en esta carpeta.\033[0m"
    echo "Por favor crea el archivo .env con tus credenciales de Firebase."
    read -p "Presiona Enter para salir..."
    exit 1
fi

# Leer variables del .env (ignorar comentarios y líneas vacías)
while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    value="${value%%#*}"   # Quitar comentarios inline
    value="${value%"${value##*[![:space:]]}"}"  # Trim trailing whitespace
    export "$key=$value"
done < .env

# Verificar Firebase API Key
if [ -z "$VITE_FIREBASE_API_KEY" ]; then
    echo -e "\033[1;31m❌ VITE_FIREBASE_API_KEY no está configurada en .env\033[0m"
    echo "La app arrancará en modo LOCAL sin Firebase (sin subida de logos real)."
    read -p "¿Deseas continuar de todas formas? [s/N]: " CONT
    if [[ "$CONT" != "s" && "$CONT" != "S" ]]; then exit 1; fi
else
    echo -e "✅ Firebase API Key detectada"
fi

# Verificar Firebase Storage para logos
if [ -z "$VITE_FIREBASE_STORAGE_BUCKET" ]; then
    echo -e "\033[1;33m⚠️  VITE_FIREBASE_STORAGE_BUCKET no configurado — la subida de logos no funcionará.\033[0m"
else
    echo -e "✅ Firebase Storage detectado: \033[1;32m$VITE_FIREBASE_STORAGE_BUCKET\033[0m"
fi

# Verificar URL de Vercel para el QR
if [ -z "$VITE_PUBLIC_URL" ]; then
    echo ""
    echo -e "\033[1;33m╔══════════════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[1;33m║  ⚠️  ADVERTENCIA: URL de Vercel no configurada               ║\033[0m"
    echo -e "\033[1;33m║     El código QR de la app compilada NO FUNCIONARÁ           ║\033[0m"
    echo -e "\033[1;33m╚══════════════════════════════════════════════════════════════╝\033[0m"
    echo ""
    read -p "   Ingresa tu URL de Vercel (ej: https://mi-app.vercel.app) o Enter para omitir: " MANUAL_URL
    if [ -n "$MANUAL_URL" ]; then
        # Agregar o actualizar VITE_PUBLIC_URL en .env
        if grep -q "VITE_PUBLIC_URL" .env; then
            sed -i '' "s|VITE_PUBLIC_URL=.*|VITE_PUBLIC_URL=$MANUAL_URL|" .env
        else
            echo "VITE_PUBLIC_URL=$MANUAL_URL" >> .env
        fi
        export VITE_PUBLIC_URL="$MANUAL_URL"
        echo -e "   ✅ URL configurada y guardada en .env: \033[1;32m$VITE_PUBLIC_URL\033[0m"
    fi
else
    echo -e "✅ URL de Vercel (QR): \033[1;32m$VITE_PUBLIC_URL\033[0m"
fi

echo ""
echo -e "\033[1;35m╔══════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[1;35m║          RESUMEN DE CONFIGURACIÓN PRE-COMPILACIÓN            ║\033[0m"
echo -e "\033[1;35m╚══════════════════════════════════════════════════════════════╝\033[0m"
echo -e "🔥 Firebase Proyecto : \033[1;36m${VITE_FIREBASE_PROJECT_ID:-⚠️  No configurado}\033[0m"
echo -e "🌐 URL de Vercel (QR): \033[1;36m${VITE_PUBLIC_URL:-⚠️  Sin configurar — el QR no apuntará a tu sitio}\033[0m"
echo -e "💾 Storage Logos     : \033[1;36m${VITE_FIREBASE_STORAGE_BUCKET:-⚠️  No configurado}\033[0m"
echo ""
read -p "¿Todo se ve correcto? Presiona Enter para compilar o Ctrl+C para cancelar..."
echo ""

# 3. Instalar dependencias del proyecto
echo -e "\033[1;34m[3/5] Instalando módulos y dependencias de escritorio...\033[0m"
npm install
if [ $? -ne 0 ]; then
    echo -e "\033[1;31m❌ Error al instalar dependencias. Revisa tu conexión a internet.\033[0m"
    read -p "Presiona Enter para salir..."
    exit 1
fi
echo -e "✅ Dependencias instaladas con éxito."
echo ""

# 4. Compilar el frontend web (Vite inyecta las variables VITE_ del .env)
echo -e "\033[1;34m[4/5] Compilando frontend web (inyectando credenciales y URL de Vercel)...\033[0m"
npm run build
if [ $? -ne 0 ]; then
    echo -e "\033[1;31m❌ Error durante la compilación de Vite.\033[0m"
    read -p "Presiona [Enter] para salir..."
    exit 1
fi
echo -e "✅ Frontend compilado con URL: \033[1;32m${VITE_PUBLIC_URL:-no configurada}\033[0m"
echo ""

# 5. Empaquetar con Electron Builder
echo -e "\033[1;34m[5/5] Empaquetando aplicación nativa de macOS (.dmg)...\033[0m"
npx electron-builder --mac
if [ $? -ne 0 ]; then
    echo -e "\033[1;31m❌ Error durante el proceso de empaquetado de Electron.\033[0m"
    read -p "Presiona [Enter] para salir..."
    exit 1
fi
echo ""

# 6. Mostrar éxito y abrir la carpeta contenedora
echo -e "\033[1;35m==================================================================\033[0m"
echo -e "\033[1;32m       🎉 ¡COMPILACIÓN EXITOSA! EL INSTALADOR ESTÁ LISTO 🎉       \033[0m"
echo -e "\033[1;35m==================================================================\033[0m"
echo -e "Tu instalador de macOS (.dmg) se encuentra en:"
echo -e "\033[1;36m📁 dist-desktop/DJ Control Panel-1.0.0.dmg\033[0m"
echo ""
echo -e "URL de Vercel embebida en el QR: \033[1;32m${VITE_PUBLIC_URL:-⚠️ No configurada}\033[0m"
echo ""
echo "Instrucciones de instalación:"
echo "1. Haz doble clic sobre 'DJ Control Panel-1.0.0.dmg'."
echo "2. Arrastra el ícono de 'DJ Control Panel' a tu carpeta de Aplicaciones."
echo "3. Abre la aplicación desde Launchpad o tu carpeta de Aplicaciones."
echo ""
echo -e "\033[1;33m📌 Tip: Si cambias la URL de Vercel en el futuro, vuelve a compilar.\033[0m"
echo -e "\033[1;33m   También puedes actualizar la URL desde el panel: Personalizar Marca → Guardar.\033[0m"
echo ""

# Intentar abrir la carpeta en Finder automáticamente
if command -v open &> /dev/null; then
    open dist-desktop
fi

read -p "Presiona [Enter] para finalizar..."
exit 0
