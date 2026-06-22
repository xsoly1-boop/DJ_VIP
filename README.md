# Plataforma Interactiva en Tiempo Real para DJ y Eventos 🎵

Esta plataforma conecta al público de un evento musical con el DJ en tiempo real, permitiendo enviar peticiones de canciones, votar por temas populares de la audiencia, aprender de forma dinámica de los gustos musicales (autocompletado evolutivo) y personalizar visualmente la cabina con marca blanca.

---

## 1. ARCHITECTURAL BLUEPRINT (Plano de Arquitectura)

### Stack Tecnológico
La plataforma está diseñada con una arquitectura moderna de alto rendimiento, serverless y basada en eventos:

```mermaid
graph TD
    subgraph Cliente_Audiencia [Público (Móvil PWA)]
        A1[Formulario de Peticiones] -->|Escaneo QR| A2[Pestaña del Evento]
        A2 -->|Añadir Petición / Votar| A3[Anti-Spam Cooldown & Local Session]
    end

    subgraph Cabina_DJ [DJ Control Panel (Multi-Dispositivo)]
        D1[Dashboard Web] -->|Visualización en Tiempo Real| D2[MacBook 1]
        D1 -->|Aceptar/Reproducir/Rechazar| D3[MacBook 2]
        D1 -->|Notificaciones Audibles/Visuales| D4[MacBook 3 / Android]
    end

    subgraph Backend_Cloud_Serverless [Firebase Ecosystem]
        F1[Firebase Auth] -->|Autenticación DJ| D1
        F2[Firebase Realtime Database] -->|Sincronización WebSockets <100ms| A2
        F2 -->|Sincronización WebSockets <100ms| D1
        F3[Firebase Cloud Storage] -->|Carga de Logos en Caliente| D1
    end

    subgraph Fallback_Local_Sync [Modo Offline / Test Local]
        M1[LocalStorage] <--->|Simulación Base de Datos| M2[BroadcastChannel API]
        M2 <--->|Sincronización Inter-pestañas| A2
        M2 <--->|Sincronización Inter-pestañas| D1
    end
```

### Componentes Clave:
1. **Frontend (PWA React 19 + Vite + Vanilla CSS):**
   - **Diseño Responsivo de Alta Gama:** Implementa glassmorphism, degradados vibrantes y micro-animaciones fluidas.
   - **Personalización Dinámica (White-Label):** Los colores y logotipo del evento se inyectan en caliente modificando variables CSS en el elemento `:root` del DOM.
   
2. **Backend Serverless (Firebase Realtime Database):**
   - **Conectividad por WebSockets:** El SDK de Firebase mantiene una conexión TCP persistente y bidireccional usando WebSockets nativos de la plataforma, garantizando una latencia de sincronización de datos inferior a **100ms** a través de Internet.
   - **Base de Datos NoSQL Jerárquica:** El esquema de datos almacena peticiones asociadas a un ID de evento único (`events/$eventId/requests`) y configuraciones de marca (`events/$eventId/settings`).

3. **Arquitectura Multi-Dispositivo & Sincronización:**
   - La sincronización multi-pantalla se consigue a través del patrón **Observer** (`onValue` en el SDK de Firebase). Cuando el DJ en una MacBook acepta una canción, el estado se actualiza en la nube y se transmite instantáneamente al público y a los otros dispositivos de cabina.
   - **Modo Dual (Real / Local Mock):** Si no hay credenciales de Firebase configuradas en el entorno, el archivo `firebase.js` activa de forma transparente una simulación completa utilizando la **BroadcastChannel API** del navegador y **LocalStorage**. Esto permite realizar pruebas multi-dispositivo y multi-pestaña localmente con latencia cero sin instalar base de datos externa.

4. **Motor de Autocompletado Evolutivo:**
   - Cuando el público introduce texto libre en los campos opcionales y el DJ marca la petición como **"Aceptada"**, el backend analiza el registro y, si el tema no existe previamente, lo inserta en el nodo `autocomplete_songs`.
   - La caja de búsqueda del público consume este catálogo de forma reactiva y filtra las sugerencias conforme el usuario escribe.

---

## 2. ESTRUCTURA DE ARCHIVOS Y CÓDIGO FUENTE ESENCIAL

### Estructura del Proyecto
```text
DJ_a la Carta2.0/
├── database.rules.json       # Reglas de seguridad de Firebase RTDB
├── package.json              # Configuración y dependencias
├── vite.config.js            # Configuración de Vite
├── index.html                # Punto de entrada HTML5
└── src/
    ├── main.jsx              # Renderizado principal
    ├── index.css             # Sistema de diseño de cabina, variables HSL y animaciones
    ├── firebase.js           # Inicialización y capa de simulación (Mock/Real)
    ├── context/
    │   └── FirebaseContext.jsx # Proveedor de estado global en tiempo real
    └── views/
        ├── LoginView.jsx     # Acceso seguro del DJ
        ├── PublicView.jsx    # Interfaz del público (Anti-Spam, Búsqueda, Votos)
        └── DjDashboard.jsx   # Dashboard del DJ (Gestión de Eventos, Branding, QR, Audio)
```

---

### Scripts Esenciales de Producción

Los archivos de código fuente ya están creados y optimizados para producción en tu directorio de trabajo. Puedes abrirlos y revisarlos haciendo clic en los siguientes enlaces:

1. **Configuración e Inicialización de Firebase (con simulación local integrada):**
   - Ubicación: [src/firebase.js](file:///Users/dorian/.gemini/antigravity/scratch/DJ_a%20la%20Carta2.0/src/firebase.js)
   - *Este script decide automáticamente si conectarse a Firebase o activar el motor local BroadcastChannel basándose en la presencia de variables de entorno.*

2. **Capa de Negocio y Estado en Tiempo Real (React Context):**
   - Ubicación: [src/context/FirebaseContext.jsx](file:///Users/dorian/.gemini/antigravity/scratch/DJ_a%20la%20Carta2.0/src/context/FirebaseContext.jsx)
   - *Gestiona el ciclo de vida de los eventos, peticiones de canciones, lógica de votos, carga del logotipo y la inyección en caliente de la paleta de colores del DJ.*

3. **Panel de Control del DJ (Dashboard Multi-dispositivo):**
   - Ubicación: [src/views/DjDashboard.jsx](file:///Users/dorian/.gemini/antigravity/scratch/DJ_a%20la%20Carta2.0/src/views/DjDashboard.jsx)
   - *Módulo administrativo con soporte para notificaciones del sistema (Push API), sintetizador de sonido premium (Web Audio API) y gestor de marca blanca.*

4. **Formulario del Público (Web App Móvil):**
   - Ubicación: [src/views/PublicView.jsx](file:///Users/dorian/.gemini/antigravity/scratch/DJ_a%20la%20Carta2.0/src/views/PublicView.jsx)
   - *Interfaz móvil optimizada para escaneo QR, con sistema de cooldown anti-spam de 2 minutos basado en almacenamiento local y autocompletado inteligente.*

---

## 3. GUÍA DE INSTALACIÓN PASO A PASO PARA USUARIO BÁSICO

### Opción A: Prueba Rápida Local (Sin Servidores ni Nube)
Si no deseas crear cuentas en la nube aún, puedes ejecutar la plataforma en modo simulación:

1. **Abrir la terminal e ir al directorio del proyecto:**
   ```bash
    cd "/Users/dorian/.gemini/antigravity/scratch/DJ_a la Carta2.0"
   ```
2. **Instalar dependencias necesarias:**
   ```bash
   npm install
   ```
3. **Iniciar el servidor local de desarrollo:**
   ```bash
   npm run dev
   ```
4. **Acceder a las interfaces:**
   - La terminal te dará una URL local (Ej. `http://localhost:5173`). Abre esa URL.
   - **DJ Panel:** Te pedirá login. Usa el correo `dj@admin.com` y la contraseña `admin123`.
   - **Vista Público:** Abre otra ventana o pestaña con la URL `http://localhost:5173/?event=default-event`.
   - *Prueba enviando una canción desde la vista público. Verás cómo aparece de forma instantánea en el panel del DJ gracias a la sincronización local integrada.*

---

### Opción B: Despliegue en la Nube (Producción Completa)
Para que los teléfonos móviles lean el código QR a través de internet real, debes desplegar el proyecto en Firebase (100% gratuito):

#### Paso 1: Crear el proyecto en la Consola de Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/) e inicia sesión con tu cuenta de Google.
2. Haz clic en **"Crear un proyecto"** (nómbralo `dj-interactive-event`).
3. Desactiva Google Analytics (opcional) y haz clic en **"Crear proyecto"**.

#### Paso 2: Configurar la Base de Datos Realtime
1. En el menú izquierdo de Firebase, ve a **Compilación -> Realtime Database**.
2. Haz clic en **"Crear base de datos"**, selecciona la ubicación de tu preferencia (EE.UU. recomendado) y presiona Siguiente.
3. Elige **"Comenzar en modo de prueba"** (para desarrollo rápido) y haz clic en **"Habilitar"**.

#### Paso 3: Configurar el Almacenamiento (Storage) para Logotipos
1. En el menú izquierdo, ve a **Compilación -> Storage**.
2. Haz clic en **"Comenzar"**, deja las reglas de seguridad por defecto y haz clic en **"Listo"**.

#### Paso 4: Obtener las Credenciales del Proyecto
1. Haz clic en el engrane de configuración junto a "Descripción general del proyecto" (arriba a la izquierda) -> **Configuración del proyecto**.
2. En la sección "Tus apps", haz clic en el icono web `</>` para registrar una aplicación. Nómbrala `dj-app`.
3. Firebase te mostrará un bloque de código que contiene tu `firebaseConfig`. Copia esos valores:
   - `apiKey`
   - `authDomain`
   - `databaseURL`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

#### Paso 5: Configurar Variables en el Proyecto Local
1. En la carpeta `/Users/dorian/.gemini/antigravity/scratch/DJ_a la Carta2.0/`, crea un archivo llamado `.env` y pega tus credenciales con el siguiente formato exacto:
   ```env
   VITE_FIREBASE_API_KEY=Tu_ApiKey_Aqui
   VITE_FIREBASE_AUTH_DOMAIN=Tu_AuthDomain_Aqui
   VITE_FIREBASE_DATABASE_URL=Tu_DatabaseUrl_Aqui
   VITE_FIREBASE_PROJECT_ID=Tu_ProjectId_Aqui
   VITE_FIREBASE_STORAGE_BUCKET=Tu_StorageBucket_Aqui
   VITE_FIREBASE_MESSAGING_SENDER_ID=Tu_MessagingSenderId_Aqui
   VITE_FIREBASE_APP_ID=Tu_AppId_Aqui
   ```

#### Paso 6: Desplegar a Firebase Hosting
1. En tu terminal (dentro de la carpeta del proyecto), instala las herramientas CLI de Firebase si no las tienes:
   ```bash
   npm install -g firebase-tools
   ```
2. Inicia sesión en Firebase desde la terminal:
   ```bash
   firebase login
   ```
3. Inicializa el proyecto para enlazarlo con tu consola:
   ```bash
   firebase init
   ```
   *Durante las preguntas selecciona:*
   - **Hosting** y **Database** (con barra espaciadora para seleccionar, luego Enter).
   - Selecciona **Use an existing project** y elige tu proyecto `dj-interactive-event`.
   - Para Database, deja el archivo por defecto (`database.rules.json`).
   - Para Hosting: ¿Qué carpeta usar para producción? Escribe `dist` (muy importante).
   - ¿Configurar como Single Page App? Escribe `y` (Sí).
   - ¿Sobrescribir `index.html`? Escribe `N` (No).
4. Compila el frontend del proyecto:
   ```bash
   npm run build
   ```
5. Publica el proyecto en internet:
   ```bash
   firebase deploy
   ```
6. **¡Listo!** Firebase te entregará una URL pública tipo `https://dj-interactive-event.web.app`. Esa será tu URL de cabina. La URL del público será `https://dj-interactive-event.web.app/?event=nombre-de-tu-evento`.

---

## 4. MANUAL DE CONFIGURACIÓN PARA CABINA DEL DJ (MACBOOKS / MÓVIL)

Para garantizar un rendimiento del 100% durante el evento en tiempo real, el DJ debe seguir estas instrucciones específicas en su hardware de cabina:

### Sincronización Multi-Dispositivo (Ej. 3 MacBooks + 1 Android)
El sistema soporta que abras el panel de control simultáneamente en varios dispositivos. Todas las acciones se reflejan en menos de 100ms.
- **MacBook 1 (Principal):** Úsala para monitorizar el listado en tiempo real de peticiones, ordenando la vista por **"Más Votadas 🔥"** para ver qué canciones aclama la pista.
- **MacBook 2 (Segunda cabina):** Úsala para interactuar, cambiando el estado de las canciones conforme las vas tocando (haz clic en **"Sonar Play"** para moverlas al estado "Sonando ahora 🎵" o **"Rechazar X"** para descartar temas inapropiados).
- **MacBook 3 (Pantalla al público):** Puedes conectar esta MacBook a una pantalla o proyector externo. Abre la página y visualiza el código QR en grande para que la gente en la pista lo escanee sin interrumpirte.
- **Móvil Android:** Mantén el panel abierto en tu teléfono en la mano o soporte de cabina. Te permite moverte por el escenario y aceptar peticiones de forma inalámbrica.

---

### Permisos de Notificaciones en macOS (Chrome y Safari)

El dashboard cuenta con Web Push Notifications para que no te pierdas de nada aunque estés mezclando en VirtualDJ / Serato en pantalla completa.

#### En Google Chrome (Mac):
1. Al entrar al panel por primera vez, haz clic en el botón de **Campana (Notificaciones)** en la barra de herramientas del panel.
2. Aparecerá un cuadro emergente de Chrome preguntando *"¿Quieres permitir notificaciones?"*. Haz clic en **Permitir**.
3. Si lo bloqueaste por error, haz clic en el icono del candado en la barra de direcciones de la URL (a la izquierda de la dirección de la web) y cambia el selector de Notificaciones a **Permitir**.

#### En Apple Safari (Mac):
1. Abre Safari y ve a **Ajustes** (o presiona `Cmd + ,`).
2. Ve a la pestaña **Sitios web** y en la columna de la izquierda selecciona **Notificaciones**.
3. Busca la URL de tu plataforma (Ej. `dj-interactive-event.web.app`) y selecciona **Permitir** en el menú desplegable.

---

### Activación del Audio de Alerta (Evitar el Bloqueo de Autoplay)

Por políticas estrictas de Apple y Google, **los navegadores bloquean por defecto cualquier sonido automático (autoplay)** para evitar publicidad molesta. Esto silenciaría la campana que te avisa de nuevas peticiones de la audiencia.

#### Cómo habilitarlo:
1. **Acción de Usuario Requerida:** Para que el navegador permita el audio, debes realizar al menos una interacción en la pantalla. Haz clic en el botón **Volumen (Altavoz)** en el panel de control de tu cabina para desactivar/activar las alertas visualmente. Esta simple interacción "desbloquea" la Web Audio API del navegador para esa sesión.
2. **Habilitar en Safari Permanentemente:**
   - Abre la plataforma en Safari.
   - Haz clic secundario (click derecho) sobre la barra de direcciones URL.
   - Selecciona **Ajustes para este sitio web**.
   - En la opción **Reproducción automática**, cambia el valor a **Permitir todo**.
3. **Habilitar en Chrome Permanentemente:**
   - Abre la plataforma en Chrome.
   - Haz clic en el candado junto a la URL.
   - Haz clic en **Configuración del sitio**.
   - Busca **Sonido** y cámbialo a **Permitir**.

---

### Cómo Generar y Descargar el Código QR para Proyección/Impresión

El código QR es dinámico y se adapta de forma automática al ID del evento actual que tengas seleccionado.

1. Ve a la sección **Gestión de Eventos** en tu panel y haz clic en "Cargar Evento" sobre el evento que desees iniciar (Ej. `Graduación Tec`).
2. En la barra lateral izquierda del panel, verás el cuadro **"Código QR para el Público"**.
3. Haz clic en el botón **"Descargar QR (SVG)"**.
4. **¿Por qué SVG y no PNG ordinario?**
   - El formato SVG es vectorial. Esto significa que **puedes ampliar la imagen al tamaño de una valla publicitaria sin que se pixele**.
   - **Para impresión:** Envía este archivo SVG al diseñador o imprenta para colocarlo en pancartas de mesa, lonas para la cabina o folletos.
   - **Para proyección:** Inserta el SVG en tu software de proyección (ej. Resolume, OBS, ProPresenter) para mostrar el código QR en las pantallas gigantes de la discoteca o el salón durante los descansos del set.

---

## 5. CARACTERÍSTICAS AVANZADAS DE MARCA BLANCA Y GESTIÓN DE EVENTOS

La plataforma cuenta con capacidades mejoradas de personalización, control del calendario de eventos y políticas de seguridad para el borrado del historial:

### 5.1. Personalización Completa de Marca Blanca (White-Label)
* **Nombre de la Plataforma Personalizado:** En la pestaña "Personalizar Marca" del panel del DJ, ahora es posible establecer un nombre personalizado para la web (ej: *Mis XV Años de Sofía*, *La Boda de Ana y Carlos*).
* **Título del Navegador Dinámico:** El título de la pestaña del navegador (`document.title`) se actualiza reactivamente tanto en la cabina del DJ como en la pantalla del público, combinando el nombre personalizado de la web con el título del evento activo.
* **Pie de Página (Footer) Dinámico:** El pie de página muestra dinámicamente el nombre de la plataforma personalizado en lugar del valor estático por defecto.

### 5.2. Panel de Calendario y Ciclo de Vida de Eventos
* **Creación Intuitiva de Eventos:** El formulario permite definir el Título, Fecha, DJ en Cabina y un **Tipo de Evento** desde un selector con opciones preestablecidas (Mis XV años, Mi Boda, Cumpleaños, Graduación, Fiesta Corporativa, Otro).
* **Activación de Eventos Activos:** Cambia el contexto activo de la plataforma en tiempo real haciendo clic en **Activar** sobre cualquier evento en el listado.
* **Edición en Caliente:** Modifica los metadatos de cualquier evento directamente desde la lista (Título, Tipo de Evento, DJ, Fecha) con persistencia inmediata en la base de datos.
* **Archivado de Seguridad:** Archivar un evento inhabilita temporalmente el envío de peticiones por parte del público, mostrando un mensaje elegante de conclusión de evento sin necesidad de eliminar la información.
* **Eliminación Permanente:** Remueve eventos de la base de datos de manera definitiva a través de una confirmación visual inline (evitando eliminaciones accidentales).

### 5.3. Borrado Opcional y Seguro de Historial
* **Granularidad en la Limpieza:** El DJ puede decidir limpiar de forma selectiva:
  - **Canciones (peticiones):** Cola de canciones del evento actual.
  - **Géneros:** Historial de géneros de música.
  - **Artistas:** Historial de artistas solicitados.
  - **Calendario y Eventos:** Lista de eventos creados históricamente.
  - **Base de Datos de Autocompletado:** El catálogo evolutivo del buscador.
* **Palabra Clave de Seguridad:** Como mecanismo de protección para evitar la pérdida accidental de datos, el botón de confirmación de borrado requiere que el usuario escriba la palabra clave exacta `"clear"` para validar y ejecutar la acción.

# DJ_eventos
# DJ_VIP
