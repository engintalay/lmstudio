// Dosya işlemleri
export class FileManager {
    constructor() {
        this.currentFile = null;
        this.fileContent = '';
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
            // ...chatManager.addMessage('system', fileMessage)...
        }
    }
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
