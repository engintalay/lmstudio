// Renderer süreci - UI işlemlerini yönetir
class LMStudioApp {
    constructor() {
        this.currentModel = null;
        this.chats = [];
        this.currentChatIndex = 0;
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
        this.initChats();
    }
    
    initChats() {
        // Varsayılan bir sohbet oluştur
        if (this.chats.length === 0) {
            this.chats.push({ messages: [], name: 'Sohbet 1' });
        }
        this.renderChatList();
        this.loadChat(this.currentChatIndex);
    }

    renderChatList() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';
        this.chats.forEach((chat, idx) => {
            const li = document.createElement('li');
            li.textContent = chat.name;
            if (idx === this.currentChatIndex) li.classList.add('active');
            li.addEventListener('click', () => {
                this.loadChat(idx);
            });
            chatList.appendChild(li);
        });
    }

    loadChat(idx) {
        // Yeni sohbete geçerken önceki streaming işlemini durdur
        this.stopStreaming();
        this.currentChatIndex = idx;
        this.renderChatList();
        const chat = this.chats[idx];
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
        chat.messages.forEach((msg, i) => {
            // AI cevabı ise kopyala butonu ekle, kullanıcı mesajı ise düzenle/tekrar gönder butonu ekle
            if (msg.role === 'assistant') {
                this.addMessage('assistant', msg.content, false, i);
            } else if (msg.role === 'user') {
                this.addMessage('user', msg.content, false, i);
            } else {
                this.addMessage(msg.role, msg.content, false, i);
            }
        });
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
    
    updateTokenInfo(usage, max) {
        const tokenInfo = document.getElementById('tokenInfo');
        // usage objesini debug için konsola yaz
        console.log('Token usage:', usage);
        if (tokenInfo) {
            if (usage && typeof usage === 'object') {
                if (usage.total_tokens) {
                    tokenInfo.textContent = `Kullanılan Token: ${usage.total_tokens}`;
                    console.log('Kullanılan Token:', usage.total_tokens);
                } else if (usage.used) {
                    tokenInfo.textContent = `Kullanılan Token: ${usage.used} / Maksimum: ${usage.max || max || ''}`;
                    console.log('Kullanılan Token:', usage.used, 'Maksimum:', usage.max || max || '');
                } else {
                    tokenInfo.textContent = `Token Bilgisi: ${JSON.stringify(usage)}`;
                    console.log('Token Bilgisi:', usage);
                }
            } else {
                tokenInfo.textContent = '';
            }
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
        
        // Yeni sohbet butonu
        document.getElementById('newChatButton').addEventListener('click', () => {
            const newIdx = this.chats.length + 1;
            this.chats.push({ messages: [], name: `Sohbet ${newIdx}` });
            this.loadChat(this.chats.length - 1);
        });
        
        document.getElementById('exportDocxButton').addEventListener('click', () => {
            this.exportChatDocx();
        });
        document.getElementById('exportPdfButton').addEventListener('click', () => {
            this.exportChatPdf();
        });
        document.getElementById('summarizeChatButton').addEventListener('click', () => {
            this.summarizeChat(false);
        });
        document.getElementById('updateChatWithSummaryButton').addEventListener('click', () => {
            this.summarizeChat(true);
        });
        
        document.getElementById('stopButton').addEventListener('click', () => {
            this.stopStreaming();
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
        if (!message || this.isLoading) return;
        // Kullanıcı mesajını ekle
        this.addMessage('user', message);
        // Mesajı aktif sohbete kaydet
        this.chats[this.currentChatIndex].messages.push({ role: 'user', content: message });
        // Mesaj kutucuğunu temizle
        messageInput.value = '';
        // Yükleme durumunu başlat
        this.setLoading(true);
        try {
            // Dosya içeriği varsa mesaja ekle
            let fullMessage = message;
            if (this.currentFile && this.fileContent) {
                fullMessage = `Eklenen dosya: ${this.currentFile.name}\n\nDosya içeriği:\n${this.fileContent}\n\nKullanıcı sorusu: ${message}`;
            }
            // Sohbetin tüm geçmişini API'ye gönder
            const messagesToSend = this.chats[this.currentChatIndex].messages.map(m => ({ role: m.role, content: m.content }));
            // Streaming kontrolü
            const isStreamingEnabled = document.getElementById('enableStreaming').checked;
            const settings = {
                temperature: parseFloat(document.getElementById('temperature').value),
                maxTokens: parseInt(document.getElementById('maxTokens').value),
                timeout: this.settings.timeout || 30
            };
            if (isStreamingEnabled) {
                this.streamingMessageId = Date.now();
                if (this.settings.showTypingIndicator !== false) {
                    this.showTypingIndicator();
                }
                const result = await window.electronAPI.sendChatStream(messagesToSend, this.currentModel, settings);
                if (!result.success) {
                    throw new Error(result.error || 'Streaming yanıt alınamadı');
                }
                if (result && result.token_usage) {
                    this.updateTokenInfo(result.token_usage, result.token_usage?.max);
                }
            } else {
                const result = await window.electronAPI.sendChat(messagesToSend, this.currentModel);
                if (result.success && result.data.choices && result.data.choices[0]) {
                    const aiResponse = result.data.choices[0].message.content;
                    this.addMessage('assistant', aiResponse);
                    this.chats[this.currentChatIndex].messages.push({ role: 'assistant', content: aiResponse });
                    if (result.usage) {
                        this.updateTokenInfo(result.usage, settings.maxTokens);
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
    
    addMessage(role, content, returnElement = false, messageIndex = null) {
        const messagesContainer = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = role === 'user' ? 'user-message' : 'ai-message';
        if (role === 'assistant') {
            msgDiv.innerHTML = `<div class="message-content">${this.formatMessage(content)}</div><button class="copy-btn">Kopyala</button>`;
            // Kopyala butonu
            msgDiv.querySelector('.copy-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(content);
            });
        } else if (role === 'user') {
            msgDiv.innerHTML = `<div class="message-content">${content}</div><button class="edit-btn">Düzenle</button><button class="resend-btn">Tekrar Gönder</button>`;
            // Düzenle butonu
            msgDiv.querySelector('.edit-btn').addEventListener('click', () => {
                const messageInput = document.getElementById('messageInput');
                messageInput.value = content;
                messageInput.focus();
            });
            // Tekrar gönder butonu
            msgDiv.querySelector('.resend-btn').addEventListener('click', () => {
                const messageInput = document.getElementById('messageInput');
                messageInput.value = content;
                this.sendMessage();
            });
        } else {
            msgDiv.textContent = content;
        }
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        if (returnElement) return msgDiv;
    }

    formatMessage(text) {
        // Kod bloklarını tespit et ve escape et
        const codeBlockRegex = /```([\s\S]*?)```/g;
        let formatted = text.replace(codeBlockRegex, (match, code) => {
            // HTML escape
            const escaped = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            return `<pre><code>${escaped}</code></pre>`;
        });
        // Diğer markdown biçimlendirmeleri
        formatted = formatted
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
                if (data && data.error === 'canceled') {
                    messageContent.innerHTML = '<span style="color:#dc2626">İşlem iptal edildi.</span>';
                } else {
                    messageContent.innerHTML = this.formatMessage(data.content);
                    // Streaming cevabını aktif sohbetin geçmişine ekle
                    this.chats[this.currentChatIndex].messages.push({ role: 'assistant', content: data.content });
                }
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
            this.updateTokenInfo(data.token_usage, data.token_usage?.max);
        }
        // Streaming status ibaresini kaldır ve yanıt tamamlandı mesajı göster
        this.hideStreamingStatus();
        this.showStreamingCompleted();
    }
    
    // Streaming error handler
    handleStreamError(data) {
        if (this.currentStreamingMessage) {
            const messageContent = this.currentStreamingMessage.querySelector('.message-content');
            if (data && data.error === 'canceled') {
                messageContent.innerHTML = '<span style="color:#dc2626">İşlem iptal edildi.</span>';
            } else {
                messageContent.innerHTML = `<span style="color:#dc2626">❌ Streaming hatası: ${data.error}</span>`;
            }
        }
        this.setLoading(false);
        this.hideStreamingStatus();
        this.hideTypingIndicator();
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
    
    async exportChatDocx() {
        // Gerçek DOCX çıktısı için docx kütüphanesi
        const { Document, Packer, Paragraph, TextRun } = require('docx');
        const chat = this.chats[this.currentChatIndex];
        const doc = new Document();
        chat.messages.forEach(msg => {
            doc.addSection({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.content}`,
                                break: 1
                            })
                        ]
                    })
                ]
            });
        });
        const buffer = await Packer.toBlob(doc);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(buffer);
        link.download = `${chat.name}.docx`;
        link.click();
    }

    async exportChatPdf() {
        // Gerçek PDF çıktısı için jsPDF
        const { jsPDF } = require('jspdf');
        const chat = this.chats[this.currentChatIndex];
        const doc = new jsPDF();
        let y = 10;
        chat.messages.forEach(msg => {
            doc.text(`${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.content}`, 10, y);
            y += 10;
        });
        doc.save(`${chat.name}.pdf`);
    }
    
    async summarizeChat(updateHistory = false) {
        const chat = this.chats[this.currentChatIndex];
        // Tüm mesajları birleştir
        const allText = chat.messages.map(msg => `${msg.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${msg.content}`).join('\n');
        // Basit özetleme için AI'ya özet isteği gönder
        const summaryPrompt = `Aşağıdaki sohbeti özetle:\n${allText}`;
        // Sadece özet için son mesaj olarak gönder
        const messagesToSend = [{ role: 'user', content: summaryPrompt }];
        const result = await window.electronAPI.sendChat(messagesToSend, this.currentModel);
        if (result.success && result.data.choices && result.data.choices[0]) {
            const summary = result.data.choices[0].message.content;
            this.addMessage('system', `Sohbet Özeti:\n${summary}`);
            if (updateHistory) {
                // Sohbet geçmişini özet ile değiştir
                this.chats[this.currentChatIndex].messages = [{ role: 'system', content: `Sohbet Özeti:\n${summary}` }];
                this.loadChat(this.currentChatIndex);
            }
        } else {
            this.addMessage('system', '❌ Özetleme başarısız.');
        }
    }
    
    stopStreaming() {
        // Streaming işlemini durdurmak için
        if (window.electronAPI.cancelStream) {
            window.electronAPI.cancelStream();
        }
        this.setLoading(false);
        this.hideStreamingStatus();
        this.hideTypingIndicator();
    }
}

// Uygulama DOM yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new LMStudioApp();
});