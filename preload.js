const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bopple', {
  isElectron: true,
  loadConfig: () => ipcRenderer.invoke('cfg:get'),
  saveConfig: (cfg) => ipcRenderer.invoke('cfg:set', cfg),
  pickFolder: () => ipcRenderer.invoke('folder:pick'),
  folderExists: (dir) => ipcRenderer.invoke('folder:exists', dir),
  scanFolder: (dir) => ipcRenderer.invoke('folder:scan', dir),
  readFile: (p) => ipcRenderer.invoke('track:read', p)
});
