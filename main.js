const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// LM Studio varsayılan ayarları
let LM_STUDIO_BASE_URL = 'http://localhost:1234';

// Ayarlar dosyası yolu
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

// Varsayılan ayarlar
const DEFAULT_SETTINGS = {
  serverUrl: 'http://localhost:1234',
  apiKey: '',
  timeout: 30,
  theme: 'light',
  fontSize: 'medium',
  showTimestamps: true,
  soundNotifications: false,
  defaultTemperature: 0.7,
  defaultMaxTokens: 1000,
  systemPrompt: '',
  autoSave: true,
  contextMemory: true,
  maxFileSize: 10,
  textPreviewLength: 500,
  autoIncludeFiles: true,
  showFilePreview: true
};

let mainWindow;

function createWindow() {
  // Ana pencereyi oluştur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  });

  // HTML dosyasını yükle
  mainWindow.loadFile('index.html');

  // Pencere hazır olduğunda göster
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Geliştirme modunda DevTools'u aç
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// Uygulama hazır olduğunda pencereyi oluştur
app.whenReady().then(createWindow);

// Tüm pencereler kapatıldığında uygulamayı sonlandır (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS'ta dock'tan tıklandığında pencereyi yeniden oluştur
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// LM Studio API işlemleri
ipcMain.handle('lm-studio-models', async () => {
  try {
    const response = await axios.get(`${LM_STUDIO_BASE_URL}/v1/models`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Model listesi alınamadı:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lm-studio-chat', async (event, messages, model = null) => {
  try {
    const payload = {
      model: model || 'local-model',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    };

    const response = await axios.post(`${LM_STUDIO_BASE_URL}/v1/chat/completions`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Sohbet isteği başarısız:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lm-studio-health', async () => {
  try {
    const response = await axios.get(`${LM_STUDIO_BASE_URL}/v1/models`);
    return { success: true, connected: true };
  } catch (error) {
    return { success: false, connected: false, error: error.message };
  }
});

// Dosya seçme dialog'u
ipcMain.handle('select-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Dosya Seç',
      buttonLabel: 'Aç',
      filters: [
        { name: 'Tüm Desteklenen Formatlar', extensions: ['txt', 'pdf', 'docx', 'json', 'md', 'js', 'html', 'css', 'py'] },
        { name: 'Metin Dosyaları', extensions: ['txt', 'md'] },
        { name: 'PDF Dosyaları', extensions: ['pdf'] },
        { name: 'Word Belgeleri', extensions: ['docx'] },
        { name: 'Kod Dosyaları', extensions: ['js', 'html', 'css', 'py', 'json'] },
        { name: 'Tüm Dosyalar', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, filePath: result.filePaths[0] };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Dosya içeriği okuma
ipcMain.handle('read-file-content', async (event, filePath) => {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    let content = '';
    let fileName = path.basename(filePath);

    switch (fileExtension) {
      case '.txt':
      case '.md':
      case '.js':
      case '.html':
      case '.css':
      case '.py':
      case '.json':
        content = fs.readFileSync(filePath, 'utf8');
        break;
        
      case '.pdf':
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        content = pdfData.text;
        break;
        
      case '.docx':
        const docxBuffer = fs.readFileSync(filePath);
        const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
        content = docxResult.value;
        break;
        
      default:
        throw new Error(`Desteklenmeyen dosya formatı: ${fileExtension}`);
    }

    return {
      success: true,
      content: content,
      fileName: fileName,
      fileType: fileExtension,
      size: content.length
    };
  } catch (error) {
    console.error('Dosya okuma hatası:', error.message);
    return { success: false, error: error.message };
  }
});

// Ayarları yükle
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const settingsData = fs.readFileSync(SETTINGS_PATH, 'utf8');
      const settings = JSON.parse(settingsData);
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  } catch (error) {
    console.error('Ayarlar yüklenemedi:', error.message);
  }
  return DEFAULT_SETTINGS;
}

// Ayarları kaydet
function saveSettings(settings) {
  try {
    const userData = app.getPath('userData');
    if (!fs.existsSync(userData)) {
      fs.mkdirSync(userData, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Ayarlar kaydedilemedi:', error.message);
    return false;
  }
}

// Ayarları getir
ipcMain.handle('get-settings', async () => {
  try {
    const settings = loadSettings();
    // Sunucu URL'sini güncelle
    LM_STUDIO_BASE_URL = settings.serverUrl;
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Ayarları kaydet
ipcMain.handle('save-settings', async (event, newSettings) => {
  try {
    const success = saveSettings(newSettings);
    if (success) {
      // Sunucu URL'sini güncelle
      LM_STUDIO_BASE_URL = newSettings.serverUrl;
      return { success: true };
    } else {
      return { success: false, error: 'Ayarlar kaydedilemedi' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Ayarları sıfırla
ipcMain.handle('reset-settings', async () => {
  try {
    const success = saveSettings(DEFAULT_SETTINGS);
    if (success) {
      LM_STUDIO_BASE_URL = DEFAULT_SETTINGS.serverUrl;
      return { success: true, settings: DEFAULT_SETTINGS };
    } else {
      return { success: false, error: 'Ayarlar sıfırlanamadı' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Bağlantı test et (özel URL ile)
ipcMain.handle('test-connection', async (event, serverUrl) => {
  try {
    const testUrl = serverUrl || LM_STUDIO_BASE_URL;
    const response = await axios.get(`${testUrl}/v1/models`, { timeout: 5000 });
    return { 
      success: true, 
      connected: true, 
      modelsCount: response.data.data ? response.data.data.length : 0 
    };
  } catch (error) {
    return { 
      success: false, 
      connected: false, 
      error: error.message 
    };
  }
});