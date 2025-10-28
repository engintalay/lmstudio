// Streaming event ve handler yönetimi
export class StreamingManager {
    constructor(app) {
        this.app = app;
    }
    setupStreamingListeners() {
        window.electronAPI.onStreamStart((event, data) => {
            this.app.handleStreamStart(data);
        });
        window.electronAPI.onStreamChunk((event, data) => {
            this.app.handleStreamChunk(data);
        });
        window.electronAPI.onStreamEnd((event, data) => {
            this.app.handleStreamEnd(data);
        });
        window.electronAPI.onStreamError((event, data) => {
            this.app.handleStreamError(data);
        });
    }
}
