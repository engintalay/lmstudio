// Renderer süreci - UI işlemlerini yönetir
class LMStudioApp {
    constructor() {
        this.currentModel = null;
        this.messages = [];
        this.isLoading = false;
        this.currentFile = null;
        this.fileContent = '';
        this.settings = {};
        this.currentStreamingMessage = null;
        this.streamingMessageId = null;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        await this.loadSettings();
        this.bindEvents();
        this.setupStreamingListeners();
        await this.setAppVersion();
        await this.checkConnection();
        await this.loadModels();
        this.setupSettings();
    }
    
    async setAppVersion() {
        try {
            const result = await window.electronAPI.getAppVersion();
            if (result && result.version) {
                document.getElementById('appVersion').textContent = `v${result.version}`;
            }
        } catch (error) {
            document.getElementById('appVersion').textContent = '';
        }
    }
    
    updateTokenInfo(used, max) {
        const tokenInfo = document.getElementById('tokenInfo');
        if (tokenInfo) {
            tokenInfo.textContent = `Token: ${used} / ${max}`;
        }
    }
    
    bindEvents() {
        // Gönder butonu
        document.getElementById('sendButton').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Enter tuşu ile mesaj gönderme
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Sohbeti temizle
        document.getElementById('clearChat').addEventListener('click', () => {
            this.clearChat();
        });
        
        // Sıcaklık ayarı
        const tempSlider = document.getElementById('temperature');
        const tempValue = document.getElementById('temperatureValue');
        tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
        });
        
        // Dosya seçme
        document.getElementById('selectFileButton').addEventListener('click', () => {
            this.selectFile();
        });
        
        // Dosya kaldırma
        document.getElementById('removeFile').addEventListener('click', () => {
            this.removeFile();
        });
        
        // Ayarlar modal
        document.getElementById('openSettingsButton').addEventListener('click', () => {
            this.openSettings();
        });
        
        document.getElementById('closeSettingsButton').addEventListener('click', () => {
            this.closeSettings();
        });
        
        document.getElementById('cancelSettingsButton').addEventListener('click', () => {
            this.closeSettings();
        });
        
        document.getElementById('saveSettingsButton').addEventListener('click', () => {
            this.saveSettings();
        });
        
        document.getElementById('resetSettingsButton').addEventListener('click', () => {
            this.resetSettings();
        });
        
        document.getElementById('testConnectionButton').addEventListener('click', () => {
            this.testConnection();
        });
        
        // Tab seçimi
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });
        
        // Modal dışına tıklama ile kapatma
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });
        
        // Gerçek zamanlı sıcaklık güncelleme
        document.getElementById('defaultTemperature').addEventListener('input', (e) => {
            document.getElementById('defaultTemperatureValue').textContent = e.target.value;
        });
    }
    
    setupStreamingListeners() {
        // Streaming event listeners
        window.electronAPI.onStreamStart((event, data) => {
            this.handleStreamStart(data);
        });
        
        window.electronAPI.onStreamChunk((event, data) => {
            this.handleStreamChunk(data);
        });
        
        window.electronAPI.onStreamEnd((event, data) => {
            this.handleStreamEnd(data);
        });
        
        window.electronAPI.onStreamError((event, data) => {
            this.handleStreamError(data);
        });
    }
    
    async checkConnection() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        try {
            const result = await window.electronAPI.checkHealth();
            if (result.success && result.connected) {
                statusIndicator.className = 'status-indicator connected';
                statusText.textContent = 'LM Studio\'ya bağlı';
            } else {
                throw new Error(result.error || 'Bağlantı başarısız');
            }
        } catch (error) {
            statusIndicator.className = 'status-indicator disconnected';
            statusText.textContent = 'LM Studio\'ya bağlanamadı';
            console.error('Bağlantı hatası:', error);
        }
    }
    
    async loadModels() {
        const modelList = document.getElementById('modelList');
        
        try {
            const result = await window.electronAPI.getModels();
            
            if (result.success && result.data.data && result.data.data.length > 0) {
                modelList.innerHTML = '';
                
                result.data.data.forEach((model, index) => {
                    const modelElement = document.createElement('div');
                    modelElement.className = 'model-item';
                    modelElement.textContent = model.id || `Model ${index + 1}`;
                    
                    modelElement.addEventListener('click', () => {
                        // Önceki seçimi kaldır
                        document.querySelectorAll('.model-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        
                        // Yeni seçimi işaretle
                        modelElement.classList.add('active');
                        this.currentModel = model.id;
                    });
                    
                    // İlk modeli varsayılan olarak seç
                    if (index === 0) {
                        modelElement.classList.add('active');
                        this.currentModel = model.id;
                    }
                    
                    modelList.appendChild(modelElement);
                });
            } else {
                modelList.innerHTML = '<p class="loading">❌ Model bulunamadı</p>';
            }
        } catch (error) {
            console.error('Model yükleme hatası:', error);
            modelList.innerHTML = '<p class="loading">❌ Model yüklenemedi</p>';
        }
    }
    
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message || this.isLoading) {
            return;
        }
        
        // Kullanıcı mesajını ekle
        this.addMessage('user', message);
        
        // Girdi kutusunu temizle
        messageInput.value = '';
        
        // Yükleme durumunu başlat
        this.setLoading(true);
        
        // AI yanıtını al
        try {
            // Dosya içeriği varsa mesaja ekle
            let fullMessage = message;
            if (this.currentFile && this.fileContent) {
                fullMessage = `Eklenen dosya: ${this.currentFile.name}\n\nDosya içeriği:\n${this.fileContent}\n\nKullanıcı sorusu: ${message}`;
            }
            
            // Mesaj geçmişini güncelle
            this.messages.push({ role: 'user', content: fullMessage });
            
            // Streaming kontrolü
            const isStreamingEnabled = document.getElementById('enableStreaming').checked;
            
            if (isStreamingEnabled) {
                // Streaming modunda
                this.streamingMessageId = Date.now();
                
                // Typing indicator göster
                if (this.settings.showTypingIndicator !== false) {
                    this.showTypingIndicator();
                }
                
                const settings = {
                    temperature: parseFloat(document.getElementById('temperature').value),
                    maxTokens: parseInt(document.getElementById('maxTokens').value),
                    timeout: this.settings.timeout || 30
                };
                
                const result = await window.electronAPI.sendChatStream(this.messages, this.currentModel, settings);
                
                if (!result.success) {
                    throw new Error(result.error || 'Streaming yanıt alınamadı');
                }
                
                // Token bilgisini güncelle
                if (result && result.token_usage) {
                    this.updateTokenInfo(result.token_usage.used, result.token_usage.max);
                }
            } else {
                // Normal modda
                const result = await window.electronAPI.sendChat(this.messages, this.currentModel);
                
                if (result.success && result.data.choices && result.data.choices[0]) {
                    const aiResponse = result.data.choices[0].message.content;
                    this.addMessage('assistant', aiResponse);
                    
                    // AI yanıtını mesaj geçmişine ekle
                    this.messages.push({ role: 'assistant', content: aiResponse });
                    
                    if (result.data.usage) {
                        this.updateTokenInfo(result.data.usage.total_tokens, settings.maxTokens);
                    }
                } else {
                    throw new Error(result.error || 'AI yanıt veremedi');
                }
            }
        } catch (error) {
            console.error('Sohbet hatası:', error);
            this.addMessage('assistant', `❌ Üzgünüm, bir hata oluştu: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }
    
    addMessage(role, content, returnElement = false) {
        const messagesContainer = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = role === 'user' ? 'user-message' : 'ai-message';
        if (role === 'assistant') {
            msgDiv.innerHTML = `<div class="message-content">${this.formatMessage(content)}</div>`;
        } else {
            msgDiv.textContent = content;
        }
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        if (returnElement) return msgDiv;
    }

    formatMessage(text) {
        // Basit markdown ve kod blokları desteği
        // Kod bloklarını <pre><code> ile, kalın yazıyı <strong> ile, italik <em> ile göster
        let formatted = text
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        return formatted;
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        
        if (loading) {
            sendButton.disabled = true;
            sendButton.innerHTML = `
                <span class="loading-indicator">
                    <div class="spinner"></div>
                    Yanıt bekleniyor...
                </span>
            `;
            messageInput.disabled = true;
        } else {
            sendButton.disabled = false;
            sendButton.innerHTML = `
                <span class="button-text">Gönder</span>
                <span class="button-icon">📤</span>
            `;
            messageInput.disabled = false;
            messageInput.focus();
        }
    }
    
    clearChat() {
        const messagesContainer = document.getElementById('chatMessages');
        this.messages = [];
        
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h3>Sohbet temizlendi! 🧹</h3>
                <p>Yeni bir konuşmaya başlamak için mesaj yazabilirsiniz.</p>
            </div>
        `;
    }
    
    setupSettings() {
        // Ayarlar zaten HTML'de tanımlı, gelecekte genişletilebilir
        console.log('Ayarlar yüklendi');
    }
    
    async selectFile() {
        try {
            const result = await window.electronAPI.selectFile();
            
            if (result.success && !result.canceled) {
                const fileContent = await window.electronAPI.readFileContent(result.filePath);
                
                if (fileContent.success) {
                    this.currentFile = {
                        path: result.filePath,
                        name: fileContent.fileName,
                        type: fileContent.fileType,
                        size: fileContent.size,
                        content: fileContent.content
                    };
                    
                    this.fileContent = fileContent.content;
                    this.displayFileInfo();
                    this.addFileToChat();
                } else {
                    alert(`Dosya okunamadı: ${fileContent.error}`);
                }
            }
        } catch (error) {
            console.error('Dosya seçme hatası:', error);
            alert(`Dosya seçme sırasında hata oluştu: ${error.message}`);
        }
    }
    
    displayFileInfo() {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileDetails = document.getElementById('fileDetails');
        
        if (this.currentFile) {
            fileName.textContent = `📄 ${this.currentFile.name}`;
            fileDetails.textContent = `${this.formatFileSize(this.currentFile.size)} • ${this.currentFile.type.substring(1).toUpperCase()}`;
            fileInfo.style.display = 'block';
        }
    }
    
    removeFile() {
        this.currentFile = null;
        this.fileContent = '';
        const fileInfo = document.getElementById('fileInfo');
        fileInfo.style.display = 'none';
    }
    
    addFileToChat() {
        if (this.currentFile) {
            const preview = this.fileContent.length > 500 
                ? this.fileContent.substring(0, 500) + '...' 
                : this.fileContent;
                
            const fileMessage = `📎 **${this.currentFile.name}** dosyası eklendi (${this.formatFileSize(this.currentFile.size)})\n\nÖzet:\n${preview}`;
            this.addMessage('system', fileMessage);
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Ayarları yükle
    async loadSettings() {
        try {
            const result = await window.electronAPI.getSettings();
            if (result.success) {
                this.settings = result.settings;
                this.applySettings();
            }
        } catch (error) {
            console.error('Ayarlar yüklenemedi:', error);
        }
    }
    
    // Ayarları uygula
    applySettings() {
        // Hızlı ayarları güncelle
        document.getElementById('temperature').value = this.settings.defaultTemperature;
        document.getElementById('temperatureValue').textContent = this.settings.defaultTemperature;
        document.getElementById('maxTokens').value = this.settings.defaultMaxTokens;
    }
    
    // Ayarlar modalını aç
    openSettings() {
        this.populateSettingsForm();
        document.getElementById('settingsModal').style.display = 'flex';
    }
    
    // Ayarlar modalını kapat
    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }
    
    // Ayarlar formunu doldur
    populateSettingsForm() {
        document.getElementById('serverUrl').value = this.settings.serverUrl;
        document.getElementById('apiKey').value = this.settings.apiKey;
        document.getElementById('timeout').value = this.settings.timeout;
        document.getElementById('theme').value = this.settings.theme;
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('showTimestamps').checked = this.settings.showTimestamps;
        document.getElementById('soundNotifications').checked = this.settings.soundNotifications;
        document.getElementById('defaultTemperature').value = this.settings.defaultTemperature;
        document.getElementById('defaultTemperatureValue').textContent = this.settings.defaultTemperature;
        document.getElementById('defaultMaxTokens').value = this.settings.defaultMaxTokens;
        document.getElementById('systemPrompt').value = this.settings.systemPrompt;
        document.getElementById('autoSave').checked = this.settings.autoSave;
        document.getElementById('contextMemory').checked = this.settings.contextMemory;
        document.getElementById('maxFileSize').value = this.settings.maxFileSize;
        document.getElementById('textPreviewLength').value = this.settings.textPreviewLength;
        document.getElementById('autoIncludeFiles').checked = this.settings.autoIncludeFiles;
        document.getElementById('showFilePreview').checked = this.settings.showFilePreview;
    }
    
    // Tab değiştir
    switchTab(tabName) {
        // Tüm tabları gizle
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Seçili tabı göster
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }
    
    // Ayarları kaydet
    async saveSettings() {
        try {
            const newSettings = {
                serverUrl: document.getElementById('serverUrl').value,
                apiKey: document.getElementById('apiKey').value,
                timeout: parseInt(document.getElementById('timeout').value),
                theme: document.getElementById('theme').value,
                fontSize: document.getElementById('fontSize').value,
                showTimestamps: document.getElementById('showTimestamps').checked,
                soundNotifications: document.getElementById('soundNotifications').checked,
                defaultTemperature: parseFloat(document.getElementById('defaultTemperature').value),
                defaultMaxTokens: parseInt(document.getElementById('defaultMaxTokens').value),
                systemPrompt: document.getElementById('systemPrompt').value,
                autoSave: document.getElementById('autoSave').checked,
                contextMemory: document.getElementById('contextMemory').checked,
                maxFileSize: parseInt(document.getElementById('maxFileSize').value),
                textPreviewLength: parseInt(document.getElementById('textPreviewLength').value),
                autoIncludeFiles: document.getElementById('autoIncludeFiles').checked,
                showFilePreview: document.getElementById('showFilePreview').checked
            };
            
            const result = await window.electronAPI.saveSettings(newSettings);
            if (result.success) {
                this.settings = newSettings;
                this.applySettings();
                this.closeSettings();
                
                // Başarı mesajı
                this.addMessage('system', '⚙️ Ayarlar başarıyla kaydedildi!');
                
                // Bağlantıyı yeniden kontrol et
                await this.checkConnection();
            } else {
                alert(`Ayarlar kaydedilemedi: ${result.error}`);
            }
        } catch (error) {
            console.error('Ayarlar kaydetme hatası:', error);
            alert(`Ayarlar kaydetme sırasında hata oluştu: ${error.message}`);
        }
    }
    
    // Ayarları sıfırla
    async resetSettings() {
        if (confirm('Tüm ayarlar varsayılan değerlere sıfırlanacak. Emin misiniz?')) {
            try {
                const result = await window.electronAPI.resetSettings();
                if (result.success) {
                    this.settings = result.settings;
                    this.populateSettingsForm();
                    this.applySettings();
                    
                    // Bilgi mesajı
                    this.addMessage('system', '🔄 Ayarlar varsayılan değerlere sıfırlandı.');
                } else {
                    alert(`Ayarlar sıfırlanamadı: ${result.error}`);
                }
            } catch (error) {
                console.error('Ayarlar sıfırlama hatası:', error);
                alert(`Ayarlar sıfırlama sırasında hata oluştu: ${error.message}`);
            }
        }
    }
    
    // Bağlantıyı test et
    async testConnection() {
        const button = document.getElementById('testConnectionButton');
        const serverUrl = document.getElementById('serverUrl').value;
        
        button.disabled = true;
        button.textContent = '🔍 Test ediliyor...';
        
        try {
            const result = await window.electronAPI.testConnection(serverUrl);
            
            if (result.success && result.connected) {
                button.textContent = '✅ Bağlantı Başarılı!';
                button.style.backgroundColor = '#059669';
                
                setTimeout(() => {
                    button.textContent = '🔍 Bağlantıyı Test Et';
                    button.style.backgroundColor = '#059669';
                    button.disabled = false;
                }, 3000);
            } else {
                button.textContent = '❌ Bağlantı Başarısız!';
                button.style.backgroundColor = '#dc2626';
                
                setTimeout(() => {
                    button.textContent = '🔍 Bağlantıyı Test Et';
                    button.style.backgroundColor = '#059669';
                    button.disabled = false;
                }, 3000);
                
                alert(`Bağlantı hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('Bağlantı test hatası:', error);
            button.textContent = '❌ Test Başarısız!';
            button.style.backgroundColor = '#dc2626';
            
            setTimeout(() => {
                button.textContent = '🔍 Bağlantıyı Test Et';
                button.style.backgroundColor = '#059669';
                button.disabled = false;
            }, 3000);
        }
    }
    
    // Streaming handlers
    handleStreamStart(data) {
        this.hideTypingIndicator();
        
        // Boş assistant mesajı oluştur
        this.currentStreamingMessage = this.addMessage('assistant', '', true);
        
        // Streaming status göster
        this.showStreamingStatus();
    }
    
    handleStreamChunk(data) {
        if (this.currentStreamingMessage) {
            const messageContent = this.currentStreamingMessage.querySelector('.message-content');
            if (messageContent) {
                messageContent.innerHTML = this.formatMessage(data.fullContent);
            }
        }
    }
    
    handleStreamEnd(data) {
        if (this.currentStreamingMessage) {
            this.currentStreamingMessage.classList.remove('streaming');
            const messageContent = this.currentStreamingMessage.querySelector('.message-content');
            if (messageContent) {
                messageContent.innerHTML = this.formatMessage(data.content);
            }
            // Zaman damgası ekle
            if (!messageContent.querySelector('.message-time')) {
                const newTimeElement = document.createElement('div');
                newTimeElement.className = 'message-time';
                newTimeElement.textContent = new Date().toLocaleTimeString('tr-TR');
                messageContent.appendChild(newTimeElement);
            }
        }
        // Token bilgisini güncelle
        if (data && data.token_usage) {
            this.updateTokenInfo(data.token_usage.used, data.token_usage.max);
        }
    }
    
    handleStreamError(data) {
        this.hideTypingIndicator();
        this.hideStreamingStatus();
        
        if (this.currentStreamingMessage) {
            this.currentStreamingMessage.remove();
        }
        
        this.addMessage('assistant', `❌ Streaming hatası: ${data.error}`);
        this.currentStreamingMessage = null;
        this.setLoading(false);
    }
    
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatMessages');
        
        // Önceki typing indicator'ı kaldır
        this.hideTypingIndicator();
        
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.id = 'typingIndicator';
        
        typingElement.innerHTML = `
            <div class="message-avatar" style="background-color: var(--success-color); color: white;">🤖</div>
            <div style="display: flex; align-items: center; gap: var(--spacing-2);">
                <span>AI yazıyor</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    showStreamingStatus() {
        const messagesContainer = document.getElementById('chatMessages');
        
        const statusElement = document.createElement('div');
        statusElement.className = 'streaming-status';
        statusElement.id = 'streamingStatus';
        
        statusElement.innerHTML = `
            <div class="streaming-icon"></div>
            <span>⚡ Gerçek zamanlı yanıt alınıyor...</span>
        `;
        
        messagesContainer.appendChild(statusElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideStreamingStatus() {
        const streamingStatus = document.getElementById('streamingStatus');
        if (streamingStatus) {
            streamingStatus.remove();
        }
    }
}

// Uygulama DOM yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new LMStudioApp();
});