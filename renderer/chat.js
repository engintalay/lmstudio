// Chat yönetimi ve mesaj işlemleri
export class ChatManager {
    constructor() {
        this.chats = [];
        this.currentChatIndex = 0;
    }
    initChats() {
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
        this.currentChatIndex = idx;
        this.renderChatList();
        const chat = this.chats[idx];
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
        chat.messages.forEach((msg, i) => {
            if (msg.role === 'assistant') {
                this.addMessage('assistant', msg.content, false, i);
            } else if (msg.role === 'user') {
                this.addMessage('user', msg.content, false, i);
            } else {
                this.addMessage(msg.role, msg.content, false, i);
            }
        });
    }
    addMessage(role, content, returnElement = false, messageIndex = null) {
        const messagesContainer = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = role === 'user' ? 'user-message' : 'ai-message';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'select-msg';
        msgDiv.appendChild(checkbox);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        if (role === 'assistant') {
            contentDiv.innerHTML = this.formatMessage(content);
            msgDiv.appendChild(contentDiv);
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'Kopyala';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(contentDiv.innerText);
            });
            msgDiv.appendChild(copyBtn);
        } else if (role === 'user') {
            contentDiv.textContent = content;
            msgDiv.appendChild(contentDiv);
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Düzenle';
            msgDiv.appendChild(editBtn);
            const resendBtn = document.createElement('button');
            resendBtn.className = 'resend-btn';
            resendBtn.textContent = 'Tekrar Gönder';
            msgDiv.appendChild(resendBtn);
        } else {
            msgDiv.textContent = content;
        }
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        if (returnElement) return msgDiv;
    }
    formatMessage(text) {
        const codeBlockRegex = /```([\s\S]*?)```/g;
        let formatted = text.replace(codeBlockRegex, (match, code) => {
            const escaped = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            return `<pre><code>${escaped}</code></pre>`;
        });
        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        return formatted;
    }
}
