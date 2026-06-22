# Manual de Instalación de DJ Panel para macOS (Universal)

Este manual contiene los pasos detallados para instalar y ejecutar **DJ Panel** en cualquier ordenador Mac, ya sea con procesador **Intel** o con chips de **Apple Silicon (M1, M2, M3, M4, etc.)**.

---

## 📋 Información del Archivo
* **Nombre:** `DJ Panel (MacOs Universal).dmg`
* **Arquitectura:** Universal (Intel x64 + Apple Silicon arm64)
* **Ubicación en tu equipo:** `/Users/dorian/.gemini/antigravity/scratch/DJ_a la Carta2.0/DJ Panel (MacOs Universal).dmg`

---

## 🚀 Pasos para la Instalación

### Paso 1: Montar el archivo DMG
1. Localiza el archivo `DJ Panel (MacOs Universal).dmg` en tu Finder.
2. Haz **doble clic** sobre él para abrir el instalador y montar la imagen de disco virtual.

### Paso 2: Copiar la aplicación a tu Mac
1. Verás una ventana con el icono de la aplicación **DJ Panel** a la izquierda y un acceso directo a la carpeta **Applications (Aplicaciones)** a la derecha.
2. **Arrastra y suelta** el icono de **DJ Panel** dentro de la carpeta **Applications**.
3. Espera a que termine de copiarse (toma solo unos segundos).

---

## 🔐 Omisión de Seguridad de macOS (Gatekeeper)

Dado que la aplicación ha sido compilada con una firma ad-hoc local (sin un certificado de desarrollador de Apple de pago), el sistema de seguridad macOS Gatekeeper podría mostrar una advertencia la primera vez que intentes abrirla.

Sigue estos métodos sencillos para abrir la app sin problemas:

### Método A: El truco del clic derecho (Recomendado)
1. Abre tu carpeta **Aplicaciones** en el Finder.
2. Localiza **DJ Panel**.
3. Haz **clic derecho** (o presiona `Control + Clic`) sobre el icono de la app y selecciona **Abrir**.
4. Aparecerá un cuadro de diálogo advirtiendo que el desarrollador no está identificado. Haz clic en el botón **Abrir** que ahora sí aparece disponible.
5. *Nota: Este paso solo es necesario la primera vez. En los arranques futuros podrás abrirla con un doble clic normal.*

### Método B: Comando en Terminal (Si macOS indica que la app está "dañada")
En versiones recientes de macOS (como Sonoma o Sequoia), Gatekeeper a veces puede bloquear por completo las firmas locales mostrando un mensaje de error que dice que el archivo está dañado. Para solucionarlo:
1. Abre la aplicación **Terminal** en tu Mac (puedes buscarla en Spotlight con `Cmd + Espacio`).
2. Escribe o copia el siguiente comando y presiona `Enter`:
   ```bash
   xattr -cr "/Applications/DJ Panel.app"
   ```
3. Este comando quita los atributos de cuarentena que macOS asigna a las apps de terceros no firmadas comercialmente.
4. ¡Listo! Abre la aplicación normalmente desde tu carpeta de Aplicaciones o Launchpad.

---

## 🛠️ Notas Adicionales
* **Compatibilidad de Pantalla:** La aplicación está optimizada para todas las pantallas Retina de MacBook, iMac y Mac mini.
* **Sincronización:** Asegúrate de estar conectado a Internet para la sincronización en tiempo real de peticiones con la base de datos de Firebase si está configurada.
