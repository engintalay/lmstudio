const { contextBridge, ipcRenderer } = require('electron');

// Ana süreçle güvenli iletişim için API'yi expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // LM Studio API çağrıları
  getModels: () => ipcRenderer.invoke('lm-studio-models'),
  sendChat: (messages, model) => ipcRenderer.invoke('lm-studio-chat', messages, model),
  sendChatStream: (messages, model, settings) => ipcRenderer.invoke('lm-studio-chat-stream', messages, model, settings),
  checkHealth: () => ipcRenderer.invoke('lm-studio-health'),
  
  // Streaming event listeners
  onStreamStart: (callback) => ipcRenderer.on('stream-start', callback),
  onStreamChunk: (callback) => ipcRenderer.on('stream-chunk', callback),
  onStreamEnd: (callback) => ipcRenderer.on('stream-end', callback),
  onStreamError: (callback) => ipcRenderer.on('stream-error', callback),
  removeStreamListeners: () => {
    ipcRenderer.removeAllListeners('stream-start');
    ipcRenderer.removeAllListeners('stream-chunk');
    ipcRenderer.removeAllListeners('stream-end');
    ipcRenderer.removeAllListeners('stream-error');
  },
  
  // Dosya işlemleri
  selectFile: () => ipcRenderer.invoke('select-file'),
  readFileContent: (filePath) => ipcRenderer.invoke('read-file-content', filePath),
  
  // Ayarlar işlemleri
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  testConnection: (serverUrl) => ipcRenderer.invoke('test-connection', serverUrl),
  
  // Sürüm bilgisi
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Streaming işlemini durdurmak
  cancelStream: async () => await ipcRenderer.invoke('cancel-stream')
});