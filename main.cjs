const { app, BrowserWindow, Menu, ipcMain, powerSaveBlocker, Tray, nativeImage, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

// Desactivar política de autoplay para permitir sonido de notificaciones en segundo plano
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Bloqueo de Instancia Única (Single Instance Lock)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

let mainWindow;
let powerSaveBlockerId;
let tray = null;

// Ruta del archivo de configuración local para notificaciones y sesión
const configPath = path.join(app.getPath('userData'), 'djvip_config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error cargando configuración:', e);
  }
  return {
    selected_ringtone_uri: '',
    selected_ringtone_name: 'Predeterminado del sistema',
    user_uid: '',
    user_role: ''
  };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando configuración:', e);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    title: "DJ Panel Pro",
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Determinar si corre en desarrollo o producción
  const isDev = process.env.ELECTRON_DEV === 'true' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // app.getAppPath() resuelve correctamente dentro del .app empaquetado
    // independientemente de la arquitectura (universal, arm64 o x64)
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // Configurar menú básico para macOS
  const template = [
    {
      label: 'DJ Panel Pro',
      submenu: [
        { label: 'Acerca de DJ Panel Pro', role: 'about' },
        { type: 'separator' },
        { label: 'Servicios', role: 'services' },
        { type: 'separator' },
        { label: 'Ocultar DJ Panel Pro', accelerator: 'Command+H', role: 'hide' },
        { label: 'Ocultar Otros', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Mostrar Todo', role: 'unhide' },
        { type: 'separator' },
        { label: 'Salir', accelerator: 'Command+Q', click() { app.quit(); } }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rehacer', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Pegar', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Seleccionar Todo', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forzar Recarga', accelerator: 'CmdOrCtrl+Shift+R', role: 'forcereload' },
        { type: 'separator' },
        { label: 'Pantalla Completa', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { label: 'Minimizar', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Cerrar', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Interceptar el evento de cierre de ventana para ocultarla en segundo plano
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers para Integración con Virtual DJ
ipcMain.handle('detect-virtualdj-path', async () => {
  const home = os.homedir();
  const pathsToCheck = [];
  
  if (process.platform === 'darwin') {
    // 1. Ruta moderna (VirtualDJ 2024/2026+) en Library/Application Support
    pathsToCheck.push(path.join(home, 'Library', 'Application Support', 'VirtualDJ'));
    // 2. Ruta clásica en Documentos
    pathsToCheck.push(path.join(home, 'Documents', 'VirtualDJ'));
  } else if (process.platform === 'win32') {
    // 1. Ruta moderna en AppData Local
    pathsToCheck.push(path.join(home, 'AppData', 'Local', 'VirtualDJ'));
    // 2. Ruta clásica en Documentos
    pathsToCheck.push(path.join(home, 'Documents', 'VirtualDJ'));
  }
  
  for (const vdjPath of pathsToCheck) {
    if (fs.existsSync(vdjPath)) {
      return vdjPath;
    }
  }
  
  // Retornar primera coincidencia como fallback
  return pathsToCheck[0] || '';
});

ipcMain.handle('write-playlist', async (event, { vdjPath, filename, content }) => {
  try {
    if (!vdjPath) return { success: false, error: 'Ruta de VirtualDJ no especificada.' };
    
    // Asegurar que la carpeta raíz de Virtual DJ existe
    if (!fs.existsSync(vdjPath)) {
      return { success: false, error: 'La ruta de Virtual DJ no existe.' };
    }
    
    // Determinar la subcarpeta (MyLists para moderno, My Lists para clásico, Playlists para M3U)
    let subfolderName = '';
    if (filename.endsWith('.vdjfolder')) {
      const modernLists = path.join(vdjPath, 'MyLists');
      const classicLists = path.join(vdjPath, 'My Lists');
      if (fs.existsSync(modernLists) || !fs.existsSync(classicLists)) {
        subfolderName = 'MyLists';
      } else {
        subfolderName = 'My Lists';
      }
    } else {
      subfolderName = 'Playlists';
    }
    
    const targetFolder = path.join(vdjPath, subfolderName);
    
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    const targetFile = path.join(targetFolder, filename);
    fs.writeFileSync(targetFile, content, 'utf8');
    return { success: true, path: targetFile };
  } catch (error) {
    console.error('Error writing playlist:', error);
    return { success: false, error: error.message };
  }
});

// Función para crear el icono en el System Tray
function createTray() {
  const iconPath = path.join(__dirname, 'build-resources', 'icon.png');
  let image;
  if (fs.existsSync(iconPath)) {
    image = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } else {
    // fallback
    image = nativeImage.createEmpty();
  }
  
  tray = new Tray(image);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar DJ Panel Pro',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Iniciar con el sistema',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          path: app.getPath('exe')
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('DJ Panel Pro');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC Handlers para Notificaciones y Configuración
ipcMain.on('get-config-sync', (event) => {
  event.returnValue = loadConfig();
});

ipcMain.on('save-config-sync', (event, config) => {
  saveConfig(config);
  event.returnValue = true;
});

ipcMain.handle('choose-sound-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar tono de notificación',
    filters: [
      { name: 'Archivos de audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const name = path.basename(filePath);
    return { name, uri: filePath };
  }
  return null;
});

app.whenReady().then(() => {
  // Registrar protocolo seguro para reproducir sonidos locales
  protocol.handle('local-sound', (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-sound://', ''));
    try {
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (err) {
      console.error('Error al cargar sonido local en Electron:', err);
    }
  });

  // Evitar reposo de la pantalla/sistema en macOS/desktop
  powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');

  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Mantener la app viva en el System Tray
});

app.on('will-quit', () => {
  if (powerSaveBlockerId !== undefined && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlocker.stop(powerSaveBlockerId);
  }
});
