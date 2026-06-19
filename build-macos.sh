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
echo -e "\033[1;34m[1/4] Verificando entorno de software...\033[0m"
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

# 2. Instalar dependencias del proyecto
echo -e "\033[1;34m[2/4] Instalando módulos y dependencias de escritorio (esto tomará unos minutos)...\033[0m"
npm install
if [ $? -ne 0 ]; then
    echo -e "\033[1;31m❌ Error al instalar dependencias. Revisa tu conexión a internet.\033[0m"
    read -p "Presiona Enter para salir..."
    exit 1
fi
echo -e "✅ Dependencias instaladas con éxito."
echo ""

# 3. Compilar aplicación y generar instalador DMG
echo -e "\033[1;34m[3/4] Empaquetando aplicación nativa de macOS (.dmg)...\033[0m"
npm run electron:build
if [ $? -ne 0 ]; then
    echo -e "\033[1;31m❌ Error durante el proceso de empaquetado de Electron.\033[0m"
    read -p "Presiona [Enter] para salir..."
    exit 1
fi
echo ""

# 4. Mostrar éxito y abrir la carpeta contenedora
echo -e "\033[1;35m==================================================================\033[0m"
echo -e "\033[1;32m       🎉 ¡COMPILACIÓN EXITOSA! EL INSTALADOR ESTÁ LISTO 🎉       \033[0m"
echo -e "\033[1;35m==================================================================\033[0m"
echo -e "Tu instalador clásico de macOS (.dmg) se encuentra en:"
echo -e "\033[1;36m📁 dist-desktop/DJ Control Panel-1.0.0.dmg\033[0m"
echo ""
echo "Instrucciones de instalación:"
echo "1. Haz doble clic sobre 'DJ Control Panel-1.0.0.dmg'."
echo "2. Arrastra el ícono de 'DJ Control Panel' a tu carpeta de Aplicaciones."
echo "3. Abre la aplicación desde Launchpad o tu carpeta de Aplicaciones."
echo ""

# Intentar abrir la carpeta en Finder automáticamente
if command -v open &> /dev/null; then
    open dist-desktop
fi

read -p "Presiona [Enter] para finalizar..."
exit 0
