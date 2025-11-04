// Burger menu component - ES6 module
class BurgerMenu {
  constructor() {
    this.initialized = false;
    this.btn = null;
    this.panel = null;
    this.overlay = null;
    this.mq = null;
    this.isOpen = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.scrollTop = 0;

    this.init();
  }

  init() {
    // Prevent multiple initializations
    if (this.initialized) return;
    this.initialized = true;

    this.btn = document.querySelector('[data-burger]') || document.getElementById('menu-toggle');
    this.panel = document.querySelector('[data-sidebar]') || document.getElementById('sidebar');

    if (!this.panel || !this.btn) {
      console.warn('[BurgerMenu] Required elements not found');
      return;
    }

    this.setupOverlay();
    this.setupStyles();
    this.mq = window.matchMedia('(max-width: 768px)');

    this.setupEventListeners();
    this.applyState(false);
  }

  setupOverlay() {
    this.overlay = document.getElementById('sidebar-overlay');
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'sidebar-overlay';
      this.overlay.className = 'sidebar-overlay';
      document.body.appendChild(this.overlay);
    }
  }

  setupStyles() {
    if (!document.getElementById('__dr_burger_css')) {
      const style = document.createElement('style');
      style.id = '__dr_burger_css';
      style.textContent = `
        #sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          z-index: 45;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.3s ease;
        }
        #sidebar-overlay.show {
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        @media (max-width: 768px) {
          #sidebar {
            position: fixed !important;
            top: var(--total-header-height);
            bottom: var(--total-player-height-mobile);
            left: 0;
            width: 280px;
            max-width: 85vw;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
            z-index: 50;
            background: var(--bg-gradient-start);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          #sidebar.open {
            transform: translateX(0);
          }
          body.menu-open {
            overflow: hidden;
            position: fixed;
            width: 100%;
          }
        }
        @media (min-width: 769px) {
          #sidebar-overlay {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          #sidebar {
            position: relative !important;
            transform: none !important;
            width: var(--sidebar-width);
            height: 100%;
            border-right: 1px solid var(--border);
            overflow-y: auto;
            transition: width 0.3s ease;
          }
          #sidebar.medium {
            width: var(--sidebar-medium);
          }
          #sidebar.collapsed {
            width: var(--sidebar-collapsed);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  setupEventListeners() {
    // Button click
    if (this.btn) {
      this.btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      });
    }

    // Overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    }

    // Navigation clicks
    this.panel.addEventListener('click', this.handleNavClick.bind(this));

    // Touch gestures
    this.panel.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.panel.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Responsive behavior
    this.mq.addEventListener('change', this.handleResize.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('orientationchange', this.handleResize.bind(this));

    // Page show (for back navigation)
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        this.applyState(false);
      }
    });

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.mq.matches && this.isOpen) {
        requestAnimationFrame(() => {
          if (this.overlay) this.overlay.classList.add('show');
          if (this.panel) this.panel.classList.add('open');
        });
      }
    });

    // Changelog button integration
    const changelogBtn = document.getElementById('changelog-sidebar-btn');
    if (changelogBtn) {
      changelogBtn.addEventListener('click', () => {
        if (this.mq.matches) this.close();
        const changelogPanel = document.querySelector('changelog-panel');
        if (changelogPanel) {
          changelogPanel.style.display = 'block';
          setTimeout(() => changelogPanel.open(), 50);
        }
      });
    }
  }

  applyState(open) {
    this.isOpen = open;

    if (this.mq.matches) {
      if (open) {
        this.scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.panel.classList.add('open');
        this.overlay.classList.add('show');
        document.body.classList.add('menu-open');
        document.body.style.top = `-${this.scrollTop}px`;
      } else {
        this.panel.classList.remove('open');
        this.overlay.classList.remove('show');
        document.body.classList.remove('menu-open');
        document.body.style.top = '';
        window.scrollTo(0, this.scrollTop);
      }

      if (this.btn) {
        this.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      this.panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    } else {
      // Desktop mode - remove mobile states
      this.panel.classList.remove('open');
      this.overlay.classList.remove('show');
      document.body.classList.remove('menu-open');
      document.body.style.top = '';

      if (this.btn) {
        this.btn.setAttribute('aria-expanded', 'false');
      }
      this.panel.setAttribute('aria-hidden', 'false');
    }
  }

  open() {
    if (!this.mq.matches || this.isOpen) return;
    this.applyState(true);
  }

  close() {
    if (!this.isOpen) return;
    this.applyState(false);
  }

  toggle() {
    if (!this.mq.matches) {
      // Desktop mode - cycle through states
      const currentState = this.panel.classList.contains('collapsed') ? 'collapsed' :
                          this.panel.classList.contains('medium') ? 'medium' : 'full';

      this.panel.classList.remove('collapsed', 'medium');

      switch(currentState) {
        case 'full':
          this.panel.classList.add('medium');
          break;
        case 'medium':
          this.panel.classList.add('collapsed');
          break;
        case 'collapsed':
          // Back to full
          break;
      }
      return;
    }

    // Mobile mode - toggle open/close
    this.isOpen ? this.close() : this.open();
  }

  handleTouchStart(e) {
    if (!this.mq.matches || !this.isOpen) return;

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
  }

  handleTouchMove(e) {
    if (!this.mq.matches || !this.isOpen) return;

    const touch = e.touches[0];
    const deltaX = this.touchStartX - touch.clientX;
    const deltaY = Math.abs(this.touchStartY - touch.clientY);

    // Swipe to close gesture
    if (deltaX > 50 && deltaY < 50 && (Date.now() - this.touchStartTime) < 500) {
      this.close();
      e.preventDefault();
    }
  }

  handleResize() {
    if (!this.mq.matches && this.isOpen) {
      this.applyState(false);
    }
  }

  handleNavClick(e) {
    const link = e.target.closest('a, button, .nav-item');
    if (link && !link.hasAttribute('data-no-close')) {
      // Обработка data-view атрибута
      const view = link.getAttribute('data-view');
      if (view && window.store) {
        console.log('[BurgerMenu] Switching view to:', view);
        window.store.setView(view);
      }

      if (link.tagName === 'A') {
        const href = link.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          if (link.getAttribute('target') !== '_blank') {
            setTimeout(() => this.close(), 100);
          }
        }
      } else if (link.classList.contains('nav-item') || link.tagName === 'BUTTON') {
        if (this.mq.matches) {
          setTimeout(() => this.close(), 150);
        }
      }
    }
  }

  destroy() {
    this.applyState(false);
    // Remove event listeners if needed
  }
}

// Initialize on DOM ready
let burgerMenuInstance = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    burgerMenuInstance = new BurgerMenu();
    window.burgerMenu = burgerMenuInstance;
  }, { once: true });
} else {
  setTimeout(() => {
    burgerMenuInstance = new BurgerMenu();
    window.burgerMenu = burgerMenuInstance;
  }, 0);
}

export { BurgerMenu, burgerMenuInstance };
export default BurgerMenu;