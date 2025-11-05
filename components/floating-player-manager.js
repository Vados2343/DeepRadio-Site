import { store } from '../core/store.js';

export class FloatingPlayerManager {
  constructor() {
    this.playerBar = document.querySelector('player-bar');

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.position = 'bottom-center';
    this.isFloating = false;
    this.dragThreshold = 5;
    this.hasMovedPastThreshold = false;

    this.floatingClass = 'floating-player-host';

    this.handleResize = this.handleResize.bind(this);

    this.init();
  }

  init() {
    if (!this.playerBar) return;

    const savedStyle = store.getStorage('playerStyle', 'default');
    if (savedStyle === 'island') {
      this.enableFloating();
      this.restorePosition();
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('settings-change', (e) => {
      if (e.detail.key === 'playerStyle') {
        const style = e.detail.value;

        if (style === 'island') {
          this.enableFloating();
        } else {
          this.disableFloating();
        }
      }
    });

    if (this.playerBar) {
      // Mouse events
      this.playerBar.addEventListener('mousedown', this.handleDragStart.bind(this));
      document.addEventListener('mousemove', this.handleDrag.bind(this));
      document.addEventListener('mouseup', this.handleDragEnd.bind(this));

      // Touch events
      this.playerBar.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    window.addEventListener('resize', this.handleResize);
  }

  enableFloating() {
    if (this.isFloating || !this.playerBar) return;

    this.isFloating = true;
    this.playerBar.classList.add('draggable');
    this.playerBar.classList.add(this.floatingClass);

    // принудительно сбрасываем то, что мешает
    this.playerBar.style.right = 'auto';
    this.playerBar.style.left = '50%';
    this.playerBar.style.top = 'auto';
    this.playerBar.style.bottom = '20px';
    this.playerBar.style.transform = 'translateX(-50%)';
    this.playerBar.style.maxWidth = '460px';
    this.playerBar.style.width = 'auto';
    this.playerBar.style.zIndex = '500';

    // Add animation class temporarily
    this.playerBar.classList.add('animating');
    setTimeout(() => {
      if (this.playerBar) {
        this.playerBar.classList.remove('animating');
      }
    }, 400);

    console.log('[FloatingPlayer] Floating mode enabled');
  }

  disableFloating() {
    if (!this.isFloating || !this.playerBar) return;

    this.isFloating = false;
    this.playerBar.classList.remove('draggable', 'dragging', this.floatingClass);

    this.resetPosition();

    console.log('[FloatingPlayer] Floating mode disabled');
  }

  handleResize() {
    if (!this.isFloating || !this.playerBar) return;

    const rect = this.playerBar.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    const x = Math.max(0, Math.min(rect.left, maxX));
    const y = Math.max(0, Math.min(rect.top, maxY));

    this.updatePosition(x, y);
  }

  handleDragStart(e) {
    if (!this.isFloating || !this.playerBar) return;

    // Don't start drag if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
      return;
    }

    this.isDragging = true;
    this.hasMovedPastThreshold = false;

    this.startX = e.clientX;
    this.startY = e.clientY;

    const rect = this.playerBar.getBoundingClientRect();
    this.initialX = rect.left;
    this.initialY = rect.top;

    e.preventDefault();
  }

  handleDrag(e) {
    if (!this.isDragging || !this.playerBar) return;

    e.preventDefault();

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    // Check if moved past threshold
    if (!this.hasMovedPastThreshold) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > this.dragThreshold) {
        this.hasMovedPastThreshold = true;
        this.playerBar.classList.add('dragging');
      } else {
        return;
      }
    }

    this.currentX = this.initialX + deltaX;
    this.currentY = this.initialY + deltaY;

    this.updatePosition(this.currentX, this.currentY);
  }

  handleDragEnd() {
    if (!this.isDragging || !this.playerBar) return;

    this.isDragging = false;
    this.playerBar.classList.remove('dragging');

    if (this.hasMovedPastThreshold) {
      this.snapToEdge();
      this.savePosition();
    }

    this.hasMovedPastThreshold = false;
  }

  handleTouchStart(e) {
    if (!this.isFloating || !this.playerBar) return;

    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
      return;
    }

    const touch = e.touches[0];
    this.isDragging = true;
    this.hasMovedPastThreshold = false;
    this.playerBar.classList.add('dragging');

    this.startX = touch.clientX;
    this.startY = touch.clientY;

    const rect = this.playerBar.getBoundingClientRect();
    this.initialX = rect.left;
    this.initialY = rect.top;

    e.preventDefault();
  }

  handleTouchMove(e) {
    if (!this.isDragging || !this.playerBar) return;

    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    if (!this.hasMovedPastThreshold) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > this.dragThreshold) {
        this.hasMovedPastThreshold = true;
      } else {
        return;
      }
    }

    this.currentX = this.initialX + deltaX;
    this.currentY = this.initialY + deltaY;

    this.updatePosition(this.currentX, this.currentY);
  }

  handleTouchEnd() {
    if (!this.isDragging || !this.playerBar) return;

    this.isDragging = false;
    this.playerBar.classList.remove('dragging');

    if (this.hasMovedPastThreshold) {
      this.snapToEdge();
      this.savePosition();
    }

    this.hasMovedPastThreshold = false;
  }

  updatePosition(x, y) {
    if (!this.playerBar) return;

    const rect = this.playerBar.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    // Constrain to viewport
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    // очень важно: в режиме плавающего плеера мы ВСЕГДА убираем right
    this.playerBar.style.right = 'auto';
    this.playerBar.style.left = `${x}px`;
    this.playerBar.style.bottom = 'auto';
    this.playerBar.style.top = `${y}px`;
    this.playerBar.style.transform = 'none';
    this.playerBar.style.width = 'auto';
  }

  snapToEdge() {
    if (!this.playerBar) return;

    const rect = this.playerBar.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const snapThreshold = 50;

    let newX = rect.left;
    let newY = rect.top;
    let position = 'center';

    const distances = {
      left: centerX,
      right: windowWidth - centerX,
      top: centerY,
      bottom: windowHeight - centerY
    };

    const minDistance = Math.min(...Object.values(distances));

    if (minDistance === distances.left && distances.left < snapThreshold) {
      newX = 20;
      position = 'left';
    } else if (minDistance === distances.right && distances.right < snapThreshold) {
      newX = windowWidth - rect.width - 20;
      position = 'right';
    } else if (minDistance === distances.top && distances.top < snapThreshold) {
      newY = 20;
      position = 'top';
    } else if (minDistance === distances.bottom && distances.bottom < snapThreshold) {
      newY = windowHeight - rect.height - 20;
      position = 'bottom';
    }

    this.playerBar.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.updatePosition(newX, newY);

    this.position = position;
    this.playerBar.setAttribute('data-position', position);

    setTimeout(() => {
      if (this.playerBar) {
        this.playerBar.style.transition = '';
      }
    }, 300);
  }

  savePosition() {
    if (!this.playerBar) return;

    const rect = this.playerBar.getBoundingClientRect();

    const position = {
      x: rect.left,
      y: rect.top,
      position: this.position
    };

    store.setStorage('floatingPlayerPosition', position);
    console.log('[FloatingPlayer] Position saved:', position);
  }

  restorePosition() {
    if (!this.playerBar) return;

    const savedPosition = store.getStorage('floatingPlayerPosition');

    // важно: включаем плавающий стиль перед восстановлением
    this.playerBar.classList.add(this.floatingClass);
    this.playerBar.style.right = 'auto';
    this.playerBar.style.width = 'auto';
    this.playerBar.style.maxWidth = '460px';

    if (savedPosition) {
      this.position = savedPosition.position || 'bottom-center';
      this.playerBar.setAttribute('data-position', this.position);

      const rect = this.playerBar.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      let x = Math.max(0, Math.min(savedPosition.x, maxX));
      let y = Math.max(0, Math.min(savedPosition.y, maxY));

      this.updatePosition(x, y);

      console.log('[FloatingPlayer] Position restored:', savedPosition);
    } else {
      const rect = this.playerBar.getBoundingClientRect();
      const x = (window.innerWidth - rect.width) / 2;
      const y = window.innerHeight - rect.height - 20;
      this.updatePosition(x, y);
    }
  }

  resetPosition() {
    if (!this.playerBar) return;

    this.playerBar.style.left = '';
    this.playerBar.style.top = '';
    this.playerBar.style.bottom = '';
    this.playerBar.style.right = '';
    this.playerBar.style.transform = '';
    this.playerBar.style.width = '';
    this.playerBar.style.maxWidth = '';
    this.playerBar.removeAttribute('data-position');
  }

  setPosition(position) {
    if (!this.playerBar) return;

    const rect = this.playerBar.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x, y;

    switch (position) {
      case 'top':
        x = (windowWidth - rect.width) / 2;
        y = 20;
        break;
      case 'bottom':
        x = (windowWidth - rect.width) / 2;
        y = windowHeight - rect.height - 20;
        break;
      case 'left':
        x = 20;
        y = (windowHeight - rect.height) / 2;
        break;
      case 'right':
        x = windowWidth - rect.width - 20;
        y = (windowHeight - rect.height) / 2;
        break;
      case 'center':
      default:
        x = (windowWidth - rect.width) / 2;
        y = (windowHeight - rect.height) / 2;
        break;
    }

    this.playerBar.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.updatePosition(x, y);

    this.position = position;
    this.playerBar.setAttribute('data-position', position);

    setTimeout(() => {
      if (this.playerBar) {
        this.playerBar.style.transition = '';
      }
    }, 300);

    this.savePosition();
  }

  destroy() {
    this.disableFloating();
    window.removeEventListener('resize', this.handleResize);
  }
}

// Create singleton instance
let floatingPlayerInstance = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    floatingPlayerInstance = new FloatingPlayerManager();
    window.floatingPlayerManager = floatingPlayerInstance;
  });
} else {
  floatingPlayerInstance = new FloatingPlayerManager();
  window.floatingPlayerManager = floatingPlayerInstance;
}

export default FloatingPlayerManager;
