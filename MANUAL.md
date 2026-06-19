# Manual de Usuario: Plataforma Interactiva de Peticiones Musicales (DJ-Público)

Esta guía te guiará paso a paso para configurar, compilar e instalar la plataforma de peticiones en tiempo real en tu MacBook y conectar a tu audiencia sin complicaciones.

---

## 1. Requisitos Previos

Para ejecutar la aplicación localmente o compilar el instalador clásico en tu Mac, necesitas tener instalado **Node.js**:
1. Entra al sitio oficial de descargas: [https://nodejs.org/](https://nodejs.org/)
2. Descarga la versión marcada como **LTS** (Recomendada para la mayoría de usuarios).
3. Abre el archivo descargado y sigue los pasos del instalador de macOS (haz clic en "Siguiente" hasta finalizar).

---

## 2. Compilación e Instalación en MacBook (Instalador .dmg clásico)

Hemos creado un script automatizado para que no tengas que escribir comandos complejos en la terminal. Sigue estos sencillos pasos:

1. Abre la carpeta del proyecto en tu Mac.
2. Busca el archivo llamado `build-macos.sh`.
3. Haz doble clic sobre `build-macos.sh` para iniciarlo. Se abrirá una pantalla de terminal que:
   * Verificará que tengas Node.js instalado.
   * Descargará automáticamente todas las herramientas necesarias de internet.
   * Compilará el código y creará el instalador nativo.
4. Cuando el script finalice, se abrirá una ventana de Finder mostrando la carpeta `dist-desktop` con el archivo **`DJ Control Panel-1.0.0.dmg`**.
5. Haz doble clic sobre `DJ Control Panel-1.0.0.dmg` y arrastra la aplicación **DJ Control Panel** a tu carpeta de **Aplicaciones**.

¡Listo! Ya tienes la aplicación de control del DJ instalada de forma nativa en tu MacBook como cualquier otro programa.

---

## 3. Guía de Uso del Panel del DJ (Dashboard)

Al abrir la aplicación (o ingresar a la URL del panel), verás una interfaz optimizada para macOS:

### 3.1. Inicio de Sesión
* **Modo Demostración (Local)**: Si la aplicación no tiene configuradas credenciales de Firebase de producción, operará de forma 100% local. Puedes iniciar sesión usando:
  * **Usuario**: `dj@admin.com`
  * **Contraseña**: `admin123`
* **Sincronización en vivo**: Permite el uso simultáneo en hasta 3 MacBooks sincronizadas en tiempo real en la misma cabina, y también en un móvil Android que acceda a la URL del DJ.

### 3.2. Gestión de Eventos y Calendario (Pestaña "Gestión de Eventos")
* **Crear Eventos**: Introduce un ID único (ej: `boda-sofia-carlos`), un título descriptivo (ej: `Boda de Sofía y Carlos`), el nombre del DJ y selecciona la fecha en el calendario. Haz clic en **Crear e Iniciar**.
* **Archivar Eventos**: Si un evento musical finaliza, haz clic en **Archivar**. Esto bloqueará automáticamente la pantalla de peticiones del público con un mensaje elegante informando que el evento concluyó.
* **Eliminar Eventos**: Si necesitas borrar un evento de forma definitiva, haz clic en el ícono de la papelera (se solicitará confirmación).

### 3.3. Personalización de Marca Blanca (Pestaña "Personalizar Marca")
* **Logotipo**: Haz clic en **Subir Imagen** para subir el logo personalizado del evento (PNG transparente recomendado). El logo se reflejará instantáneamente en la pantalla del público.
* **Colores**: Modifica el color primario (botones y títulos) y secundario usando los selectores visuales de color. La interfaz del público se adaptará en tiempo real con transiciones animadas.
* **Título y DJ**: Puedes cambiar el nombre del DJ y el título visual en cualquier momento.

### 3.4. Notificaciones Audibles y Visuales
* **Sonido Personalizado**: Al lado del botón de silencio, encontrarás un menú desplegable con 4 tonos de alerta sintetizados (Campana, Bip Suave, Alarma Retro, Pulsos Synth).
* **Probar Sonido**: El botón de volumen te permite escuchar el tono seleccionado para calibrar tus monitores o auriculares de cabina.
* **Alertas Push**: Haz clic en el ícono de campana para activar las notificaciones nativas del navegador o del sistema macOS cuando entren nuevas canciones a la cola.

### 3.5. Descarga de Código QR
* En la barra lateral izquierda verás el código QR generado para el evento seleccionado.
* Haz clic en **Descargar QR (SVG)** para obtener el código en alta calidad, listo para imprimir en carteles, pantallas o proyectar en el evento.
* El código QR conecta al público de forma única al evento activo sin importar la IP del servidor.

---

## 4. Guía de Uso del Público (Mobile Web App)

El público accede simplemente escaneando el código QR impreso o proyectado. Se abrirá la web app móvil en español con instrucciones extremadamente simples:

1. **Buscar y Autocompletar**: Al comenzar a escribir en el buscador, un sistema inteligente autocompletará canciones exitosas y populares en México (como Regional Mexicano, Reggaetón/Urbano, Cumbia, etc.).
2. **Campos Opcionales**: Los campos "Nombre de la Canción", "Artista" y "Género" son opcionales para evitar fricciones. El usuario puede rellenar solo lo que recuerde (ej. solo el nombre de la canción o solo el artista).
3. **Género Personalizado**: Si el género deseado no está en los preestablecidos, se puede seleccionar "Género: Personalizado" para escribir uno propio (como Techno, Metal, Bachata, etc.).
4. **Enviar Petición**: Al hacer clic en **Enviar Petición**, el tema aparecerá instantáneamente en la pantalla del DJ sin que nadie tenga que recargar.
5. **Anti-Spam**: Un temporizador inteligente impide que un mismo usuario envíe peticiones masivas consecutivas en menos de 2 minutos.
6. **Votar en vivo**: Los usuarios pueden ver la lista de canciones pedidas y hacer clic en el botón de **Corazón** para votar por sus canciones favoritas. Las canciones con más votos subirán al tope de la cola en la pantalla del DJ.
