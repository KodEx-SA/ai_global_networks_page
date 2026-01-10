/**
 * AI Global Networks - Chatbot Application
 * Clean, modular, maintainable architecture
 * Works with both Node.js server and Live Server
 * UPDATED: Using current Groq models (Jan 2026)
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Smart API endpoint detection
  API_ENDPOINT: window.location.port === '5500'
    ? 'http://localhost:3000/api/chat'    // Live Server → Full URL
    : '/api/chat',                         // Node.js Server → Relative URL

  HEALTH_ENDPOINT: window.location.port === '5500'
    ? 'http://localhost:3000/api/health'
    : '/api/health',

  MAX_CHAT_HISTORY: 100,
  AUTO_SAVE: true,
  DEFAULT_MODEL: 'llama-3.3-70b-versatile',  // UPDATED: Current model
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_STREAM: true,
  MAX_MESSAGE_LENGTH: 4000,
};

// Log detected configuration
console.log('🔧 Configuration:', {
  port: window.location.port,
  apiEndpoint: CONFIG.API_ENDPOINT,
  healthEndpoint: CONFIG.HEALTH_ENDPOINT,
  defaultModel: CONFIG.DEFAULT_MODEL
});

// ==================== UTILITY FUNCTIONS ====================
const Utils = {
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  },

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },
};

// ==================== STORAGE MANAGER ====================
const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },
};

// ==================== API CLIENT ====================
const API = {
  async sendMessage(messages, options = {}) {
    const {
      model = CONFIG.DEFAULT_MODEL,
      temperature = CONFIG.DEFAULT_TEMPERATURE,
      stream = CONFIG.DEFAULT_STREAM,
    } = options;

    console.log('📤 Sending request:', { model, endpoint: CONFIG.API_ENDPOINT });

    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        max_tokens: 2048,
        stream,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        errorMessage = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response;
  },

  async checkHealth() {
    try {
      console.log('🏥 Checking health at:', CONFIG.HEALTH_ENDPOINT);
      const response = await fetch(CONFIG.HEALTH_ENDPOINT);
      const data = await response.json();
      console.log('✅ Health check:', data);
      return response.ok;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  },
};

// ==================== MESSAGE FORMATTER ====================
const MessageFormatter = {
  format(content) {
    if (typeof marked !== 'undefined') {
      return marked.parse(content);
    }
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  },

  highlightCode(element) {
    if (typeof hljs !== 'undefined') {
      element.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  },

  addCopyButtons(element) {
    element.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return;

      const button = document.createElement('button');
      button.className = 'copy-code-btn';
      button.textContent = 'Copy';
      button.onclick = () => {
        const code = pre.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
          button.textContent = 'Copied!';
          setTimeout(() => (button.textContent = 'Copy'), 2000);
        });
      };
      pre.style.position = 'relative';
      pre.insertBefore(button, pre.firstChild);
    });
  },
};

// ==================== UI MANAGER ====================
const UI = {
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
  },

  hideModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
  },

  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('active');
  },
};

// ==================== MAIN APPLICATION ====================
class ChatApp {
  constructor() {
    this.currentChatId = null;
    this.chats = Storage.get('chats', []);
    this.currentMessages = [];
    this.settings = Storage.get('settings', {
      model: CONFIG.DEFAULT_MODEL,
      temperature: CONFIG.DEFAULT_TEMPERATURE,
      stream: CONFIG.DEFAULT_STREAM,
    });
    this.isTyping = false;
    this.abortController = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadChatHistory();
    this.checkHealth();
    this.initMarkdown();
  }

  initMarkdown() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
      });
    }
  }

  setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    sendBtn.addEventListener('click', () => this.sendMessage());
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    messageInput.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
      sendBtn.disabled = !e.target.value.trim();
    });

    document.getElementById('newChatBtn')?.addEventListener('click', () => this.newChat());
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => UI.toggleSidebar());
    document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => UI.toggleSidebar());

    document.getElementById('modelSelector')?.addEventListener('click', () => UI.showModal('modelModal'));
    document.getElementById('closeModelModal')?.addEventListener('click', () => UI.hideModal('modelModal'));
    document.getElementById('userMenuBtn')?.addEventListener('click', () => UI.showModal('userModal'));

    document.querySelectorAll('.model-option').forEach((option) => {
      option.addEventListener('click', (e) => {
        const model = e.currentTarget.dataset.model;
        this.settings.model = model;
        this.saveSettings();
        document.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('active'));
        e.currentTarget.classList.add('active');
        UI.hideModal('modelModal');
        UI.showToast(`Switched to ${model}`, 'success');
      });
    });

    document.getElementById('temperatureSlider')?.addEventListener('input', (e) => {
      this.settings.temperature = parseFloat(e.target.value);
      document.getElementById('temperatureValue').textContent = e.target.value;
      this.saveSettings();
    });

    document.getElementById('streamToggle')?.addEventListener('change', (e) => {
      this.settings.stream = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('attachBtn')?.addEventListener('click', () => {
      document.getElementById('fileInput')?.click();
    });

    document.getElementById('exportBtn')?.addEventListener('click', () => this.exportChats());
    document.getElementById('clearAllBtn')?.addEventListener('click', () => this.clearAll());

    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('active');
      });
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.newChat();
      }
    });
  }

  async checkHealth() {
    const healthy = await API.checkHealth();
    if (!healthy) {
      UI.showToast('Cannot connect to server. Please make sure server is running.', 'error');
    }
  }

  async sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || this.isTyping) return;

    if (!this.currentChatId) {
      this.newChat(false);
    }

    input.value = '';
    input.style.height = 'auto';
    input.dispatchEvent(new Event('input'));

    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) welcomeScreen.style.display = 'none';

    this.addMessage('user', message);
    this.currentMessages.push({ role: 'user', content: message });

    this.showTypingIndicator();
    this.isTyping = true;

    try {
      this.abortController = new AbortController();

      if (this.settings.stream) {
        await this.streamResponse();
      } else {
        await this.fetchResponse();
      }

      if (CONFIG.AUTO_SAVE) {
        this.saveChat();
      }
    } catch (error) {
      this.hideTypingIndicator();
      this.isTyping = false;
      console.error('❌ Send message error:', error);

      let errorMsg = 'Sorry, I encountered an error. ';
      if (error.message.includes('Failed to fetch')) {
        errorMsg += 'Please make sure the server is running at http://localhost:3000';
      } else if (error.message.includes('configuration error')) {
        errorMsg += 'Server configuration error. Check GROQ_API_KEY in .env file.';
      } else if (error.message.includes('decommissioned')) {
        errorMsg += 'The AI model is outdated. Please update to a newer model.';
      } else {
        errorMsg += error.message;
      }

      this.addMessage('assistant', errorMsg);
      UI.showToast('Failed to send message', 'error');
    }
  }

  async streamResponse() {
    try {
      const response = await API.sendMessage(this.currentMessages, this.settings);
      this.hideTypingIndicator();

      const messageDiv = this.createMessageElement('assistant');
      const contentDiv = messageDiv.querySelector('.message-content');

      let fullResponse = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';

              if (content) {
                fullResponse += content;
                contentDiv.innerHTML = MessageFormatter.format(fullResponse);
                MessageFormatter.highlightCode(contentDiv);
                MessageFormatter.addCopyButtons(contentDiv);
                this.scrollToBottom();
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      this.addMessageActions(messageDiv);
      this.currentMessages.push({ role: 'assistant', content: fullResponse });
      this.isTyping = false;
    } catch (error) {
      throw error;
    }
  }

  async fetchResponse() {
    try {
      const response = await API.sendMessage(this.currentMessages, {
        ...this.settings,
        stream: false,
      });

      const data = await response.json();
      this.hideTypingIndicator();
      this.addMessage('assistant', data.message);
      this.currentMessages.push({ role: 'assistant', content: data.message });
      this.isTyping = false;
    } catch (error) {
      throw error;
    }
  }

  createMessageElement(role) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    messageDiv.innerHTML = `
      <div class="message-avatar">${role === 'user' ? '👤' : '🤖'}</div>
      <div class="message-content"></div>
    `;

    container.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  addMessage(role, content) {
    const messageDiv = this.createMessageElement(role);
    const contentDiv = messageDiv.querySelector('.message-content');

    contentDiv.innerHTML = MessageFormatter.format(content);
    MessageFormatter.highlightCode(contentDiv);
    MessageFormatter.addCopyButtons(contentDiv);

    if (role === 'assistant') {
      this.addMessageActions(messageDiv);
    }
  }

  addMessageActions(messageDiv) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
      <button class="icon-btn" title="Copy message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <button class="icon-btn" title="Like">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H17.4262C18.907 22 20.1662 20.9197 20.3914 19.4562L21.4683 12.4562C21.7479 10.6389 20.3418 9 18.5032 9H15C14.4477 9 14 8.55228 14 8V4.46584C14 3.10399 12.896 2 11.5342 2C11.2093 2 10.915 2.1913 10.7831 2.48812L7.26394 10.4061C7.10344 10.7673 6.74532 11 6.35013 11H4C2.89543 11 2 11.8954 2 13Z" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <button class="icon-btn" title="Dislike">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M17 2V13M22 11V4C22 2.89543 21.1046 2 20 2H6.57383C5.09297 2 3.83375 3.08027 3.60858 4.54377L2.53165 11.5438C2.25211 13.3611 3.65823 15 5.49685 15H9C9.55228 15 10 15.4477 10 16V19.5342C10 20.896 11.104 22 12.4658 22C12.7907 22 13.085 21.8087 13.2169 21.5119L16.7361 13.5939C16.8966 13.2327 17.2547 13 17.6499 13H20C21.1046 13 22 12.1046 22 11Z" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
      <button class="icon-btn" title="Regenerate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M1 4V10H7M23 20V14H17M20.49 9C19.8397 7.24532 18.6214 5.76325 17.0292 4.78993C15.437 3.81661 13.5574 3.40764 11.6843 3.62716C9.81119 3.84667 8.06464 4.68197 6.73923 5.99991C5.41382 7.31785 4.58447 9.0447 4.37 10.91M3.51 15C4.16027 16.7547 5.37863 18.2368 6.97081 19.2101C8.56299 20.1834 10.4426 20.5924 12.3157 20.3728C14.1888 20.1533 15.9354 19.318 17.2608 18.0001C18.5862 16.6822 19.4155 14.9553 19.63 13.09" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    messageDiv.querySelector('.message-content').appendChild(actionsDiv);
  }

  showTypingIndicator() {
    const container = document.getElementById('messagesContainer');
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    container.appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
  }

  scrollToBottom() {
    const wrapper = document.querySelector('.messages-wrapper');
    wrapper.scrollTop = wrapper.scrollHeight;
  }

  newChat(showToast = true) {
    if (this.currentChatId && CONFIG.AUTO_SAVE) {
      this.saveChat();
    }

    this.currentChatId = Utils.generateId();
    this.currentMessages = [];

    const container = document.getElementById('messagesContainer');
    container.innerHTML = `
      <div class="welcome-screen" id="welcomeScreen">
        <h1>What can I help with?</h1>
      </div>
    `;

    if (showToast) {
      UI.showToast('New chat created', 'success');
    }
  }

  saveChat() {
    if (!this.currentChatId || this.currentMessages.length === 0) return;

    const title = this.currentMessages[0]?.content.substring(0, 50) || 'New Chat';
    const existingIndex = this.chats.findIndex(c => c.id === this.currentChatId);

    const chatData = {
      id: this.currentChatId,
      title,
      messages: this.currentMessages,
      timestamp: Date.now(),
      model: this.settings.model,
    };

    if (existingIndex >= 0) {
      this.chats[existingIndex] = chatData;
    } else {
      this.chats.unshift(chatData);
    }

    if (this.chats.length > CONFIG.MAX_CHAT_HISTORY) {
      this.chats = this.chats.slice(0, CONFIG.MAX_CHAT_HISTORY);
    }

    Storage.set('chats', this.chats);
    this.loadChatHistory();
  }

  loadChatHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;

    list.innerHTML = '';

    if (this.chats.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No chats yet</p>';
      return;
    }

    this.chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'history-item';
      if (chat.id === this.currentChatId) item.classList.add('active');

      item.innerHTML = `
        <span class="history-item-title">${Utils.escapeHtml(chat.title)}</span>
        <div class="history-item-actions">
          <button class="icon-btn" onclick="app.deleteChat('${chat.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
      `;

      item.addEventListener('click', () => this.loadChat(chat.id));
      list.appendChild(item);
    });
  }

  loadChat(chatId) {
    const chat = this.chats.find(c => c.id === chatId);
    if (!chat) return;

    if (this.currentChatId && CONFIG.AUTO_SAVE) {
      this.saveChat();
    }

    this.currentChatId = chatId;
    this.currentMessages = [...chat.messages];

    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    chat.messages.forEach(msg => this.addMessage(msg.role, msg.content));
    this.loadChatHistory();

    if (window.innerWidth <= 768) {
      UI.toggleSidebar();
    }
  }

  deleteChat(chatId) {
    if (!confirm('Delete this chat?')) return;

    this.chats = this.chats.filter(c => c.id !== chatId);
    Storage.set('chats', this.chats);

    if (this.currentChatId === chatId) {
      this.newChat(false);
    }

    this.loadChatHistory();
    UI.showToast('Chat deleted', 'success');
  }

  clearAll() {
    if (!confirm('Delete all chats? This cannot be undone.')) return;

    this.chats = [];
    Storage.set('chats', []);
    this.newChat(false);
    this.loadChatHistory();
    UI.hideModal('userModal');
    UI.showToast('All chats cleared', 'success');
  }

  exportChats() {
    const data = {
      exported: new Date().toISOString(),
      chats: this.chats,
      settings: this.settings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-global-chats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    UI.hideModal('userModal');
    UI.showToast('Chats exported', 'success');
  }

  saveSettings() {
    Storage.set('settings', this.settings);
  }
}

// ==================== INITIALIZE ====================
let app;

document.addEventListener('DOMContentLoaded', () => {
  app = new ChatApp();
  console.log('✅ ChatBot initialized with model:', CONFIG.DEFAULT_MODEL);
});