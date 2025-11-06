import { store } from '../core/store.js';
import { t } from '../utils/i18n.js';

const escapeHTML = (str) => {
  if (typeof str !== 'string') return '';
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
};

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; position: fixed; bottom: 0; left: 0; right: 0; height: var(--total-player-height); padding-bottom: var(--safe-area-bottom); background: var(--surface); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border-top: 1px solid var(--border); z-index: 100; transition: var(--transition); }
    .player-container { height: var(--player-height); display: flex; align-items: center; padding: 0 max(1.5rem, var(--safe-area-left)) 0 max(1.5rem, var(--safe-area-right)); gap: 1.5rem; }
    .station-info { display: flex; align-items: center; gap: 1rem; min-width: 0; flex: 1; }
    .station-icon-wrapper { position: relative; flex-shrink: 0; cursor: pointer; border-radius: var(--radius); }
    .station-icon { width: 60px; height: 60px; border-radius: var(--radius); object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,.3); transition: var(--transition); display: block; }
    .fav-indicator { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; color: var(--accent3); background: rgba(0,0,0,0.5); border-radius: 50%; padding: 2px; display: none; pointer-events: none; transition: transform 0.2s, opacity 0.2s; opacity: 0; transform: scale(0.8); }
    .fav-indicator.is-favorite { display: block; transform: scale(1); opacity: 1; }
    .station-details { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: .25rem; overflow: hidden; }
    .station-name { font-size: 16px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .track-info { color: var(--text-secondary); font-size: 14px; overflow: hidden; white-space: nowrap; min-height: 1.2em; }
    .track-info.loading { opacity: 0.7; animation: pulse 1.5s ease-in-out infinite; }
    .track-info.buffering::after { content: ''; display: inline-block; width: 12px; height: 12px; margin-left: 8px; border: 2px solid transparent; border-top-color: var(--accent1); border-radius: 50%; animation: spin 1s linear infinite; vertical-align: middle; }
    @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.4; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .track-text-wrapper { display: inline-block; }
    .track-text-wrapper.marquee { animation: marquee 15s linear infinite; }
    @keyframes marquee { 0% { transform: translateX(0%); } 15% { transform: translateX(0%); } 85% { transform: translateX(calc(100% - 100vw)); } 100% { transform: translateX(calc(100% - 100vw)); } }
    .player-controls { display: flex; align-items: center; gap: 1rem; }
    .control-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: .5rem; border-radius: 50%; transition: var(--transition); display: flex; align-items: center; justify-content: center; }
    .control-btn:hover { background: var(--surface-hover); color: var(--text-primary); }
    .control-btn:active { transform: scale(.9); }
    .control-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .play-btn { width: 48px; height: 48px; background: var(--accent1); color: #000; }
    .play-btn:hover:not(:disabled) { background: var(--accent2); color: #000; box-shadow: 0 4px 12px rgba(8, 247, 254, 0.4); }
    .play-btn.loading svg { animation: rotate 1s linear infinite; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .volume-control { display: flex; align-items: center; gap: .75rem; min-width: 150px; }
    .volume-slider { -webkit-appearance: none; appearance: none; width: 100px; height: 4px; background: var(--surface-hover); border-radius: 2px; outline: none; cursor: pointer; }
    .volume-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: var(--accent1); border-radius: 50%; cursor: pointer; transition: transform 0.2s; }
    .volume-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
    .volume-slider::-moz-range-thumb { width: 16px; height: 16px; background: var(--accent1); border-radius: 50%; cursor: pointer; border: none; transition: transform 0.2s; }
    .volume-slider::-moz-range-thumb:hover { transform: scale(1.2); }
    :host([data-show-icon="false"]) .station-icon-wrapper { display: none !important; }
    :host([data-show-station-name="false"]) .station-name { display: none !important; }
    :host([data-show-track-info="false"]) .track-info { display: none !important; }
    :host([data-show-volume="false"]) .volume-control { display: none !important; }
    :host([data-show-play-button="false"]) .play-btn { display: none !important; }
    :host([data-show-step-buttons="false"]) .step-btn { display: none !important; }
    .settings-btn { display: none; }
    :host([data-show-settings-btn="true"]) .settings-btn { display: flex; margin-left: 0.5rem; }
    @media (max-width: 768px) { :host { height: var(--total-player-height-mobile); } .player-container { height: var(--player-height-mobile); padding: 0 1rem; gap: 0.75rem; } .station-icon { width: 50px; height: 50px; } .station-name { font-size: 14px; } .track-info { font-size: 12px; } .volume-control { display: none; } .step-btn { display: none !important; } .play-btn { width: 42px; height: 42px; } }
  </style>
  <div class="player-container">
    <div class="station-info">
      <div class="station-icon-wrapper">
        <img class="station-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" alt="Station logo">
        <svg class="fav-indicator" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </div>
      <div class="station-details">
     <div class="station-name"></div>
        <div class="track-info"><span class="track-text-wrapper"><span class="track-text"></span></span></div>
      </div>
    </div>
    <div class="player-controls">
      <button class="control-btn step-btn" data-step="-1" title="Предыдущая"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
      <button class="control-btn play-btn" title="Play/Pause"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
      <button class="control-btn step-btn" data-step="1" title="Следующая"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
    </div>
    <div class="volume-control">
      <button class="control-btn volume-btn" title="Громкость"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg></button>
      <input type="range" class="volume-slider" min="0" max="100" value="70">
    </div>
    <button class="control-btn settings-btn" title="Настройки плеера">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.47.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
    </button>
  </div>
`;

export class PlayerBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.elements = {
      stationIconWrapper: this.shadowRoot.querySelector('.station-icon-wrapper'),
      stationIcon: this.shadowRoot.querySelector('.station-icon'),
      favIndicator: this.shadowRoot.querySelector('.fav-indicator'),
      stationName: this.shadowRoot.querySelector('.station-name'),
      trackInfo: this.shadowRoot.querySelector('.track-info'),
      trackText: this.shadowRoot.querySelector('.track-text'),
      trackTextWrapper: this.shadowRoot.querySelector('.track-text-wrapper'),
      playBtn: this.shadowRoot.querySelector('.play-btn'),
      stepBtns: this.shadowRoot.querySelectorAll('.step-btn'),
      volumeSlider: this.shadowRoot.querySelector('.volume-slider'),
      volumeBtn: this.shadowRoot.querySelector('.volume-btn'),
      settingsBtn: this.shadowRoot.querySelector('.settings-btn')
    };
    this.marqueeTimer = null;
    this.currentState = 'IDLE';
    this.isPlaying = false;
    this.currentStation = null;
    this.bound = false;
    this.realPlayingState = false;
    this.pendingTrackData = null;
    this.stateUpdateDebounce = null;
  }

  connectedCallback() {
    if (!this.bound) {
      this.setupEventListeners();
      this.loadInitialState();
      this.bound = true;
        document.addEventListener('language-change', () => {
        if (this.pendingTrackData) {
          this.updateTrackText(this.pendingTrackData);
        }
      });
    }
  }

  disconnectedCallback() {
    if (this.marqueeTimer) clearTimeout(this.marqueeTimer);
    if (this.stateUpdateDebounce) clearTimeout(this.stateUpdateDebounce);
  }

  setupEventListeners() {
    this.elements.playBtn.addEventListener('click', async () => {
      try { await store.toggle(); } catch (e) { console.error('[PlayerBar] Toggle error:', e); }
    });

    this.elements.stepBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const step = Number(btn.dataset.step) || 0;
        if (step !== 0) {
          try { await store.step(step); } catch (e) { console.error('[PlayerBar] Step error:', e); }
        }
      });
    });

    this.elements.volumeSlider.addEventListener('input', (e) => {
      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
      this.elements.volumeSlider.value = String(val);
      store.setVolume(val / 100);
    });

    this.elements.volumeBtn.addEventListener('click', () => { store.toggleMute(); });
    this.elements.stationIconWrapper.addEventListener('click', () => {
      if (store.current) store.toggleFavorite(store.current.id);
    });

    // Settings button handler
    this.elements.settingsBtn.addEventListener('click', () => {
      this.openFloatingPlayerSettings();
    });

    store.on('station-changing', (e) => this.updateStation(e.detail, true));
    store.on('station-active', (e) => { this.updateStation(e.detail, false); });
    store.on('track-update', (e) => this.updateTrack(e.detail));
    store.on('favorites-change', () => this.updateFavoriteStatus());
    store.on('volume-change', (e) => this.updateVolume(e.detail));
    store.on('volume-sync', (v) => {
      const volume = typeof v.detail === 'number' ? v.detail : v;
      const val = Math.round(Math.max(0, Math.min(1, volume)) * 100);
      this.elements.volumeSlider.value = String(val);
    });
    store.on('player-state-change', (e) => this.handleStateChange(e.detail));
    store.on('ui-sync', (e) => this.handleUISync(e.detail));
  }

  handleStateChange({ state, previousState, data }) {
    if (this.stateUpdateDebounce) clearTimeout(this.stateUpdateDebounce);
    this.stateUpdateDebounce = setTimeout(() => {
      this.processStateChange(state, previousState, data);
    }, 50);
  }

  processStateChange(state, previousState, data) {
    this.currentState = state;

    switch (state) {
      case 'PLAYING':
        this.isPlaying = true;
        this.realPlayingState = true;
        this.clearStates();
        this.applyPendingTrackData();
        this.updatePlayButton();
        break;

      case 'PAUSED':
      case 'PAUSED_WAITING':
        this.isPlaying = false;
        this.realPlayingState = false;
        this.clearStates();
        this.updatePlayButton();
        break;

      case 'LOADING':
        this.isPlaying = false;
        if (!this.realPlayingState) this.showLoading();
        this.updatePlayButton();
        break;

      case 'BUFFERING':
      case 'WAITING':
        if (!this.realPlayingState) this.showBuffering();
        this.updatePlayButton();
        break;

      case 'SWITCHING':
        this.showLoading();
        this.updatePlayButton();
        break;

      case 'STALLED':
        if (!this.realPlayingState) this.showStalled();
        this.updatePlayButton();
        break;

      case 'RECOVERING':
        this.showRecovering();
        this.updatePlayButton();
        break;

      case 'ERROR':
        this.showError(data?.reason);
        this.isPlaying = false;
        this.realPlayingState = false;
        this.updatePlayButton();
        break;

      case 'IDLE':
        this.isPlaying = false;
        this.realPlayingState = false;
        this.clearStates();
        this.updatePlayButton();
        break;

      case 'READY':
        this.clearStates();
        this.applyPendingTrackData();
        this.updatePlayButton();
        break;
    }
  }

  handleUISync({ isPlaying, isPaused, isBuffering, isError, station, volume, muted, state }) {
    this.currentState = state || this.currentState;

    const wasPlaying = this.realPlayingState;
    this.isPlaying = !!isPlaying;
    this.realPlayingState = !!isPlaying;

    if (wasPlaying !== this.realPlayingState) this.updatePlayButton();
    if (typeof volume === 'number') {
      const safeVolume = Math.max(0, Math.min(1, volume));
      this.elements.volumeSlider.value = String(Math.round(safeVolume * 100));
      this.updateVolumeIcon(safeVolume, !!muted);
    }
    if (station && station !== this.currentStation) this.updateStation(station, false);
    if (this.realPlayingState) {
      this.clearStates();
      this.applyPendingTrackData();
      return;
    }
    if (isBuffering && !this.realPlayingState) this.showBuffering();
    else if (isError) this.showError('Ошибка подключения');
  }

  updateStation(station, isChanging = false) {
    if (!station) return;
    this.currentStation = station;
    this.elements.stationName.innerHTML = escapeHTML(station.name || 'Радио');
    const nextSrc = `/Icons/icon${(station.id ?? 0) + 1}.png`;
    if (this.elements.stationIcon.src !== nextSrc) this.elements.stationIcon.src = nextSrc;
    this.elements.stationIcon.alt = escapeHTML(station.name || 'Station');
    this.elements.stationIcon.onerror = () => {
      this.elements.stationIcon.src = '/Icons/default.png';
    };
    this.updateFavoriteStatus();
  }

  updateTrack(track) {
    const station = this.currentStation || store.current;
    if (!station) return;
    if (track.stationId && track.stationId !== station.id) return;

    if (['BUFFERING', 'LOADING', 'WAITING', 'SWITCHING'].includes(this.currentState) && !this.realPlayingState) {
      this.pendingTrackData = track;
      return;
    }

    this.applyTrackData(track);
  }

  applyTrackData(track) {
    const station = this.currentStation || store.current;
    if (!station) return;
    if (track.stationId && track.stationId !== station.id) return;

  let textToShow = station.name || t('player.selectStation');
    if (track) {
      if (track.loading) {
        textToShow = t('messages.loadingInfo');
      } else if (track.error || track.serverError) {
        if (track.artist && track.song) textToShow = `${track.artist} - ${track.song}`;
        else textToShow = station.name || t('player.selectStation');
      } else if (track.noData) {
        textToShow = station.name || t('player.onAir');
      } else if (track.artist && track.song) {
        textToShow = `${track.artist} - ${track.song}`;
      } else if (track.song) {
        textToShow = track.song;
      } else if (track.fallback) {
        textToShow = station.name || t('player.selectStation');
      }
    } else if (this.realPlayingState || this.currentState === 'PLAYING') {
      textToShow = station.name || t('player.onAir');
    }

    if (this.realPlayingState && (track.artist || track.song)) this.clearStates();
    this.elements.trackText.innerHTML = escapeHTML(textToShow);
    this.checkMarquee();
  }

  applyPendingTrackData() {
    if (this.pendingTrackData) {
      this.applyTrackData(this.pendingTrackData);
      this.pendingTrackData = null;
    }
  }

  updatePlayButton() {
    const icon = this.elements.playBtn.querySelector('svg');
    if (!icon) return;

    const isBuffering = ['LOADING', 'BUFFERING', 'WAITING'].includes(this.currentState);

    if (isBuffering && !this.realPlayingState) {
      this.elements.playBtn.classList.add('loading');
      icon.innerHTML = '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="60 10"/>';
    } else {
      this.elements.playBtn.classList.remove('loading');
      icon.innerHTML = this.realPlayingState
        ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
        : '<path d="M8 5v14l11-7z"/>';
    }
  }

  updateVolume({ volume, muted }) {
    const safeVolume = Math.max(0, Math.min(1, typeof volume === 'number' ? volume : store.volume));
    this.elements.volumeSlider.value = String(Math.round(safeVolume * 100));
    this.updateVolumeIcon(safeVolume, !!muted);
  }

  updateVolumeIcon(volume, muted) {
    const icon = this.elements.volumeBtn.querySelector('svg');
    if (!icon) return;
    const safeVolume = Math.max(0, Math.min(1, volume));

    if (muted || safeVolume === 0) {
      icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    } else if (safeVolume < 0.5) {
      icon.innerHTML = '<path d="M7 9v6h4l5 5V4l-5 5H7z"/>';
    } else {
      icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
    }
  }

  updateFavoriteStatus() {
    const isFav = this.currentStation && store.isFavorite(this.currentStation.id);
    this.elements.favIndicator.classList.toggle('is-favorite', !!isFav);
  }

  showLoading() {
    this.clearStates();
    this.elements.trackInfo.classList.add('loading');
     this.elements.trackText.textContent = t('messages.buffering');

  }
  showBuffering() {
    const audio = store.audioPool?.activeAudio;
    if (audio && !audio.paused && audio.readyState >= 3) {
      this.realPlayingState = true;
      this.clearStates();
      this.applyPendingTrackData();
      return;
    }
    if (this.realPlayingState) return;
    this.clearStates();
    this.elements.trackInfo.classList.add('buffering');
    this.elements.trackText.textContent = t('messages.buffering');
  }
  showStalled() {
    const audio = store.audioPool?.activeAudio;
    if (audio && !audio.paused && audio.readyState >= 3) {
      this.realPlayingState = true;
      this.clearStates();
      this.applyPendingTrackData();
      return;
    }
    this.clearStates();
    this.elements.trackInfo.classList.add('buffering');
    this.elements.trackText.textContent = t('messages.connectionProblem');
  }
  showRecovering() {
    const audio = store.audioPool?.activeAudio;
    if (audio && !audio.paused && audio.readyState >= 3) {
      this.realPlayingState = true;
      this.clearStates();
      this.applyPendingTrackData();
      return;
    }
    this.clearStates();
    this.elements.trackInfo.classList.add('buffering');
    this.elements.trackText.textContent = t('messages.retrying');
  }
  showError(reason) {
    this.clearStates();
    this.elements.trackInfo.classList.add('error');
    this.elements.trackText.textContent = reason || t('messages.errorPlaying');
  }

  clearStates() {
    this.elements.trackInfo.classList.remove('loading', 'buffering', 'error');
  }

  checkMarquee() {
    if (this.marqueeTimer) clearTimeout(this.marqueeTimer);
    const wrapper = this.elements.trackTextWrapper;
    wrapper.classList.remove('marquee');

    // Check if marquee is enabled via data attribute
    const marqueeEnabled = this.getAttribute('data-marquee-enabled') !== 'false';

    if (!marqueeEnabled) return;

    this.marqueeTimer = setTimeout(() => {
      const textElement = this.elements.trackText;
      const container = textElement.parentElement;
      if (textElement.scrollWidth > container.clientWidth) wrapper.classList.add('marquee');
    }, 250);
  }

  loadInitialState() {
    const volume = Math.max(0, Math.min(1, store.volume));
    this.elements.volumeSlider.value = String(Math.round(volume * 100));
    this.updateVolumeIcon(volume, store.isMuted);
    this.elements.stationName.textContent = t('player.selectStation');
    this.elements.trackText.textContent = t('messages.clickToPlay');
    const lastId = store.getStorage('last');
    const lastStation = store.stations.find(s => s.id === lastId);
    if (lastStation) this.updateStation(lastStation);
    this.updatePlayButton();
  }

  openFloatingPlayerSettings() {
    // Check if this is the first time opening settings
    const isFirstTime = !localStorage.getItem('deepradio_floating_settings_visited');

    if (isFirstTime) {
      // Show tutorial/tour
      this.showSettingsTour();
      localStorage.setItem('deepradio_floating_settings_visited', 'true');
    }

    // Open floating player settings panel
    const floatingPanel = document.querySelector('floating-player-panel');
    if (floatingPanel) {
      floatingPanel.open();
    }
  }

  showSettingsTour() {
    // Open settings panel first
    const settingsPanel = document.querySelector('settings-panel');
    if (settingsPanel) {
      settingsPanel.open();

      // Wait for panel to open, then scroll and highlight
      setTimeout(() => {
        const playerStyleSection = settingsPanel.shadowRoot?.querySelector('#player-style-section');
        const floatingPlayerSection = settingsPanel.shadowRoot?.querySelector('#floating-player-section');

        if (playerStyleSection) {
          // Scroll to Player Style section
          playerStyleSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Highlight with accent color
          playerStyleSection.style.outline = '2px solid var(--accent1)';
          playerStyleSection.style.outlineOffset = '4px';
          playerStyleSection.style.borderRadius = '12px';
          playerStyleSection.style.transition = 'all 0.3s ease';

          setTimeout(() => {
            if (floatingPlayerSection) {
              // Scroll to Floating Player section
              floatingPlayerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

              // Highlight Floating Player section
              floatingPlayerSection.style.outline = '2px solid var(--accent1)';
              floatingPlayerSection.style.outlineOffset = '4px';
              floatingPlayerSection.style.borderRadius = '12px';
              floatingPlayerSection.style.transition = 'all 0.3s ease';

              // Remove highlights after a while
              setTimeout(() => {
                playerStyleSection.style.outline = '';
                playerStyleSection.style.outlineOffset = '';
                floatingPlayerSection.style.outline = '';
                floatingPlayerSection.style.outlineOffset = '';

                // Close settings panel and open floating player panel
                settingsPanel.close();
                setTimeout(() => {
                  const floatingPanel = document.querySelector('floating-player-panel');
                  if (floatingPanel) {
                    floatingPanel.open();
                  }
                }, 300);
              }, 2000);
            }
          }, 1500);
        }
      }, 300);
    }
  }
}


customElements.define('player-bar', PlayerBar);