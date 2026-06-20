const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    title: "DJ Control Panel",
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
      label: 'DJ App',
      submenu: [
        { label: 'Acerca de DJ App', role: 'about' },
        { type: 'separator' },
        { label: 'Servicios', role: 'services' },
        { type: 'separator' },
        { label: 'Ocultar DJ App', accelerator: 'Command+H', role: 'hide' },
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
  let vdjPath = '';
  if (process.platform === 'darwin') {
    vdjPath = path.join(home, 'Documents', 'VirtualDJ');
  } else if (process.platform === 'win32') {
    vdjPath = path.join(home, 'Documents', 'VirtualDJ');
  }
  
  if (fs.existsSync(vdjPath)) {
    return vdjPath;
  }
  return '';
});

ipcMain.handle('write-playlist', async (event, { vdjPath, filename, content }) => {
  try {
    if (!vdjPath) return { success: false, error: 'Ruta de VirtualDJ no especificada.' };
    
    // Asegurar que la carpeta raíz de Virtual DJ existe
    if (!fs.existsSync(vdjPath)) {
      return { success: false, error: 'La ruta de Virtual DJ no existe.' };
    }
    
    // Determinar la subcarpeta
    const subfolderName = filename.endsWith('.vdjfolder') ? 'My Lists' : 'Playlists';
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
