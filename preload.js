const { contextBridge, ipcRenderer } = require('electron');

// Ana süreçle güvenli iletişim için API'yi expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // LM Studio API çağrıları
  getModels: () => ipcRenderer.invoke('lm-studio-models'),
  sendChat: (messages, model) => ipcRenderer.invoke('lm-studio-chat', messages, model),
  checkHealth: () => ipcRenderer.invoke('lm-studio-health'),
  
  // Dosya işlemleri
  selectFile: () => ipcRenderer.invoke('select-file'),
  readFileContent: (filePath) => ipcRenderer.invoke('read-file-content', filePath),
  
  // Ayarlar işlemleri
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  testConnection: (serverUrl) => ipcRenderer.invoke('test-connection', serverUrl)
});