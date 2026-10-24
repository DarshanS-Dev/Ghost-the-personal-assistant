const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ghostAPI', {
  runPrompt: (prompt) => ipcRenderer.invoke('ghost:run-prompt', prompt),
  closeWindow: () => ipcRenderer.invoke('ghost:close-window'),
  setWindowHeight: (height) => ipcRenderer.invoke('ghost:set-height', height),
});
