# Guía de Despliegue en Producción: Firebase y Servidor Web

Esta guía paso a paso te enseñará cómo configurar una infraestructura real en internet (producción) utilizando **Firebase** y cómo desplegar la aplicación web para que el público pueda ingresar escaneando el código QR, dejando atrás el modo local/simulado.

---

## 📅 Resumen del Proceso
1. Crear el proyecto en **Firebase Console**.
2. Habilitar **Authentication**, **Realtime Database** y **Cloud Storage**.
3. Configurar las **Reglas de Base de Datos** de producción.
4. Crear el archivo de configuración **`.env`** en tu proyecto local.
5. Desplegar el frontend del público en un servidor web gratuito (**Firebase Hosting** o **Vercel**).
6. Volver a compilar la app de macOS enlazada a internet.

---

## 🛠️ Paso 1: Crear el Proyecto en Firebase Console

1. Entra a [Firebase Console](https://console.firebase.google.com/) e inicia sesión con una cuenta de Google.
2. Haz clic en **Agregar proyecto** (o *Create a project*).
3. Introduce el nombre de tu proyecto (ej. `dj-request-platform`).
4. Habilita o deshabilita Google Analytics (opcional, no es obligatorio para esta app) y haz clic en **Crear proyecto**.
5. Espera unos segundos a que se aprovisione y presiona **Continuar**.

---

## 🔐 Paso 2: Habilitar y Configurar los Servicios de Firebase

Dentro del panel lateral de Firebase de tu proyecto, activa los siguientes tres servicios:

### A. Autenticación (Authentication)
El panel de DJ requiere usuario y contraseña reales para ingresar.
1. En el menú lateral, ve a **Build** (Construir) > **Authentication**.
2. Haz clic en **Comenzar** (Get Started).
3. En la pestaña de *Método de inicio de sesión*, selecciona **Correo electrónico/Contraseña** (Email/Password) y actívalo. Guarda los cambios.
4. Ve a la pestaña **Users** (Usuarios) y haz clic en **Agregar usuario**.
5. Registra las credenciales del DJ:
   * **Correo electrónico**: Introduce el correo del DJ (ej: `dj@admin.com` o el tuyo).
   * **Contraseña**: Define una contraseña segura.
   * Haz clic en **Agregar usuario**. *Apunta estas credenciales, ya que serán tus accesos definitivos al panel de administración*.

### B. Realtime Database (Base de Datos en Tiempo Real)
Es el motor WebSockets que comunica instantáneamente a la audiencia con el DJ.
1. Ve a **Build** > **Realtime Database**.
2. Haz clic en **Crear base de datos**.
3. Selecciona una ubicación cercana (ej. `us-central1` si estás en México) y presiona Siguiente.
4. Inicia en **Modo bloqueado** y presiona Habilitar.
5. Una vez creada, ve a la pestaña **Reglas** (Rules).
6. Copia y pega el contenido completo de tu archivo [database.rules.json](file:///Users/dorian/.gemini/antigravity/scratch/dj-interactive-platform/database.rules.json):
   ```json
   {
     "rules": {
       "events_index": {
         ".read": "auth != null",
         ".write": "auth != null"
       },
       "events": {
         "$eventId": {
           ".write": "auth != null",
           "settings": {
             ".read": "true",
             ".write": "auth != null"
           },
           "requests": {
             ".read": "true",
             "$requestId": {
               ".write": "true",
               ".validate": "newData.hasChildren(['title', 'artist', 'timestamp', 'status'])"
             }
           }
         }
       },
       "autocomplete_songs": {
         ".read": "true",
         ".write": "true",
         "$songId": {
           ".validate": "newData.hasChildren(['title', 'artist'])"
         }
       }
     }
   }
   ```
7. Haz clic en **Publicar** (Publish). Esto asegura que tu base de datos sea veloz pero segura contra hackeos.

### C. Cloud Storage (Almacenamiento de Logotipos)
Permite que el DJ suba su logo a la nube de Google.
1. Ve a **Build** > **Storage**.
2. Haz clic en **Comenzar** (Get Started).
3. Selecciona iniciar en **Modo de prueba** (o modo producción) y presiona Siguiente.
4. Selecciona la región geográfica por defecto y presiona **Listo**.
5. Ve a la pestaña **Rules** (Reglas) de Storage y asegúrate de permitir lectura pública para que el celular del público pueda ver el logo del DJ:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
6. Haz clic en **Publicar**.

---

## 📋 Paso 3: Obtener las Credenciales de tu Aplicación

1. Ve a la **Configuración del proyecto** (el ícono del engranaje al lado de "Descripción general del proyecto" en la esquina superior izquierda).
2. Abajo, en la sección *Tus apps*, haz clic en el ícono de **Web** (`</>`).
3. Registra la app escribiendo un sobrenombre (ej: `dj-web-app`).
4. Haz clic en **Registrar app**.
5. Te mostrará un fragmento de código con un objeto llamado `firebaseConfig`. Copia solo los valores correspondientes. Ejemplo:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyA1...",
     authDomain: "dj-request-platform.firebaseapp.com",
     databaseURL: "https://dj-request-platform-default-rtdb.firebaseio.com",
     projectId: "dj-request-platform",
     storageBucket: "dj-request-platform.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:123456:web:abcd1234"
   };
   ```

---

## 🔑 Paso 4: Crear el Archivo de Variables de Entorno `.env`

Para que el compilador inyecte tus credenciales reales y apague el "Modo Demo", debes crear un archivo de configuración en tu carpeta local.

1. En la raíz de tu proyecto local `/Users/dorian/.gemini/antigravity/scratch/dj-interactive-platform/`, crea un nuevo archivo de texto con el nombre exacto de **`.env`**.
2. Abre el archivo `.env` y pega tus credenciales de Firebase en el siguiente formato (importante respetar los prefijos `VITE_`):

```env
VITE_FIREBASE_API_KEY=TU_API_KEY_AQUI
VITE_FIREBASE_AUTH_DOMAIN=TU_AUTH_DOMAIN_AQUI
VITE_FIREBASE_DATABASE_URL=TU_DATABASE_URL_AQUI
VITE_FIREBASE_PROJECT_ID=TU_PROJECT_ID_AQUI
VITE_FIREBASE_STORAGE_BUCKET=TU_STORAGE_BUCKET_AQUI
VITE_FIREBASE_MESSAGING_SENDER_ID=TU_MESSAGING_SENDER_ID_AQUI
VITE_FIREBASE_APP_ID=TU_APP_ID_AQUI
```

3. Guarda y cierra el archivo `.env`.

> [!TIP]
> Si el archivo `.env` está configurado correctamente con credenciales válidas en la raíz del proyecto, el software desactivará automáticamente el mensaje naranja de "Modo Demostración" y empezará a sincronizarse con tu base de datos de Google en caliente.

---

## 🚀 Paso 5: Desplegar el Frontend en Internet (Hosting)

Para que el público acceda al escaneo del código QR, la app web debe estar visible públicamente en internet. Tienes dos opciones populares y gratuitas:

### Opción A: Desplegar con Firebase Hosting (Recomendado)
Es la opción nativa más estable.
1. Abre tu terminal y sitúate en la raíz del proyecto.
2. Instala la herramienta de Firebase de forma global si no la tienes:
   ```bash
   npm install -g firebase-tools
   ```
3. Inicia sesión en Firebase con tu cuenta de Google:
   ```bash
   firebase login
   ```
4. Inicializa el Hosting en el proyecto:
   ```bash
   firebase init hosting
   ```
   * Responde a las preguntas de la terminal:
     * *Please select an option:* Elige **Use an existing project** y selecciona el proyecto que creaste en el Paso 1.
     * *What do you want to use as your public directory?* Escribe **`dist`** (Vite compila ahí).
     * *Configure as a single-page app (rewrite all urls to /index.html)?* Presiona **y** (Sí).
     * *Set up automatic builds and deploys with GitHub?* Presiona **n** (No, a menos que lo desees).
5. Compila y sube la aplicación:
   ```bash
   npm run build
   firebase deploy
   ```
6. Al finalizar, la terminal te dará una **Hosting URL** pública (ej. `https://dj-request-platform.web.app`). **¡Esta es la URL que tu público usará y que se imprimirá en el QR!**

---

### Opción B: Desplegar en Vercel (Muy Sencillo)
Si prefieres no usar la terminal de Firebase, Vercel es automático e instantáneo.
1. Sube el código de tu carpeta a un repositorio de **GitHub** (privado o público).
2. Entra a [Vercel](https://vercel.com/) e inicia sesión con GitHub.
3. Haz clic en **Add New** > **Project** e importa tu repositorio.
4. En **Environment Variables** (Variables de entorno), agrega las variables una a una (las mismas 7 que pusiste en tu archivo `.env`).
5. Haz clic en **Deploy**.
6. Vercel te dará una URL pública autogenerada (ej. `https://dj-interactive.vercel.app`).

---

## 💻 Paso 6: Compilar tu aplicación de macOS para MacBook

Ahora que las credenciales de internet están configuradas y el frontend está en línea:

1. Ve a la carpeta de tu proyecto.
2. Haz doble clic en el archivo **`build-macos.sh`**.
3. El script compilará de nuevo el proyecto, pero esta vez **detectará el archivo `.env`**.
4. Creará el nuevo instalador en `dist-desktop/DJ Control Panel-1.0.0.dmg` enlazado permanentemente a tu base de datos de Firebase.
5. Ábrelo, arrástralo a Aplicaciones, ¡y tu cabina estará totalmente sincronizada por internet!
