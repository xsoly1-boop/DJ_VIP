const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DJ Platform Desktop App loaded.');
});

contextBridge.exposeInMainWorld('electronAPI', {
  writePlaylist: (args) => ipcRenderer.invoke('write-playlist', args),
  detectVirtualDJPath: () => ipcRenderer.invoke('detect-virtualdj-path'),
  isDesktop: true
});
