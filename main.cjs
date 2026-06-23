const { app, BrowserWindow, Menu, ipcMain, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let powerSaveBlockerId;

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

app.whenReady().then(() => {
  // Evitar reposo de la pantalla/sistema en macOS/desktop
  powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (powerSaveBlockerId !== undefined && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlocker.stop(powerSaveBlockerId);
  }
});
