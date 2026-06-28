const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DJ Platform Desktop App loaded.');
});

contextBridge.exposeInMainWorld('electronAPI', {
  writePlaylist: (args) => ipcRenderer.invoke('write-playlist', args),
  detectVirtualDJPath: () => ipcRenderer.invoke('detect-virtualdj-path'),
  showNativeNotification: (title, body, soundEnabled) => ipcRenderer.send('show-native-notification', { title, body, silent: !soundEnabled }),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  isDesktop: true
});

// Cargar la configuración inicial de forma síncrona
let localConfig = ipcRenderer.sendSync('get-config-sync') || {
  selected_ringtone_uri: '',
  selected_ringtone_name: 'Predeterminado del sistema',
  user_uid: '',
  user_role: '',
  minimize_to_tray: false
};

// Polyfill/Bridge para simular la interfaz AndroidApp en Escritorio
contextBridge.exposeInMainWorld('AndroidApp', {
  getMinimizeToTray: () => {
    return !!localConfig.minimize_to_tray;
  },

  setMinimizeToTray: (value) => {
    localConfig.minimize_to_tray = !!value;
    ipcRenderer.sendSync('save-config-sync', localConfig);
  },
  playSystemNotificationSound: () => {
    if (localConfig.selected_ringtone_uri) {
      // Tono personalizado elegido por el usuario
      try {
        const audio = new Audio('local-sound://' + encodeURIComponent(localConfig.selected_ringtone_uri));
        audio.play().catch(err => {
          console.warn('No se pudo reproducir el tono personalizado:', err.message);
        });
      } catch (err) {
        console.error('Error al intentar reproducir audio local:', err);
      }
    } else {
      // Si no hay tono seleccionado, reproducimos el sonido de alerta nativo de macOS (Ping) a través del proceso principal
      ipcRenderer.send('play-native-mac-sound');
    }
  },

  chooseNotificationSound: async () => {
    try {
      const sound = await ipcRenderer.invoke('choose-sound-dialog');
      if (sound) {
        localConfig.selected_ringtone_uri = sound.uri;
        localConfig.selected_ringtone_name = sound.name;
        ipcRenderer.sendSync('save-config-sync', localConfig);
        // Recargar la ventana para actualizar la UI del frontend (comportamiento idéntico a la app de Android)
        window.location.reload();
      }
    } catch (err) {
      console.error('Error en chooseNotificationSound:', err);
    }
  },

  getSelectedSoundName: () => {
    return localConfig.selected_ringtone_name || 'Predeterminado del sistema';
  },

  getFCMToken: () => {
    // Token simulado para escritorio. Evita errores en el backend al registrar
    return 'desktop_tray_listener';
  },

  setUserUID: (uid) => {
    if (uid !== localConfig.user_uid) {
      localConfig.user_uid = uid || '';
      ipcRenderer.sendSync('save-config-sync', localConfig);
    }
  },

  getUserUID: () => {
    return localConfig.user_uid || '';
  },

  setUserRole: (role) => {
    if (role !== localConfig.user_role) {
      localConfig.user_role = role || '';
      ipcRenderer.sendSync('save-config-sync', localConfig);
    }
  },

  getUserRole: () => {
    return localConfig.user_role || '';
  }
});
