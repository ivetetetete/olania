const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('olaniaElectron', {
  isElectron: true,
  openExternal: (url) => ipcRenderer.invoke('olania:open-external', url),
  loginBluedot: () => ipcRenderer.invoke('olania:login-bluedot'),
  scrapeBluedot: (url) => ipcRenderer.invoke('olania:scrape-bluedot', url),
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('olania:set-ignore-mouse', ignore),
  onTogglePanel: (callback) => {
    ipcRenderer.on('olania:toggle-panel', () => callback());
  },
});
