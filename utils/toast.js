class ToastManager {
  constructor() {
    this.toastQueue = [];
    this.activeToasts = new Map();
    this.toastCounter = 0;
    this.duplicateTracker = new Map();
    this.maxToasts = 3;
    this.dedupeWindow = 2000;
  }

  show(message, type = 'info', duration = 3000, actions = []) {
    const hash = this.hashMessage(message, type);
    const duplicate = this.duplicateTracker.get(hash);

    if (duplicate && Date.now() - duplicate.timestamp < this.dedupeWindow) {
      if (duplicate.id && this.activeToasts.has(duplicate.id)) {
        this.updateToast(duplicate.id, message);
        duplicate.count++;
        duplicate.timestamp = Date.now();
        return { id: duplicate.id, remove: () => this.removeToast(duplicate.id) };
      }
    }

    const id = `toast-${Date.now()}-${this.toastCounter++}`;
    const container = this.getOrCreateContainer();

    if (this.activeToasts.size >= this.maxToasts) {
      this.toastQueue.push({ id, message, type, duration, actions });
      return { id, remove: () => this.removeFromQueue(id) };
    }

    const toast = this.createToast(id, message, type, actions);
    container.appendChild(toast);
    this.activeToasts.set(id, { element: toast, type, message });

    this.duplicateTracker.set(hash, {
      id,
      timestamp: Date.now(),
      count: 1
    });

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    let hideTimeout;
    if (duration > 0) {
      hideTimeout = setTimeout(() => this.removeToast(id), duration);
    }

    const progressBar = toast.querySelector('.toast-progress');
    if (progressBar && duration > 0) {
      progressBar.style.setProperty('--duration', `${duration}ms`);
    }

    return {
      id,
      remove: () => {
        if (hideTimeout) clearTimeout(hideTimeout);
        this.removeToast(id);
      },
      update: (newMessage) => this.updateToast(id, newMessage)
    };
  }

  hashMessage(message, type) {
    const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ');
    return `${type}:${normalized}`;
  }

  updateToast(id, message) {
    const toast = this.activeToasts.get(id);
    if (!toast) return;

    const messageEl = toast.element.querySelector('.toast-message');
    if (messageEl) {
      messageEl.textContent = message;
      toast.element.classList.add('toast-update');
      setTimeout(() => {
        toast.element.classList.remove('toast-update');
      }, 300);
    }
  }

  removeToast(id) {
    const toast = this.activeToasts.get(id);
    if (!toast) return;

    toast.element.classList.remove('show');
    toast.element.classList.add('hide');

    setTimeout(() => {
      toast.element.remove();
      this.activeToasts.delete(id);

      for (const [hash, duplicate] of this.duplicateTracker.entries()) {
        if (duplicate.id === id) {
          this.duplicateTracker.delete(hash);
          break;
        }
      }

      this.processQueue();
    }, 300);
  }

  removeFromQueue(id) {
    this.toastQueue = this.toastQueue.filter(t => t.id !== id);
  }

  processQueue() {
    if (this.toastQueue.length > 0 && this.activeToasts.size < this.maxToasts) {
      const next = this.toastQueue.shift();
      this.show(next.message, next.type, next.duration, next.actions);
    }
  }

  getOrCreateContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
      this.addStyles();
    }
    return container;
  }

  createToast(id, message, type, actions) {
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
        <div class="toast-message">${this.escapeHtml(message)}</div>
        ${actions.length > 0 ? `
          <div class="toast-actions">
            ${actions.map((action, index) => `
              <button class="toast-action" data-action="${index}">${this.escapeHtml(action.text)}</button>
            `).join('')}
          </div>
        ` : ''}
        <button class="toast-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="toast-progress"></div>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => this.removeToast(id));

    if (actions.length > 0) {
      toast.querySelectorAll('.toast-action').forEach((btn, index) => {
        btn.addEventListener('click', () => {
          if (actions[index].action) {
            actions[index].action();
          }
          this.removeToast(id);
        });
      });
    }

    return toast;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  addStyles() {
    if (document.getElementById('toast-manager-styles')) return;

    const style = document.createElement('style');
    style.id = 'toast-manager-styles';
    style.textContent = `
      .toast-container {
        position: fixed;
        bottom: calc(var(--player-height, 100px) + 1rem);
        right: 1rem;
        z-index: 1000;
        pointer-events: none;
      }
      
      .toast {
        background: var(--surface);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        margin-bottom: 0.5rem;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: auto;
        position: relative;
        overflow: hidden;
      }
      
      .toast.show {
        transform: translateX(0);
        opacity: 1;
      }
      
      .toast.hide {
        transform: translateX(400px);
        opacity: 0;
      }
      
      .toast.toast-update {
        animation: toastPulse 0.3s ease;
      }
      
      @keyframes toastPulse {
        0%, 100% { transform: translateX(0) scale(1); }
        50% { transform: translateX(0) scale(1.02); }
      }
      
      .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        position: relative;
      }
      
      .toast-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }
      
      .toast.success { border-color: var(--accent3, #10b981); }
      .toast.success .toast-icon { color: var(--accent3, #10b981); }
      .toast.error { border-color: var(--accent2, #ef4444); }
      .toast.error .toast-icon { color: var(--accent2, #ef4444); }
      .toast.warning { border-color: #f59e0b; }
      .toast.warning .toast-icon { color: #f59e0b; }
      .toast.info { border-color: var(--accent1, #3b82f6); }
      .toast.info .toast-icon { color: var(--accent1, #3b82f6); }
      
      .toast-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        color: var(--text-primary);
        word-break: break-word;
      }
      
      .toast-actions {
        display: flex;
        gap: 0.5rem;
        margin-left: auto;
        flex-shrink: 0;
      }
      
      .toast-action {
        background: var(--surface-hover);
        border: 1px solid var(--border);
        color: var(--text-primary);
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .toast-action:hover {
        background: var(--accent1);
        border-color: var(--accent1);
        color: #000;
        transform: translateY(-1px);
      }
      
      .toast-close {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        opacity: 0.6;
      }
      
      .toast-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        transform: rotate(90deg) scale(1.1);
        opacity: 1;
      }
      
      .toast-close svg {
        width: 14px;
        height: 14px;
        stroke-width: 2.5;
      }
      
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: var(--accent1);
        opacity: 0.3;
        animation: toastProgress var(--duration, 3000ms) linear;
      }
      
      @keyframes toastProgress {
        from { width: 100%; }
        to { width: 0; }
      }
      
      @media (max-width: 768px) {
        .toast-container {
          left: 0.5rem;
          right: 0.5rem;
          bottom: calc(var(--player-height, 100px) + 0.5rem);
        }
        
        .toast {
          min-width: unset;
          max-width: unset;
          transform: translateY(100px);
        }
        
        .toast.show {
          transform: translateY(0);
        }
        
        .toast.hide {
          transform: translateY(100px);
        }
        
        .toast-content {
          padding: 0.75rem 1rem;
        }
        
        .toast-actions {
          flex-direction: column;
          width: 100%;
          margin-top: 0.5rem;
        }
        
        .toast-action {
          width: 100%;
          text-align: center;
        }
      }
    `;
    document.head.appendChild(style);
  }

  clearAll() {
    this.activeToasts.forEach((toast, id) => {
      this.removeToast(id);
    });
    this.toastQueue = [];
    this.duplicateTracker.clear();
  }
}

const toastManager = new ToastManager();

export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-enter`;

  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Закрыть">×</button>
  `;

  const style = document.createElement('style');
  if (!document.querySelector('#toast-styles')) {
    style.id = 'toast-styles';
    style.textContent = `
      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        background: rgba(17, 17, 17, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
      }
      
      .toast-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 24px;
        line-height: 1;
        padding: 0;
        margin-left: 12px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .toast-close:hover { 
        opacity: 1; 
      }
      
      .toast-info { border-left: 3px solid #3b82f6; }
      .toast-success { border-left: 3px solid #10b981; }
      .toast-warning { border-left: 3px solid #f59e0b; }
      .toast-error { border-left: 3px solid #ef4444; }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  const closeBtn = toast.querySelector('.toast-close');
  const removeToast = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener('click', removeToast);

  document.body.appendChild(toast);

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }

  return toast;
}
export function clearAllToasts() {
  toastManager.clearAll();
}

export function showNotification(title, options = {}) {
  if (!('Notification' in window)) {
    return showToast(title, 'info');
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/Icons/icon1.png',
      badge: options.badge || '/Icons/icon1.png',
      tag: options.tag || 'deepradio',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      if (options.onclick) options.onclick();
      notification.close();
    };

    return notification;
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showNotification(title, options);
      }
    });
  }

  return showToast(title, 'info');
}