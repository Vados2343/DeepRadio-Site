import { stations as defaultStations } from '../data/stations.js';
import { showToast } from '../utils/toast.js';
import { t } from '../utils/i18n.js';
import { PlayerStateMachine, PlayerStates } from './PlayerStateMachine.js';
import { AudioPoolManager } from './AudioPoolManager.js';
import { Config, getStorageKey, isEpisodicStation } from './config.js';
import { metadataService } from './MetadataService.js';
import { logger } from './Logger.js';

const isDebugEnabled = () => {
  try {
    return localStorage.getItem('deepradio_debug') === '1';
  } catch {
    return false;
  }
};

class Store extends EventTarget {
  constructor() {
    super();
    this.stations = Array.isArray(defaultStations) ? [...defaultStations] : [];
    this.loadCustomStations();
    this.current = null;
    this.currentTrack = null;
    this.favorites = this.getStorage('favorites', []);
    this.recent = this.getStorage('recent', []);
    this.playlists = this.getStorage('playlists', {});
    this.view = 'all';
    this.filter = '';
    this.audioContext = null;
    this.analyserNode = null;
    this.currentSourceNode = null;

    this.playerFSM = new PlayerStateMachine({
      onStateChange: this.handleFSMStateChange.bind(this),
      onError: this.handleFSMError.bind(this)
    });

    const storedVolume = this.getStorage('volume', 0.7);
    this.volume = Math.max(0, Math.min(1, Number(storedVolume) || 0.7));
    this.isMuted = false;
    this.previousVolume = this.volume;

    this.initializeAudioContext();

    this.audioPool = new AudioPoolManager({
      poolSize: Config.audio.poolSize,
      fadeTime: Config.audio.fadeTime,
      audioContext: this.audioContext,
      onStateChange: this.handlePoolStateChange.bind(this),
      onDiagnostic: this.handlePoolDiagnostic.bind(this)
    });

    // Добавляем обертку метода play для AudioPoolManager
    this.audioPool.play = async (stationId, url) => {
      const station = this.stations.find(s => s.id === stationId);
      if (!station) {
        throw new Error('Station not found');
      }
      const opId = this.nextOpId();
      return this.audioPool.switchToStation(station, url, this.volume, opId);
    };

    this.trackBuffer = this.getStorage('trackBuffer', {});
    this.trackCache = this.getStorage('trackCache', {});
    this.listeningStats = this.getStorage('listeningStats', {
      sessions: [],
      genres: {},
      stations: {},
      totalTime: 0,
      lastUpdated: Date.now(),
      dailyStats: {}
    });

    this.sessionStartTime = null;
    this.currentSessionId = null;
    this.currentSessionData = null;
    this.sessionPauseTime = null;
    this.totalPausedTime = 0;
    this.trackUpdateTimer = null;
    this.trackUpdateInterval = 30000;
    this.trackUpdateRetries = 0;
    this.lastTrackId = null;
    this.editMode = false;
    this.pendingStationSwitch = null;
    this.isProcessingAction = false;
    this.loadingTimeoutId = null;
    this.hlsFailedStations = this.getStorage('hlsFailedStations', []);
    this.stationRetryCount = new Map();
    this.isActuallyPlaying = false;
    this.lastKnownState = PlayerStates.IDLE;
    this.forcePlayAfterLoad = false;

    this.desired = { stationId: null, mode: 'stopped', opId: 0 };
    this.transitionGraceUntil = 0;
    this.lastSwitchTime = 0;

    this.likePromptTimer = null;
    this.likePromptShown = new Set();
    this.likePromptsDisabled = this.getStorage('likePromptsDisabled', false);
    this.sessionLikes = new Map();
    this.notificationDebounce = new Map();
    this.stateTransitionLock = false;
    this.retryTimer = null;

    this.lastToggleTime = 0;
    this.toggleDebounceTime = 500;

    this.lastStateChangeTime = 0;
    this.stateChangeDebounce = 50;

    this.playingStationId = null;
    this.isBufferingState = false;

    this.setupNetworkHandlers();
    this.setupVisibilityHandlers();
    this.audioPool.setVolume(this.volume);

    logger.setSessionId(`session_${Date.now()}`);
    logger.log('Store', 'Initialized');
  }

  nextOpId() {
    this.desired.opId = (this.desired.opId || 0) + 1;
    if (isDebugEnabled()) {
      logger.log('OpId', 'Generated new opId', this.desired.opId);
    }
    return this.desired.opId;
  }

  setDesired(mode, stationId) {
    const opId = this.nextOpId();
    this.desired = {
      stationId: stationId ?? this.desired.stationId ?? this.current?.id ?? null,
      mode,
      opId
    };
    if (isDebugEnabled()) {
      logger.log('Desired', 'update', this.desired);
    }
    return opId;
  }

  initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.85;

      // Подключаем analyser к master gain из audioPool при его инициализации
      setTimeout(() => {
        if (this.audioPool && this.audioPool.masterGain && this.analyserNode) {
          try {
            this.audioPool.masterGain.connect(this.analyserNode);
            this.analyserNode.connect(this.audioContext.destination);
          } catch (e) {
            logger.error('Store', 'Failed to connect analyser', e);
          }
        }
      }, 100);
    } catch (error) {
      logger.error('Store', 'Failed to initialize audio context', error);
    }
  }

  getBufferAhead(audio) {
    if (!audio || !audio.buffered || audio.buffered.length === 0) return 0;
    try {
      for (let i = 0; i < audio.buffered.length; i++) {
        const start = audio.buffered.start(i);
        const end = audio.buffered.end(i);
        if (audio.currentTime >= start && audio.currentTime <= end) {
          return end - audio.currentTime;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  }

  clearLoadingTimeout() {
    if (this.loadingTimeoutId) {
      clearTimeout(this.loadingTimeoutId);
      this.loadingTimeoutId = null;
    }
  }

  setLoadingTimeout(callback, duration = 25000) {
    this.clearLoadingTimeout();

    this.loadingTimeoutId = setTimeout(() => {
      this.loadingTimeoutId = null;
      this.isProcessingAction = false;

      if (callback) callback();
    }, duration);
  }

  handleFSMStateChange(stateChange) {
    if (this.stateTransitionLock) return;

    const now = Date.now();
    if (now - this.lastStateChangeTime < this.stateChangeDebounce) {
      if (stateChange.to !== PlayerStates.PLAYING && stateChange.to !== PlayerStates.ERROR) {
        return;
      }
    }
    this.lastStateChangeTime = now;

    this.lastKnownState = stateChange.to;

    if (isDebugEnabled()) {
      logger.fsmTransition(stateChange.from, stateChange.to, stateChange.event, stateChange.payload);
    }

    this.emit('player-state-change', {
      state: stateChange.to,
      previousState: stateChange.from,
      data: stateChange.payload,
      metadata: stateChange.metadata
    });

    const isBuffering = ['LOADING', 'BUFFERING', 'WAITING'].includes(stateChange.to);
    this.isBufferingState = isBuffering;

    switch (stateChange.to) {
      case PlayerStates.PLAYING:
        this.isActuallyPlaying = true;
        this.playingStationId = this.current?.id || null;
        this.clearLoadingTimeout();
        this.emit('play');
        this.emitUISync();
        if (!this.currentSessionId) this.startSession();
        else if (this.sessionPauseTime) this.resumeSession();
        this.startTrackUpdates();
        this.startLikePromptTimer();
        if (isDebugEnabled()) {
          logger.metric('session_start', Date.now());
        }
        break;

      case PlayerStates.PAUSED:
      case PlayerStates.PAUSED_WAITING:
        this.isActuallyPlaying = false;
        this.playingStationId = null;
        this.clearLoadingTimeout();
        this.emit('pause');
        this.emitUISync();
        this.clearLikePromptTimer();
        this.pauseSession();
        this.stopTrackUpdates();
        break;

      case PlayerStates.WAITING:
       this.showNotification('buffering', '⏳ ' + t('messages.buffering'), 'info', 2000);
        this.emitUISync();
        break;

      case PlayerStates.RETRYING:
        this.clearRetryTimer();
        this.showNotification('retrying', t('messages.retrying'), 'info', 2000);
        this.retryTimer = setTimeout(() => {
          if (this.playerFSM.isInState(PlayerStates.RETRYING) && this.current) {
            this.playerFSM.transition('LOAD');
            this.play(this.current);
          }
        }, 1000);
        break;

      case PlayerStates.ERROR:
        this.isActuallyPlaying = false;
        this.playingStationId = null;
        this.clearLikePromptTimer();
        this.clearLoadingTimeout();
        this.isProcessingAction = false;
        this.emitUISync();

        const errorMessage = stateChange.payload?.reason || 'Ошибка воспроизведения';
        logger.error('FSM', errorMessage, stateChange.payload?.error);

        if (this.playerFSM.isRetryable()) {
          setTimeout(() => {
            if (this.playerFSM.isInState(PlayerStates.ERROR)) {
              this.playerFSM.transition('RETRY');
            }
          }, 2000);
        } else {
          this.emit('error', { message: errorMessage, recoverable: false });
        }

        this.stopTrackUpdates();
        break;

      case PlayerStates.STALLED:
        if (isDebugEnabled()) {
          logger.metric('stall_count', (stateChange.metadata?.stallCount || 0));
        }
        if (stateChange.metadata?.stallCount > 2) {
         this.showNotification('connection-problem', t('messages.connectionProblem'), 'warning', 3000);
        }
        this.emitUISync();
        break;

      case PlayerStates.SWITCHING:
        this.isActuallyPlaying = false;
        this.emitUISync();
        break;

      case PlayerStates.IDLE:
        this.isActuallyPlaying = false;
        this.playingStationId = null;
        this.emitUISync();
        break;

      case PlayerStates.LOADING:
      case PlayerStates.BUFFERING:
        this.emitUISync();
        break;
    }
  }

  emitUISync() {
    this.emit('ui-sync', {
      isPlaying: this.isActuallyPlaying,
      isPaused: this.playerFSM.isInStates(PlayerStates.PAUSED, PlayerStates.PAUSED_WAITING),
      isBuffering: this.isBufferingState,
      isError: this.playerFSM.isInState(PlayerStates.ERROR),
      station: this.current,
      volume: this.volume,
      muted: this.isMuted,
      state: this.lastKnownState
    });
  }

  handleFSMError(error) {
    logger.error('FSM', 'State machine error', error);
  }

  clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  handlePoolStateChange(event) {
    if (isDebugEnabled()) {
      logger.audioEvent(event.type, {
        index: event.index,
        state: event.state,
        stationId: event.stationId
      });
    }
    const isActiveAudio = event.index === this.audioPool.activeIndex;

    if (event.state === 'paused' && !isActiveAudio) {
      logger.log('Store', 'Ignoring pause from inactive audio', { index: event.index, activeIndex: this.audioPool.activeIndex });
      return;
    }

    switch (event.state) {
      case 'loaded':
        if (this.playerFSM.canTransition('LOADED')) {
          this.playerFSM.transition('LOADED');
        }
        break;

      case 'ready':
        if (this.playerFSM.canTransition('READY')) {
          this.playerFSM.transition('READY');
        }
        break;

      case 'playing':
        if (this.playerFSM.canTransition('PLAY') || this.playerFSM.canTransition('FORCE')) {
          if (!this.playerFSM.isInState(PlayerStates.PLAYING)) {
            this.playerFSM.transition('PLAY');
          }
        }
        break;

      case 'paused':
        if (event.audio && !event.audio.ended) {
          if (this.playerFSM.canTransition('PAUSE')) {
            this.playerFSM.transition('PAUSE');
          }
        }
        break;

      case 'waiting':
        if (this.playerFSM.canTransition('WAITING')) {
          this.playerFSM.transition('WAITING');
        }
        break;

      case 'stalled':
        if (this.playerFSM.canTransition('STALLED')) {
          this.playerFSM.transition('STALLED');
        }
        break;

      case 'error':
        if (this.playerFSM.canTransition('ERROR')) {
          this.playerFSM.transition('ERROR', {
            reason: event.error?.message || 'Ошибка загрузки станции',
            error: event.error
          });
        }
        break;
    }
  }

  handlePoolDiagnostic(diagnostic) {
    if (isDebugEnabled()) {
      logger.log('PoolDiagnostic', diagnostic.type, diagnostic);
    }

    // Обрабатываем диагностические сообщения от AudioPool
    switch (diagnostic.type) {
      case 'recovery-started':
        this.showNotification('recovery', diagnostic.message, 'info', 2000);
        break;
      case 'recovery-success':
        this.showNotification('recovery', diagnostic.message, 'success', 2000);
        break;
      case 'recovery-failed':
        this.showNotification('recovery', diagnostic.message, 'error', 3000);
        break;
      case 'network-offline':
        this.showNotification('offline', diagnostic.message, 'warning', 5000);
        break;
    }
  }

  setupNetworkHandlers() {
    window.addEventListener('online', () => {
      logger.log('Network', 'Online');
      if (this.current && this.playerFSM.isInState(PlayerStates.ERROR)) {
        setTimeout(() => {
          if (this.playerFSM.isInState(PlayerStates.ERROR)) {
            this.play(this.current);
          }
        }, 1000);
      }
    });

    window.addEventListener('offline', () => {
      logger.log('Network', 'Offline');
     this.showNotification('offline', '📡 Отсутствует подключение к интернету', 'warning', 5000);
    });
  }

  setupVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        logger.log('Visibility', 'Hidden');
      } else {
        logger.log('Visibility', 'Visible');
      const currentState = this.playerFSM.getState();

        const pausedStates = ['PAUSED', 'PAUSED_WAITING', 'ERROR', 'IDLE'];

        const isManuallyPaused = pausedStates.includes(currentState);



        if (this.current && this.isActuallyPlaying && !isManuallyPaused) {}
      }
    });
  }

  syncAudioState() {
    const audio = this.audioPool.getActiveAudio();
    if (audio) {
      const actuallyPlaying = !audio.paused && audio.readyState >= 2;
      if (this.isActuallyPlaying !== actuallyPlaying) {
        this.isActuallyPlaying = actuallyPlaying;
        this.playingStationId = actuallyPlaying ? this.current?.id : null;
        this.emitUISync();
      }
    }
  }

  showNotification(key, message, type = 'info', duration = 3000) {
    const lastNotification = this.notificationDebounce.get(key);
    const now = Date.now();

    if (lastNotification && (now - lastNotification) < 5000) {
      return;
    }

    this.notificationDebounce.set(key, now);
    showToast(message, type, duration);
  }

  async play(station) {
    if (!station || this.isProcessingAction) return;

    this.isProcessingAction = true;
    this.clearLoadingTimeout();

    try {
      const isSameStation = this.current?.id === station.id;

      // Если та же станция уже играет, ничего не делаем
      if (this.playerFSM.isInStates(PlayerStates.PLAYING, PlayerStates.BUFFERING, PlayerStates.WAITING) && isSameStation) {
        this.isProcessingAction = false;
        return;
      }

      logger.log('Store', 'Play', { station: station.name, isSame: isSameStation });

     if (!isSameStation) {
        this.stopTrackUpdates();
        this.clearLikePromptTimer();

        if (this.currentSessionId) {
          this.endSession();
        }

        this.current = station;
        this.currentTrack = null;
        this.lastTrackId = null;
        this.addToRecent(station.id);

        this.setStorage('last', station.id);

        this.emit('station-changing', station);

        if (this.playerFSM.canTransition('SWITCH')) {
          this.playerFSM.transition('SWITCH');
        }
      }

      if (this.playerFSM.canTransition('LOAD')) {
        this.playerFSM.transition('LOAD');
      }

      const opId = this.setDesired('playing', station.id);

      this.emit('station-active', station);

      // Используем switchToStation напрямую с правильными параметрами
      await this.audioPool.switchToStation(station, station.url, this.volume, opId);

      this.startTrackUpdates();

      this.setLoadingTimeout(() => {
        if (!this.playerFSM.isInState(PlayerStates.PLAYING)) {
          logger.error('Store', 'Load timeout', { station: station.name });
          if (this.playerFSM.canTransition('ERROR')) {
            this.playerFSM.transition('ERROR', {
              reason: 'Превышено время ожидания загрузки'
            });
          }
        }
      }, Config.audio.loadTimeout);

    } catch (error) {
      logger.error('Store', 'Play error', error);
      if (this.playerFSM.canTransition('ERROR')) {
        this.playerFSM.transition('ERROR', {
          reason: error.message || 'Ошибка воспроизведения',
          error
        });
      }
    } finally {
      this.isProcessingAction = false;
    }
  }

  async ensurePlaying(station) {
    if (!station) station = this.current;
    if (!station) return;

    if (this.playerFSM.isInState(PlayerStates.PLAYING)) {
      return;
    }

    if (this.playerFSM.isInStates(PlayerStates.PAUSED, PlayerStates.PAUSED_WAITING, PlayerStates.READY)) {
      try {
        await this.audioPool.resume();
      } catch (error) {
        logger.error('Store', 'Resume error', error);
        await this.play(station);
      }
    } else {
      await this.play(station);
    }
  }

  async ensurePaused() {
    if (this.playerFSM.isInStates(PlayerStates.PAUSED, PlayerStates.PAUSED_WAITING)) {
      return;
    }

    if (this.playerFSM.isInStates(PlayerStates.PLAYING, PlayerStates.BUFFERING, PlayerStates.WAITING)) {
      this.audioPool.pause();
    }
  }

  async toggle() {
    const now = Date.now();
    if (now - this.lastToggleTime < this.toggleDebounceTime) {
      logger.log('Store', 'Toggle debounced');
      return;
    }
    this.lastToggleTime = now;

    if (!this.current) {
      const lastId = this.getStorage('last');
      const lastStation = this.stations.find(s => s.id === lastId);
      if (lastStation) {
        await this.play(lastStation);
      } else if (this.stations.length > 0) {
        await this.play(this.stations[0]);
      }
      return;
    }

    if (this.playerFSM.isInState(PlayerStates.PLAYING)) {
      await this.ensurePaused();
    } else {
      await this.ensurePlaying(this.current);
    }
  }

  async step(direction) {
    if (!this.current) {
      if (this.stations.length > 0) {
        await this.play(this.stations[0]);
      }
      return;
    }

    const currentIndex = this.stations.findIndex(s => s.id === this.current.id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) nextIndex = this.stations.length - 1;
    if (nextIndex >= this.stations.length) nextIndex = 0;

    const nextStation = this.stations[nextIndex];
    if (nextStation) {
      await this.play(nextStation);
    }
  }

  stop() {
    this.audioPool.pause();
    this.stopTrackUpdates();
    this.clearLikePromptTimer();
    this.endSession();

    if (this.playerFSM.canTransition('STOP')) {
      this.playerFSM.transition('STOP');
    }

    this.current = null;
    this.currentTrack = null;
    this.lastTrackId = null;
  }

  setVolume(volume) {
    const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    this.volume = safeVolume;
    this.audioPool.setVolume(safeVolume);
    this.setStorage('volume', safeVolume);

    this.emit('volume-change', { volume: safeVolume, muted: this.isMuted });

    if (safeVolume > 0 && this.isMuted) {
      this.isMuted = false;
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.isMuted = false;
      this.setVolume(this.previousVolume);
    } else {
      this.isMuted = true;
      this.previousVolume = this.volume;
      this.audioPool.setVolume(0);
    }

    this.emit('volume-change', { volume: this.volume, muted: this.isMuted });
  }

  emit(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.dispatchEvent(event);

    const listeners = this._eventListeners?.[eventName];
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in ${eventName} listener:`, error);
        }
      });
    }
  }

  on(eventName, callback) {
    if (!this._eventListeners) this._eventListeners = {};
    if (!this._eventListeners[eventName]) this._eventListeners[eventName] = [];
    this._eventListeners[eventName].push(callback);
    this.addEventListener(eventName, callback);
  }

  off(eventName, callback) {
    this.removeEventListener(eventName, callback);
    if (this._eventListeners?.[eventName]) {
      const index = this._eventListeners[eventName].indexOf(callback);
      if (index > -1) {
        this._eventListeners[eventName].splice(index, 1);
      }
    }
  }

  getStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(getStorageKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setStorage(key, value) {
    try {
      localStorage.setItem(getStorageKey(key), JSON.stringify(value));
    } catch (error) {
      logger.error('Store', 'setStorage error', error);
    }
  }

  // Остальные методы остаются без изменений...

  startLikePromptTimer() {
    if (this.likePromptsDisabled) return;

    this.clearLikePromptTimer();

    this.likePromptTimer = setTimeout(() => {
      if (!this.current || !this.isActuallyPlaying) return;

      const stationId = this.current.id;

      if (this.likePromptShown.has(stationId) || this.sessionLikes.get(stationId)) {
        return;
      }

      if (!store.isFavorite(stationId)) {
        this.likePromptShown.add(stationId);
      let displayName = this.current.name;
        if (this.currentTrack && this.currentTrack.artist && this.currentTrack.song) {
          displayName = `${this.currentTrack.artist} - ${this.currentTrack.song}`;
        }
        const notification = showToast(
           `${t('messages.likePrompt')} "${displayName}"? 💖`,
          'info',
          0,
          {
            actions: [
              {
                text: t('messages.addToFavoritesAction'),

                onClick: () => {
                  store.toggleFavorite(stationId);
                  this.sessionLikes.set(stationId, true);
                  showToast(`"${this.current.name}" ${t('messages.addedToFavorites')}`, 'success');
                }
              },
              {
                text: t('messages.noMorePrompts'),
                onClick: () => {
                  this.likePromptsDisabled = true;
                  this.setStorage('likePromptsDisabled', true);
                showToast(t('messages.hintsDisabled'), 'info');
                }
              }
            ]
          }
        );
      }
    }, Config.ui.likePromptDelay || 60000);
  }

  clearLikePromptTimer() {
    if (this.likePromptTimer) {
      clearTimeout(this.likePromptTimer);
      this.likePromptTimer = null;
    }
  }

  startSession() {
    if (!this.current) return;

    this.currentSessionId = `session_${Date.now()}_${this.current.id}`;
    this.sessionStartTime = Date.now();
    this.totalPausedTime = 0;
    this.sessionPauseTime = null;
     const currentTrack = this.currentTrack && this.currentTrack.artist && this.currentTrack.song ? {
      id: `${this.currentTrack.artist}_${this.currentTrack.song}`,
      artist: this.currentTrack.artist,
      song: this.currentTrack.song
    } : null;
    this.currentSessionData = {
      id: this.currentSessionId,
      stationId: this.current.id,
      stationName: this.current.name,
      startTime: this.sessionStartTime,
      endTime: null,
      duration: 0,
      pausedTime: 0,
      track: currentTrack,
      tracks: [],
      genres: this.current.tags || []
    };
    logger.log('Session', 'Started', {
      sessionId: this.currentSessionId,
      station: this.current.name,
      track: currentTrack
    });
     this.emit('stats-update');
  }

  pauseSession() {
    if (!this.sessionStartTime || this.sessionPauseTime) return;

    this.sessionPauseTime = Date.now();

    logger.log('Session', 'Paused', {
      sessionId: this.currentSessionId
    });
  }

  resumeSession() {
    if (!this.sessionPauseTime) return;

    const pauseDuration = Date.now() - this.sessionPauseTime;
    this.totalPausedTime += pauseDuration;
    this.sessionPauseTime = null;

    logger.log('Session', 'Resumed', {
      sessionId: this.currentSessionId,
      pauseDuration
    });
  }

 endSession() {
    if (!this.currentSessionId || !this.sessionStartTime) return;

    if (this.sessionPauseTime) {
      const pauseDuration = Date.now() - this.sessionPauseTime;
      this.totalPausedTime += pauseDuration;
      this.sessionPauseTime = null;
    }

    const endTime = Date.now();
    const totalTime = Math.floor((endTime - this.sessionStartTime - this.totalPausedTime) / 1000);

    this.currentSessionData.endTime = endTime;
    this.currentSessionData.duration = totalTime;
    this.currentSessionData.pausedTime = this.totalPausedTime;
     this.currentSessionData.time = totalTime;
    this.currentSessionData.timestamp = this.sessionStartTime;
     console.log('[Session] Ending session with data:', {
      station: this.currentSessionData.stationName,
      track: this.currentSessionData.track,
      tracksCount: this.currentSessionData.tracks?.length || 0,
      tracks: this.currentSessionData.tracks
    });

    const stats = this.getStorage('listeningStats', {
      sessions: [],
      genres: {},
      stations: {},
      totalTime: 0,
      lastUpdated: Date.now(),
      dailyStats: {}
    });
    stats.sessions.push(this.currentSessionData);
    stats.totalTime += totalTime;
    stats.lastUpdated = Date.now();
     if (!stats.stations[this.current.id]) {
      stats.stations[this.current.id] = {
        name: this.current.name,
        time: 0,
        sessions: 0
      };
    }
    stats.stations[this.current.id].time += totalTime;
    stats.stations[this.current.id].sessions += 1;
    if (this.current.tags && Array.isArray(this.current.tags)) {
      this.current.tags.forEach(genre => {
        if (!stats.genres[genre]) {
          stats.genres[genre] = 0;
        }
        stats.genres[genre] += totalTime;
      });
    }
   const date = new Date(this.sessionStartTime);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!stats.dailyStats[dateStr]) {
      stats.dailyStats[dateStr] = {
        time: 0,
        sessions: []
      };
    }
    stats.dailyStats[dateStr].time += totalTime;
    stats.dailyStats[dateStr].sessions.push({
      ...this.currentSessionData,
      date: dateStr
    });
    this.setStorage('listeningStats', stats);

    logger.log('Session', 'Ended', {
      sessionId: this.currentSessionId,
      totalTime,
      pausedTime: this.totalPausedTime
    });

    this.currentSessionId = null;
    this.sessionStartTime = null;
    this.totalPausedTime = 0;
    this.sessionPauseTime = null;
    this.currentSessionData = null;
     this.emit('stats-update');
  }
 getCurrentSession() {
    if (!this.currentSessionData || !this.sessionStartTime) {
      return null;
    }
    const currentTime = Date.now();
    const pausedTime = this.sessionPauseTime
      ? this.totalPausedTime + (currentTime - this.sessionPauseTime)
      : this.totalPausedTime;
    const duration = Math.floor((currentTime - this.sessionStartTime - pausedTime) / 1000);
    return {
      ...this.currentSessionData,
      duration,
      time: duration,
      pausedTime,
      isActive: true
    };
  }
  startTrackUpdates() {
    this.stopTrackUpdates();

    this.updateCurrentTrack();

    const interval = isEpisodicStation(this.current)
      ? Config.metadata.episodicTTL
      : Config.metadata.updateInterval;

    this.trackUpdateTimer = setInterval(() => {
      this.updateCurrentTrack();
    }, interval);

    logger.log('Track', 'Updates started', {
      station: this.current?.name,
      interval
    });
  }

  stopTrackUpdates() {
    if (this.trackUpdateTimer) {
      clearInterval(this.trackUpdateTimer);
      this.trackUpdateTimer = null;
      logger.log('Track', 'Updates stopped');
    }
  }

  async updateCurrentTrack() {
    if (!this.current) return;

    try {
      const trackData = await metadataService.getTrackMeta(this.current);

      if (!trackData) return;

      trackData.stationId = this.current.id;

      const trackId = `${trackData.artist}_${trackData.song}`;
      const hasChanged = trackId !== this.lastTrackId;

      if (hasChanged || !this.currentTrack) {
        this.lastTrackId = trackId;
        this.currentTrack = trackData;

        this.trackBuffer[this.current.id] = {
          ...trackData,
          timestamp: Date.now()
        };
        this.setStorage('trackBuffer', this.trackBuffer);

        this.trackCache[this.current.id] = trackData;
        this.setStorage('trackCache', this.trackCache);

        this.emit('track-update', trackData);
        this.emit('track-change', this.current);
         if (this.currentSessionData && trackData.artist && trackData.song) {
          this.currentSessionData.track = {
            id: trackId,
            artist: trackData.artist,
            song: trackData.song
          };
          this.currentSessionData.tracks.push({
            artist: trackData.artist,
            song: trackData.song,
            timestamp: Date.now()
          });
        }
        logger.log('Track', 'Updated', {
          station: this.current.name,
          artist: trackData.artist,
          song: trackData.song
        });
      } else {
        this.emit('track-update', trackData);
      }

      this.trackUpdateRetries = 0;

    } catch (error) {
      logger.error('Track', 'Update failed', error);

      this.trackUpdateRetries++;

      const cached = this.trackCache[this.current.id] || this.trackBuffer[this.current.id];

      if (cached) {
        this.emit('track-update', {
          ...cached,
          stationId: this.current.id,
          serverError: true
        });
      } else {
        this.emit('track-update', {
          stationId: this.current.id,
          artist: this.current.name,
          song: 'В эфире',
          fallback: true,
          error: true
        });
      }

      if (this.trackUpdateRetries > 3) {
        this.stopTrackUpdates();
        setTimeout(() => {
          if (this.isActuallyPlaying && this.current) {
            this.startTrackUpdates();
          }
        }, Config.metadata.maxUpdateInterval);
      }
    }
  }

  loadCustomStations() {
    try {
      const custom = this.getStorage('customStations', []);
      if (Array.isArray(custom) && custom.length > 0) {
        const maxId = Math.max(...this.stations.map(s => s.id), 0);
        custom.forEach((station, index) => {
          if (!this.stations.find(s => s.id === station.id)) {
            this.stations.push({
              ...station,
              id: station.id || maxId + index + 1,
              custom: true
            });
          }
        });
        logger.log('Store', 'Custom stations loaded', { count: custom.length });
      }
    } catch (error) {
      logger.error('Store', 'Failed to load custom stations', error);
    }
  }

  getFilteredStations() {
    let filtered = [...this.stations];

    if (this.view === 'favorites') {
      filtered = filtered.filter(s => this.favorites.includes(s.id));
      filtered.sort((a, b) => {
        const aIndex = this.favorites.indexOf(a.id);
        const bIndex = this.favorites.indexOf(b.id);
        return aIndex - bIndex;
      });
    } else if (this.view === 'recent') {
      const recentIds = this.recent.slice(-20);
      filtered = filtered.filter(s => recentIds.includes(s.id));
      filtered.sort((a, b) => {
        const aIndex = recentIds.indexOf(a.id);
        const bIndex = recentIds.indexOf(b.id);
        return bIndex - aIndex;
      });
    } else if (this.view.startsWith('playlist-')) {
      const playlistId = this.view.replace('playlist-', '');
      const playlist = this.playlists[playlistId];
      if (playlist && playlist.stations) {
        filtered = filtered.filter(s => playlist.stations.includes(s.id));
      }
    }

    if (this.filter) {
      const query = this.filter.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  setFilter(query) {
    this.filter = query;
    this.emit('filter-change', query);
  }

  setView(view) {
    this.view = view;
    this.emit('view-change', view);
  }

  toggleFavorite(id) {
    const index = this.favorites.indexOf(id);
    if (index === -1) {
       this.favorites.unshift(id);
    } else {
      this.favorites.splice(index, 1);
    }
    this.setStorage('favorites', this.favorites);
    this.emit('favorites-change', this.favorites);
  }

  isFavorite(id) {
    return this.favorites.includes(id);
  }
  addToRecent(id) {
    const index = this.recent.indexOf(id);
    if (index !== -1) {
      this.recent.splice(index, 1);
    }
    this.recent.push(id);

    if (this.recent.length > 50) {
      this.recent = this.recent.slice(-50);
    }
    this.setStorage('recent', this.recent);
    this.emit('recent-change', this.recent);
  }
  isEditMode() {
    return this.editMode;
  }
  setEditMode(enabled) {
    this.editMode = enabled;
    this.emit('edit-mode-change', enabled);
  }
  getFavoriteIndex(stationId) {
    return this.favorites.indexOf(stationId);
  }
  getDebugInfo() {
    return {
      currentState: this.playerFSM.getState(),
      isActuallyPlaying: this.isActuallyPlaying,
      currentStation: this.current?.name,
      audioPoolDebug: this.audioPool.getDebugInfo(),
      fsmDebug: this.playerFSM.getDebugInfo()
    };
  }
  getStats() {
    const stats = this.getStorage('listeningStats', {
      sessions: [],
      genres: {},
      stations: {},
      totalTime: 0,
      lastUpdated: Date.now(),
      dailyStats: {}
    });
    let needsMigration = false;
    if (stats.stations && typeof stats.stations === 'object') {
      for (const [id, data] of Object.entries(stats.stations)) {
        if (data && data.totalTime !== undefined && data.time === undefined) {
          stats.stations[id].time = data.totalTime;
          delete stats.stations[id].totalTime;
          delete stats.stations[id].id;
          needsMigration = true;
        }
      }
    }
    if (stats.genres && typeof stats.genres === 'object') {
      for (const [genre, value] of Object.entries(stats.genres)) {
        if (value && typeof value === 'object' && value.time !== undefined) {
          stats.genres[genre] = value.time;
          needsMigration = true;
        }
      }
    }
    if ((!stats.dailyStats || Object.keys(stats.dailyStats).length === 0) && stats.sessions && stats.sessions.length > 0) {
      stats.dailyStats = {};
      stats.sessions.forEach(session => {
       let dateStr = session.date;
        if (!dateStr && session.timestamp) {
          const date = new Date(session.timestamp);
          dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        if (!stats.dailyStats[dateStr]) {
          stats.dailyStats[dateStr] = { time: 0, sessions: [] };
        }
        stats.dailyStats[dateStr].time += session.time || 0;
        stats.dailyStats[dateStr].sessions.push({ ...session, date: dateStr });
      });
      needsMigration = true;
    }

    if (needsMigration) {
      this.setStorage('listeningStats', stats);
    }
    return stats;
  }
   resetStats() {
    const emptyStats = {
      sessions: [],
      genres: {},
      stations: {},
      totalTime: 0,
      lastUpdated: Date.now(),
      dailyStats: {}
    };
    this.setStorage('listeningStats', emptyStats);
    this.emit('stats-update');
  }
}

export const store = new Store();
if (typeof window !== 'undefined') {
  window.store = store;
}