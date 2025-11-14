import './assets/core.css';
import './core/patch-hls.js';
import './utils/performance.js';
import './utils/icon-manager.js';
import './utils/episode-modal.js';
import './components/burger-menu.js';
import './components/capsule-search.js';
import './components/changelog-panel.js';
import './components/floating-player-manager.js';
import './components/floating-player-panel.js';
import './components/gradient-creator-panel.js';
import './components/player-bar.js';
import './components/settings-panel.js';
import './components/station-grid.js';
import './components/stats-view.js';
import './components/like-prompt.js';

import { store } from './core/store.js';
import { t, setLanguage, initI18n } from './utils/i18n.js';
import { throttle } from './utils/performance.js';
import { Config } from './core/config.js';
import { authManager } from './auth/auth-manager.js';
import './auth/auth-panel.js';
import { dbSync } from './utils/db-sync.js';
import { showToast } from './utils/toast.js';
import { BurgerMenu } from './components/burger-menu.js';
import { FloatingPlayerManager } from './components/floating-player-manager.js';
import { GeometricVisualizer } from './components/GeometricVisualizer.js';
import { OrganicVisualizer } from './components/OrganicVisualizer.js';

// Global references for debugging
window.authManager = authManager;
window.dbSync = dbSync;
window.store = store;

class EnhancedVisualizerManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.currentVisualizer = null;
    this.currentClass = 'geometric';
    this.isEnabled = true;
    this.analyser = null;
    this.loadSettings();
    this.setupEventListeners();
  }

  initVisualizer() {
    if (this.currentVisualizer) {
      this.currentVisualizer.destroy();
      this.currentVisualizer = null;
    }
    if (!this.isEnabled) return;
    this.analyser = store.analyserNode;
    if (!this.analyser) return;
    try {
      this.currentVisualizer = this.currentClass === 'geometric'
        ? new GeometricVisualizer(this.analyser, this.canvas)
        : new OrganicVisualizer(this.analyser, this.canvas);
      if (this.savedMode !== undefined && this.currentVisualizer) {
        this.currentVisualizer.currentMode = this.savedMode % this.currentVisualizer.modes.length;
        this.currentVisualizer.resetMode();
      }
      const opacity = store.getStorage('vizOpacity', Config.visualizer.defaultOpacity);
      this.canvas.style.opacity = opacity / 100;
    } catch (e) {
      console.error('Failed to initialize visualizer:', e);
    }
  }

  loadSettings() {
    const savedClass = store.getStorage('visualizerClass', Config.visualizer.defaultClass);
    const savedMode = parseInt(store.getStorage('visualizerMode', Config.visualizer.defaultMode));
    const savedEnabled = store.getStorage('visualizerEnabled', true);
    this.currentClass = savedClass;
    this.savedMode = savedMode;
    this.isEnabled = savedEnabled;
  }

  setupEventListeners() {
    store.on('player-state-change', (e) => {
      const { state } = e.detail;
      if (state === 'PLAYING' && !this.currentVisualizer) {
        setTimeout(() => this.initVisualizer(), 100);
      } else if (state === 'ERROR' || state === 'IDLE') {
        if (this.currentVisualizer) {
          const ctx = this.canvas.getContext('2d');
          ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      }
    });

    document.addEventListener('visualizer-class-change', (e) => {
      this.setVisualizerClass(e.detail);
    });

    document.addEventListener('visualizer-mode-change', (e) => {
      if (this.currentVisualizer) {
        this.currentVisualizer.currentMode = e.detail;
        this.currentVisualizer.resetMode();
        store.setStorage('visualizerMode', e.detail);
      }
    });

    store.on('clear-visualizer', () => {
      if (this.currentVisualizer) {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    });
  }

  setVisualizerClass(className) {
    if (this.currentClass !== className) {
      this.currentClass = className;
      store.setStorage('visualizerClass', className);
      this.savedMode = 0;
      this.initVisualizer();
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initVisualizer();
    } else if (this.currentVisualizer) {
      this.currentVisualizer.destroy();
      this.currentVisualizer = null;
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  destroy() {
    if (this.currentVisualizer) {
      this.currentVisualizer.destroy();
      this.currentVisualizer = null;
    }
  }
}

class EnhancedApp {
  constructor() {
    this.store = store;
    this.visualizerManager = null;
    this.floatingPlayerManager = null;
    this.burgerMenu = null;
    this.displayMode = 'grid';
    this.displayModes = ['grid', 'list', 'compact', 'cover'];
    this.throttledResize = throttle(this.handleResize.bind(this), Config.ui.throttleResize || 250);
  }

 async init() {
  try {
    await initI18n();
    const savedLang = store.getStorage('lang', 'en');
    setLanguage(savedLang);

    await authManager.init();

    if (!document.querySelector('auth-panel')) {
      const authPanel = document.createElement('auth-panel');
      document.body.appendChild(authPanel);
    }

    if (!authManager.isAuthenticated) {
      console.log('🔐 Auth: ❌ Not authenticated — showing auth panel');
      document.querySelector('auth-panel')?.open();
    } else {
      console.log('🔐 Auth: ✅ Authenticated');
      console.log('👤 User:', authManager.user?.email);
      await dbSync.loadFromDB();
    }

    this.initializeComponents();
    this.setupEventListeners();
    this.loadLastState();
    this.setupKeyboardShortcuts();
    this.setupTheme();
    this.setupLayout();
    this.initVisualizer();
    this.setupMobileUI();

    requestIdleCallback(() => {
      this.setupHotkeysHelp();
      this.updatePlaylistsNav();
      this.loadFavoriteButton();
    });

    await this.registerServiceWorker();
    await this.createManifest();

    showToast(t('messages.appReady'), 'success', 2000);
    console.log('🔥 DeepRadio initialized successfully');
  } catch (error) {
    console.error('App initialization error:', error);
    showToast(t('messages.initError') || 'Ошибка инициализации приложения', 'error');
  }
}


  initializeComponents() {
    if (!this.floatingPlayerManager) {
      if (typeof FloatingPlayerManager !== 'undefined') {
        this.floatingPlayerManager = new FloatingPlayerManager();
      } else if (window.floatingPlayerManager) {
        this.floatingPlayerManager = window.floatingPlayerManager;
      }
    }

    if (window.burgerMenu) {
      this.burgerMenu = window.burgerMenu;
    }
  }

  setupMobileUI() {
    const isMobile = window.innerWidth <= 768;

    const settingsBtn = document.getElementById('settings-toggle');
    const changelogBtn = document.getElementById('changelog-toggle');
    const viewToggle = document.getElementById('view-toggle');

    if (isMobile) {
      if (settingsBtn) settingsBtn.style.display = 'none';
      if (changelogBtn) changelogBtn.style.display = 'none';
      if (viewToggle) viewToggle.style.display = 'flex';
    } else {
      if (settingsBtn) settingsBtn.style.display = '';
      if (changelogBtn) changelogBtn.style.display = '';
    }
  }

  setupEventListeners() {
    this.setupStoreEventListeners();
    this.setupDocumentEventListeners();
    this.setupAuthEventListeners();
    window.addEventListener('resize', this.throttledResize);
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  setupStoreEventListeners() {
    store.on('player-state-change', (e) => {
      // Handle player state changes
    });

    store.on('error', (e) => {
      const message = e.detail.message || t('messages.playbackError') || 'Ошибка воспроизведения';
      if (!message.includes('DEMUXER_ERROR')) {
        showToast(message, 'error');
      }
    });

    store.on('track-update', (e) => {
      if (e.detail && 'mediaSession' in navigator) {
        this.updateMediaSession(e.detail);
      }
    });

    store.on('edit-mode-change', (e) => {
      this.handleEditModeChange(e.detail);
    });
  }

  setupAuthEventListeners() {
    document.addEventListener('auth-changed', async (e) => {
      if (e.detail.authenticated) {
        console.log('🔐 User signed in:', e.detail.user?.email);
        await dbSync.loadFromDB();
        this.updatePlaylistsNav();
        showToast('✅ Signed in', 'success', 2000);
      } else {
        console.log('🔓 User signed out');
        this.cleanup();
        showToast('👋 Signed out', 'info', 2000);
      }
    });
  }

  setupDocumentEventListeners() {
    const settingsBtn = document.getElementById('settings-toggle');
    const viewToggle = document.getElementById('view-toggle');
    const changelogToggle = document.getElementById('changelog-toggle');

    settingsBtn?.addEventListener('click', () => {
      if (store.isEditMode()) {
        showToast(t('messages.finishEditing') || 'Сначала завершите редактирование', 'warning');
        return;
      }
      const settingsPanel = document.querySelector('settings-panel');
      if (settingsPanel) {
        if (settingsPanel.hasAttribute('open')) {
          settingsPanel.close();
        } else {
          settingsPanel.open();
        }
      }
    });

    changelogToggle?.addEventListener('click', () => {
      const changelogPanel = document.querySelector('changelog-panel');
      if (changelogPanel) {
        changelogPanel.style.display = 'block';
        setTimeout(() => changelogPanel.open(), 50);
      }
    });

    const addPlaylistBtn = document.getElementById('add-playlist');
    addPlaylistBtn?.addEventListener('click', () => {
      const playlistName = prompt(t('prompts.playlistName') || 'Введите название плейлиста:', '');
      if (playlistName && playlistName.trim()) {
        const playlistId = `playlist_${Date.now()}`;
        const newPlaylist = {
          id: playlistId,
          name: playlistName.trim(),
          stations: [],
          createdAt: Date.now()
        };
        store.playlists[playlistId] = newPlaylist;
        store.setStorage('playlists', store.playlists);
        this.updatePlaylistsNav();
        showToast(t('messages.playlistCreated') || 'Плейлист создан', 'success');
      }
    });

    viewToggle?.addEventListener('click', () => {
      if (store.isEditMode()) {
        showToast(t('messages.finishEditing') || 'Сначала завершите редактирование', 'warning');
        return;
      }
      this.cycleDisplayMode();
    });

    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (store.isEditMode()) {
          showToast(t('messages.finishEditing') || 'Сначала завершите редактирование', 'warning');
          return;
        }
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        store.setView(btn.dataset.view);
      });
    });

    document.addEventListener('display-mode-change', (e) => {
      this.displayMode = e.detail;
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', async (e) => {
      if (e.target.matches('input, textarea')) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          await store.toggle();
          break;
        case 'arrowleft':
          if (!e.shiftKey && !store.isEditMode()) {
            await store.step(-1);
          }
          break;
        case 'arrowright':
          if (!e.shiftKey && !store.isEditMode()) {
            await store.step(1);
          }
          break;
        case 'arrowup':
          e.preventDefault();
          store.setVolume(store.volume + 0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          store.setVolume(store.volume - 0.1);
          break;
        case 'm':
          store.toggleMute();
          break;
        case 'f':
          if (!e.ctrlKey && !e.metaKey && store.current) {
            store.toggleFavorite(store.current.id);
          }
          break;
        case 'escape':
          if (store.isEditMode()) {
            store.setEditMode(false);
            showToast(t('messages.editModeDisabled') || 'Режим редактирования отключен', 'info');
          }
          break;
      }
    });
  }

  initVisualizer() {
    const canvas = document.getElementById('viz');
    const isEnabled = store.getStorage('visualizerEnabled', true);
    if (canvas && isEnabled && !this.visualizerManager) {
      try {
        this.visualizerManager = new EnhancedVisualizerManager(canvas);
      } catch (e) {
        console.error('Failed to create visualizer manager:', e);
      }
    }
  }

  setupTheme() {
    const savedTheme = store.getStorage('theme', 'dark');
    const savedAccent = store.getStorage('accent', 'default');
    const animations = store.getStorage('animations', true);
    const compact = store.getStorage('compact', false);

    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.dataset.accent = savedAccent;
    document.body.classList.toggle('no-animations', !animations);
    document.body.classList.toggle('compact', compact);
  }

  setupLayout() {
    const headerLayout = store.getStorage('headerLayout', 'default');
    const playerStyle = store.getStorage('playerStyle', 'default');
    const centerElements = store.getStorage('centerElements', false);

    requestAnimationFrame(() => {
      this.applyHeaderLayout(headerLayout);
      this.applyPlayerStyle(playerStyle);
      document.body.classList.toggle('center-elements', centerElements);
    });
  }

  applyHeaderLayout(layout) {
    const header = document.querySelector('.app-header');
    if (!header) return;

    header.classList.remove('layout-default', 'layout-centered', 'layout-compact', 'layout-spacious');
    header.classList.add(`layout-${layout}`);
    document.documentElement.dataset.headerLayout = layout;
  }

  applyPlayerStyle(style) {
    const playerBar = document.querySelector('player-bar');
    if (!playerBar) return;

    playerBar.setAttribute('player-style', style);
    document.documentElement.dataset.playerStyle = style;
  }

  loadLastState() {
    const lastId = store.getStorage('last');
    const lastStation = store.stations.find(s => s.id === lastId);

    if (lastStation) {
      setTimeout(() => {
        const event = new CustomEvent('station-loaded', { detail: lastStation });
        document.dispatchEvent(event);
      }, 100);
    }

    const savedDisplay = store.getStorage('displayMode', 'grid');
    this.displayMode = savedDisplay;
    this.updateViewIcon();

    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('display-mode-change', { detail: savedDisplay }));
    }, 100);
  }

  cycleDisplayMode() {
    const currentIndex = this.displayModes.indexOf(this.displayMode);
    const nextIndex = (currentIndex + 1) % this.displayModes.length;
    this.displayMode = this.displayModes[nextIndex];
    this.updateViewIcon();

    document.dispatchEvent(new CustomEvent('display-mode-change', { detail: this.displayMode }));
    store.setStorage('displayMode', this.displayMode);
    showToast(`${t('display.viewPrefix')}: ${this.getDisplayModeName()}`, 'info', 1000);
  }

  updateViewIcon() {
    const viewToggle = document.getElementById('view-toggle');
    const icon = viewToggle?.querySelector('svg');
    if (icon) {
      const icons = {
        grid: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
        list: '<rect x="3" y="5" width="18" height="2"/><rect x="3" y="11" width="18" height="2"/><rect x="3" y="17" width="18" height="2"/>',
        compact: '<rect x="3" y="3" width="7" height="7"/><rect x="12" y="3" width="9" height="7"/><rect x="3" y="12" width="7" height="7"/><rect x="12" y="12" width="9" height="7"/>',
        cover: '<rect x="5" y="5" width="14" height="14" rx="2"/>'
      };
      icon.innerHTML = icons[this.displayMode] || icons.grid;
      icon.setAttribute('fill', 'currentColor');
    }
  }

  getDisplayModeName() {
    return t(`display.viewModes.${this.displayMode}`);
  }

  handleEditModeChange(enabled) {
    const ui = document.querySelector('.app-header');
    if (ui) {
      ui.classList.toggle('edit-mode', enabled);
    }
  }

  updateMediaSession(trackInfo) {
    if (!('mediaSession' in navigator)) return;

    const station = store.current;
    if (!station) return;

    if (trackInfo?.stationId && trackInfo.stationId !== station.id) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackInfo.song || station.name,
      artist: trackInfo.artist || 'DeepRadio',
      album: station.name,
      artwork: [
        { src: `/Icons/icon${station.id + 1}.png`, type: 'image/png', sizes: '192x192' },
        { src: `/Icons/icon${station.id + 1}.png`, type: 'image/png', sizes: '512x512' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => store.toggle());
    navigator.mediaSession.setActionHandler('pause', () => store.toggle());
    navigator.mediaSession.setActionHandler('previoustrack', () => store.step(-1));
    navigator.mediaSession.setActionHandler('nexttrack', () => store.step(1));
  }

  setupHotkeysHelp() {
    const help = document.getElementById('hotkeys-help');
    if (help) {
      help.innerHTML = `
        <h4>${t('hotkeys.title') || 'Горячие клавиши'}</h4>
        <p><kbd>Space</kbd> - ${t('hotkeys.playPause') || 'Воспроизведение/Пауза'}</p>
        <p><kbd>←/→</kbd> - ${t('hotkeys.prevNext') || 'Предыдущая/Следующая станция'}</p>
        <p><kbd>↑/↓</kbd> - ${t('hotkeys.volume') || 'Громкость'}</p>
        <p><kbd>M</kbd> - ${t('hotkeys.mute') || 'Отключить звук'}</p>
        <p><kbd>F</kbd> - ${t('hotkeys.favorite') || 'В избранное'}</p>
        <p><kbd>Esc</kbd> - ${t('hotkeys.exitEditMode') || 'Выход из режима редактирования'}</p>
      `;
    }
  }

  updatePlaylistsNav() {
    const container = document.getElementById('playlists-nav');
    const playlists = Object.values(store.playlists || {});

    if (container) {
      container.innerHTML = playlists.map(playlist => `
        <button class="nav-item" data-view="playlist-${playlist.id}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
          <span>${playlist.name}</span>
        </button>
      `).join('');
    }
  }

  loadFavoriteButton() {
    const favoritesBtn = document.querySelector('.nav-item[data-view="favorites"]');
    if (favoritesBtn) {
      favoritesBtn.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          if (store.view === 'favorites') {
            store.setEditMode(!store.isEditMode());
            showToast(store.isEditMode() ? t('messages.editModeEnabled') || 'Режим редактирования включен' : t('messages.editModeDisabled') || 'Режим редактирования выключен', 'info');
          } else {
            showToast(t('messages.openFavoritesFirst') || 'Сначала перейдите в раздел "Избранное"', 'warning');
          }
        }
      });
      favoritesBtn.title = 'Ctrl+Click для редактирования';
    }
  }

  handleResize() {
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.remove('medium', 'collapsed');
      }
    }
    this.setupMobileUI();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/server/sw.js');
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
    }
  }

  async createManifest() {
    const manifest = {
      name: 'DeepRadio',
      short_name: 'DeepRadio',
      description: t('app.description') || 'Современное интернет-радио с продвинутой визуализацией',
      start_url: '/',
      display: 'standalone',
      theme_color: '#08f7fe',
      background_color: '#0F172A',
      icons: [
        { src: '/Icons/icon192.png', sizes: '192x192', type: 'image/png' },
        { src: '/Icons/icon512.png', sizes: '512x512', type: 'image/png' }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/manifest+json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestUrl;
    document.head.appendChild(link);
  }

  cleanup() {
    if (this.visualizerManager) {
      this.visualizerManager.destroy();
    }
    if (this.floatingPlayerManager && typeof this.floatingPlayerManager.destroy === 'function') {
      this.floatingPlayerManager.destroy();
    }
    window.removeEventListener('resize', this.throttledResize);
  }

  getDebugInfo() {
    return {
      auth: {
        authenticated: authManager.isAuthenticated,
        user: authManager.user?.email
      },
      storeDebug: store.getDebugInfo ? store.getDebugInfo() : null,
      components: {
        visualizer: !!this.visualizerManager,
        floatingPlayer: !!this.floatingPlayerManager,
        burgerMenu: !!this.burgerMenu
      },
      displayMode: this.displayMode,
      isMobile: window.innerWidth <= 768
    };
  }
}

// Initialize app
window.debugRadio = () => {
  if (!window.app) {
    console.warn('DeepRadio app is not initialized yet. Please wait for DOMContentLoaded.');
    return null;
  }

  const debugInfo = window.app.getDebugInfo();
  console.log('🗄️ DeepRadio Debug Info:', debugInfo);
  return debugInfo;
};

console.log('🗄️ Database sync ready');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    window.app = new EnhancedApp();
    await window.app.init();
  }, { once: true });
} else {
  window.app = new EnhancedApp();
  window.app.init();
}

window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
});