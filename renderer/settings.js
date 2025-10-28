// Ayar yönetimi
export class SettingsManager {
    constructor() {
        this.settings = {};
    }
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
    applySettings() {
        document.getElementById('temperature').value = this.settings.defaultTemperature;
        document.getElementById('temperatureValue').textContent = this.settings.defaultTemperature;
        document.getElementById('maxTokens').value = this.settings.defaultMaxTokens;
    }
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
}
