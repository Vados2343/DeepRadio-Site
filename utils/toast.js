class ToastManager {
  constructor() {
    this.toastQueue = [];
    this.activeToasts = new Map();
    this.toastCounter = 0;
    this.duplicateTracker = new Map();
    this.maxToasts = 3;
    this.dedupeWindow = 2000;
    this.position = this.getStoragePosition();
    this.setupStyles();
    this.initPositionListener();
  }

  getStoragePosition() {
    try {
      return localStorage.getItem('deepradio_toastPosition') || 'top-right';
    } catch {
      return 'top-right';
    }
  }

  setPosition(position) {
    this.position = position;
    try {
      localStorage.setItem('deepradio_toastPosition', position);
    } catch {}
    this.updateContainerPosition();
  }

  initPositionListener() {
    document.addEventListener('toast-position-change', (e) => {
      if (e.detail) {
        this.setPosition(e.detail);
      }
    });
  }

  updateContainerPosition() {
    const container = document.getElementById('toast-container');
    if (container) {
      container.className = `toast-container toast-${this.position}`;
    }
  }

  show(message, type = 'info', duration = 7000, options = {}) {
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
      this.toastQueue.push({ id, message, type, duration, options });
      return { id, remove: () => this.removeFromQueue(id) };
    }

    const actions = options.actions || [];
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
       let count = 1;

      for (const [hash, duplicate] of this.duplicateTracker.entries()) {
        if (duplicate.id === id) {
          count = duplicate.count;
          break;
        }
      }
      const displayMessage = count > 1 ? `${message} ×${count}` : message;
      messageEl.textContent = displayMessage;
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
      this.show(next.message, next.type, next.duration, next.options);
    }
  }

  getOrCreateContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = `toast-container toast-${this.position}`;
      document.body.appendChild(container);
    }
    return container;
  }

  createToast(id, message, type, actions) {
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
        <div class="toast-body">
          <div class="toast-message">${this.escapeHtml(message)}</div>
          ${actions.length > 0 ? `
            <div class="toast-actions">
              ${actions.map((action, index) => `
                <button class="toast-action" data-action="${index}">${this.escapeHtml(action.text)}</button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <button class="toast-close" aria-label="Закрыть">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
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
          if (actions[index].onClick) {
            actions[index].onClick();
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

  setupStyles() {
    if (document.getElementById('toast-manager-styles')) return;

    const style = document.createElement('style');
    style.id = 'toast-manager-styles';
    style.textContent = `
      .toast-container {
        position: fixed;
        z-index: 10000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      /* Позиционирование */
      .toast-container.toast-top-left {
        top: 24px;
        left: 24px;
      }
      
      .toast-container.toast-top-center {
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .toast-container.toast-top-right {
        top: 24px;
        right: 24px;
      }
      
      .toast-container.toast-bottom-left {
        bottom: calc(var(--player-height, 100px) + 24px);
        left: 24px;
      }
      
      .toast-container.toast-bottom-center {
        bottom: calc(var(--player-height, 100px) + 24px);
        left: 50%;
        transform: translateX(-50%);
      }
      
      .toast-container.toast-bottom-right {
        bottom: calc(var(--player-height, 100px) + 24px);
        right: 24px;
      }
      
      .toast {
        background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 25, 45, 0.95));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        min-width: 320px;
        max-width: 450px;
        box-shadow: 
          0 10px 40px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        transform: translateY(-20px) scale(0.95);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: auto;
        position: relative;
        overflow: hidden;
      }
      
      .toast::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--toast-color, #3b82f6), var(--toast-color-alt, #8b5cf6));
        opacity: 0.8;
      }
      
      .toast.show {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      
      .toast.hide {
        transform: translateY(-20px) scale(0.95);
        opacity: 0;
      }
      
      .toast.toast-update {
        animation: toastPulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      @keyframes toastPulse {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(0) scale(1.03); }
      }
      
      .toast-content {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 16px 20px;
        position: relative;
      }
      
      .toast-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
      }
      
      .toast-success {
        --toast-color: #10b981;
        --toast-color-alt: #34d399;
      }
      
      .toast-success .toast-icon {
        color: #10b981;
        background: rgba(16, 185, 129, 0.15);
      }
      
      .toast-error {
        --toast-color: #ef4444;
        --toast-color-alt: #f87171;
      }
      
      .toast-error .toast-icon {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.15);
      }
      
      .toast-warning {
        --toast-color: #f59e0b;
        --toast-color-alt: #fbbf24;
      }
      
      .toast-warning .toast-icon {
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.15);
      }
      
      .toast-info {
        --toast-color: #3b82f6;
        --toast-color-alt: #60a5fa;
      }
      
      .toast-info .toast-icon {
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.15);
      }
      
      .toast-body {
        flex: 1;
        min-width: 0;
      }
      
      .toast-message {
        font-size: 15px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.95);
        font-weight: 500;
        word-break: break-word;
        margin: 0;
      }
      
      .toast-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      
      .toast-action {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.9);
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      
      .toast-action:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }
      
      .toast-action:active {
        transform: translateY(0);
      }
      
      .toast-close {
        position: relative;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        flex-shrink: 0;
        margin-left: 4px;
      }
      
      .toast-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
        transform: rotate(90deg);
      }
      
      .toast-close:active {
        transform: rotate(90deg) scale(0.95);
      }
      
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--toast-color, #3b82f6), var(--toast-color-alt, #8b5cf6));
        opacity: 0.6;
        animation: toastProgress var(--duration, 7000ms) linear;
        border-radius: 0 0 12px 12px;
      }
      
      @keyframes toastProgress {
        from { width: 100%; }
        to { width: 0; }
      }
      
      /* Адаптация для мобильных */
      @media (max-width: 768px) {
        .toast-container {
          left: 12px !important;
          right: 12px !important;
          transform: none !important;
        }
        
        .toast-container.toast-bottom-left,
        .toast-container.toast-bottom-center,
        .toast-container.toast-bottom-right {
          bottom: calc(var(--player-height, 100px) + 12px);
        }
        
        .toast-container.toast-top-left,
        .toast-container.toast-top-center,
        .toast-container.toast-top-right {
          top: 12px;
        }
        
        .toast {
          min-width: unset;
          max-width: unset;
          width: 100%;
          transform: translateY(20px) scale(0.95);
        }
        
        .toast.show {
          transform: translateY(0) scale(1);
        }
        
        .toast.hide {
          transform: translateY(20px) scale(0.95);
        }
        
        .toast-content {
          padding: 14px 16px;
          gap: 12px;
        }
        
        .toast-icon {
          width: 28px;
          height: 28px;
        }
        
        .toast-icon svg {
          width: 20px;
          height: 20px;
        }
        
        .toast-message {
          font-size: 14px;
        }
        
        .toast-actions {
          flex-direction: column;
          width: 100%;
        }
        
        .toast-action {
          width: 100%;
          text-align: center;
          justify-content: center;
        }
      }
      
      /* Анимация появления для разных позиций */
      .toast-container.toast-top-left .toast,
      .toast-container.toast-top-center .toast,
      .toast-container.toast-top-right .toast {
        transform: translateY(-20px) scale(0.95);
      }
      
      .toast-container.toast-bottom-left .toast,
      .toast-container.toast-bottom-center .toast,
      .toast-container.toast-bottom-right .toast {
        transform: translateY(20px) scale(0.95);
      }
      
      /* Темная тема */
      @media (prefers-color-scheme: light) {
        .toast {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 250, 250, 0.95));
          border-color: rgba(0, 0, 0, 0.1);
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(0, 0, 0, 0.05) inset;
        }
        
        .toast-message {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .toast-icon {
          background: rgba(0, 0, 0, 0.05);
        }
        
        .toast-close {
          color: rgba(0, 0, 0, 0.5);
        }
        
        .toast-close:hover {
          color: rgba(0, 0, 0, 0.8);
          background: rgba(0, 0, 0, 0.05);
        }
        
        .toast-action {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.8);
        }
        
        .toast-action:hover {
          background: rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.15);
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

export function showToast(message, type = 'info', duration = 7000, options = {}) {
  return toastManager.show(message, type, duration, options);
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