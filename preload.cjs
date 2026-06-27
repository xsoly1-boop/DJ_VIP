const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DJ Platform Desktop App loaded.');
});

contextBridge.exposeInMainWorld('electronAPI', {
  writePlaylist: (args) => ipcRenderer.invoke('write-playlist', args),
  detectVirtualDJPath: () => ipcRenderer.invoke('detect-virtualdj-path'),
  showNativeNotification: (title, body) => ipcRenderer.send('show-native-notification', { title, body }),
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
      // Si no hay tono seleccionado, reproducimos un timbre electrónico sintetizado premium
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const audioCtx = new AudioContextClass();
        const now = audioCtx.currentTime;

        // Oscilador 1 (Tono base)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5 (Do)
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5 (Sol)
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);

        // Oscilador 2 (Tono armónico de acompañamiento)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.05); // E5 (Mi)
        osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.20); // C6 (Do octavado)
        gain2.gain.setValueAtTime(0.08, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);

        osc1.start(now);
        osc1.stop(now + 0.4);
        
        osc2.start(now + 0.05);
        osc2.stop(now + 0.45);
      } catch (err) {
        console.error('Error al sintetizar el tono por defecto:', err);
      }
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
