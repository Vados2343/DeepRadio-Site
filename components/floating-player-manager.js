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
     this.draggingEnabled = true;
    this.currentWidthPercent = undefined;

    this.dragListenersSetup = false;
    this.floatingClass = 'floating-player-host';
    this.handleResize = this.handleResize.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.init();
  }

  init() {
    if (!this.playerBar) return;

   this.draggingEnabled = store.getStorage('floatingDraggingEnabled', true);



    const savedStyle = store.getStorage('playerStyle', 'default');

    if (savedStyle === 'island') {
      this.enableFloating();
      this.restorePosition();
      const showIcon = store.getStorage('floatingShowIcon', true);
      const showStationName = store.getStorage('floatingShowStationName', true);
      const showTrackInfo = store.getStorage('floatingShowTrackInfo', true);
      const showVolume = store.getStorage('floatingShowVolume', true);
      const showPlayButton = store.getStorage('floatingShowPlayButton', true);
      const showStepButtons = store.getStorage('floatingShowStepButtons', false);
      this.applyVisibilitySettings({
        icon: showIcon,
        stationName: showStationName,
        trackInfo: showTrackInfo,
        volume: showVolume,
        playButton: showPlayButton,
        stepButtons: showStepButtons
      });
       const marqueeEnabled = store.getStorage('floatingMarqueeEnabled', true);
      this.playerBar.setAttribute('data-marquee-enabled', marqueeEnabled);
      const playerWidth = store.getStorage('floatingPlayerWidth', 50);
      this.setPlayerWidth(playerWidth);
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
    document.addEventListener('floating-player-change', (e) => {
      console.log('[FloatingPlayerManager] Received event:', e.detail);
 const { enabled, draggingEnabled, marqueeEnabled, visibility, width } = e.detail;
      if (enabled) {
        console.log('[FloatingPlayerManager] Enabling floating mode...');
        this.enableFloating();
        if (draggingEnabled !== undefined) {
          this.draggingEnabled = draggingEnabled;
          if (this.isFloating) {
            if (draggingEnabled && !this.dragListenersSetup) {
              this.playerBar.classList.add('draggable');
              this.setupDragListeners();
               } else if (!this.draggingEnabled) {
      this.playerBar.classList.remove('draggable');
            } else if (!draggingEnabled && this.dragListenersSetup) {
              this.playerBar.classList.remove('draggable');
              this.removeDragListeners();
            }
          }
        }
        if (marqueeEnabled !== undefined) {
          this.playerBar.setAttribute('data-marquee-enabled', marqueeEnabled);
        }
        if (width !== undefined) {
          this.setPlayerWidth(width);
        }
        if (visibility) {
          this.applyVisibilitySettings(visibility);
        }
      } else {
        console.log('[FloatingPlayerManager] Disabling floating mode...');
        this.disableFloating();
      }
    });
    window.addEventListener('resize', this.handleResize);
  }

  enableFloating() {
    if (this.isFloating || !this.playerBar) return;
    this.isFloating = true;
    this.playerBar.style.position = 'fixed';
    this.playerBar.style.zIndex = '500';
    if (this.draggingEnabled && !this.dragListenersSetup){
      this.playerBar.classList.add('draggable');
      this.setupDragListeners();
    }
    document.body.style.paddingBottom = '0';
    const mainElement = document.querySelector('.app-main');
    if (mainElement) {
      mainElement.style.paddingBottom = '0';
    }
    this.playerBar.classList.add('animating');
    this.restorePosition();
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
     this.removeDragListeners();
    this.playerBar.classList.remove('draggable', 'dragging', this.floatingClass);
    this.resetPosition();
    this.currentWidthPercent = undefined;
    document.body.style.paddingBottom = '';
    const mainElement = document.querySelector('.app-main');
    if (mainElement) {
      mainElement.style.paddingBottom = '';
    }
    console.log('[FloatingPlayer] Floating mode disabled');
  }

  handleResize() {
    if (!this.isFloating || !this.playerBar) return;

    if (this.currentWidthPercent !== undefined) {
      this.setPlayerWidth(this.currentWidthPercent);
    }
    const rect = this.playerBar.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    const x = Math.max(20, Math.min(rect.left, maxX - 20));
    const y = Math.max(20, Math.min(rect.top, maxY - 20));

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
    const padding = 20;
    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;

    x = Math.max(padding, Math.min(x, maxX));
    y = Math.max(padding, Math.min(y, maxY));

    this.playerBar.style.right = 'auto';
    this.playerBar.style.left = `${x}px`;
    this.playerBar.style.bottom = 'auto';
    this.playerBar.style.top = `${y}px`;
    this.playerBar.style.transform = 'none';
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
    const storedWidth = store.getStorage('floatingPlayerWidth', 50);
    this.setPlayerWidth(storedWidth);

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
    this.playerBar.style.minWidth = '';
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

  setupDragListeners() {

    if (!this.playerBar || this.dragListenersSetup) return;
    this.playerBar.addEventListener('mousedown', this.handleDragStart);
    document.addEventListener('mousemove', this.handleDrag);
    document.addEventListener('mouseup', this.handleDragEnd);
    this.playerBar.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    this.dragListenersSetup = true;
    console.log('[FloatingPlayer] Drag listeners enabled');
  }
  removeDragListeners() {
    if (!this.playerBar || !this.dragListenersSetup) return;
    this.playerBar.removeEventListener('mousedown', this.handleDragStart);
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    this.playerBar.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    this.dragListenersSetup = false;
    console.log('[FloatingPlayer] Drag listeners disabled');
  }
  applyVisibilitySettings(visibility) {
    if (!this.playerBar || !visibility) return;
    console.log('[FloatingPlayer] Applying visibility settings:', visibility);
    this.playerBar.setAttribute('data-show-icon', visibility.icon !== false);
    this.playerBar.setAttribute('data-show-station-name', visibility.stationName !== false);
    this.playerBar.setAttribute('data-show-track-info', visibility.trackInfo !== false);
    this.playerBar.setAttribute('data-show-volume', visibility.volume !== false);
    this.playerBar.setAttribute('data-show-play-button', visibility.playButton !== false);
    this.playerBar.setAttribute('data-show-step-buttons', visibility.stepButtons === true);
  }
   setPlayerWidth(widthPercent) {
    if (!this.playerBar || !this.isFloating) return;

    const numericPercent = Number(widthPercent);
    const safePercent = Number.isFinite(numericPercent) ? numericPercent : 50;
    const clampedPercent = Math.min(Math.max(safePercent, 0), 100);
    this.currentWidthPercent = clampedPercent;

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const availableWidth = Math.max(viewportWidth - 40, 0);
    const baseWidth = (viewportWidth * clampedPercent) / 100;
    const calculatedWidth = Math.min(baseWidth, availableWidth);
    const pixelWidth = Math.max(calculatedWidth, 0);

    const widthValue = `${pixelWidth}px`;
    this.playerBar.style.width = widthValue;
    this.playerBar.style.maxWidth = widthValue;
    this.playerBar.style.minWidth = widthValue;

    console.log('[FloatingPlayer] Width set to', `${clampedPercent}%`, `(${widthValue})`);
  }
  destroy() {
    this.disableFloating();
    this.removeDragListeners();
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
