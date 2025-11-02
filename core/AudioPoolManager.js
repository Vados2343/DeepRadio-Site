import { Config } from './config.js';
import { logger } from './Logger.js';
import { NetworkRecoveryManager } from './NetworkRecoveryManager.js';

export class AudioPoolManager {
  constructor(options = {}) {
    this.poolSize = options.poolSize || Config.audio.poolSize;
    this.fadeTime = options.fadeTime || Config.audio.fadeTime;
    this.onStateChange = options.onStateChange || (() => {});
    this.onDiagnostic = options.onDiagnostic || (() => {});
    this.audioPool = [];
    this.poolState = new Map();
    this.activeAudio = null;
    this.activeIndex = -1;
    this.preloadQueue = new Map();
    this.maxPreloadSize = 1;
    this.isTransitioning = false;
    this.transitionController = null;
    this.watchdogs = new Map();
    this.progressMonitors = new Map();
    this.audioContext = options.audioContext || null;
    this.externalAudioContext = !!options.audioContext;
    this.masterGain = null;
    this.bufferCheckInterval = Config.audio.bufferCheckInterval;
    this.stallThreshold = Config.audio.stallThreshold;
    this.minBufferAhead = Config.audio.minBufferAhead;
    this.optimalBufferAhead = Config.audio.optimalBufferAhead;
    this.errorCount = 0;
    this.maxErrorsBeforeReset = 3;
    this.loadTimeout = Config.audio.loadTimeout;
    this.currentVolume = 0.7;
    this.hlsSupport = this.checkHLSSupport();
    this.hlsInstances = new Map();
    this.audioGraphNodes = new Map();
    this.reservedIndices = new Set();
    this.activeUrlByIndex = new Map();
    this.connectionStates = new Map();
    this.lastErrorTime = new Map();
    this.loadingStations = new Map();
    this.loadAbortControllers = new Map();
    this.playPromises = new Map();
    this.networkRecovery = new NetworkRecoveryManager({
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 15000,
      onRetry: (id, attempt, delay) => this.handleRecoveryRetry(id, attempt, delay),
      onSuccess: (id, result) => this.handleRecoverySuccess(id, result),
      onFailure: (id, error) => this.handleRecoveryFailure(id, error)
    });
    this.initializePool();
    this.initializeAudioContext();
  }

  checkHLSSupport() {
    const video = document.createElement('video');
    const nativeHLS = video.canPlayType('application/vnd.apple.mpegurl') !== '';
    const hlsJs = typeof window.Hls !== 'undefined' && window.Hls?.isSupported?.();
    return { native: nativeHLS, hlsJs };
  }

  isHLSUrl(url) {
    if (!url) return false;
    return url.includes('.m3u8') || url.includes('m3u8');
  }

  shouldForceProxy(url) {
    return Config.domains.proxyRequired.some(d => url.includes(d));
  }

  getProxiedUrl(url, isHLS = false) {
    if (!url) return url;
    if (url.includes('/api/proxy/')) return url;

    isHLS = isHLS || this.isHLSUrl(url);
    return isHLS
      ? `/api/proxy/hls?url=${encodeURIComponent(url)}`
      : `/api/proxy/stream?url=${encodeURIComponent(url)}`;
  }

  getCacheBusted(url) {
    if (!url) return url;
    try {
      const u = new URL(url, location.href);
      u.searchParams.set('t', Date.now().toString());
      return u.toString();
    } catch {
      return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    }
  }

  resolveStreamUrl(url, attempt = 0) {
    if (!url) return '';

    const isHLS = this.isHLSUrl(url);
    const needsProxy = this.shouldForceProxy(url) || url.startsWith('https://icecast.luxnet.ua');

    let resolvedUrl = url;

    if (needsProxy || url.includes('/api/proxy/')) {
      resolvedUrl = this.getProxiedUrl(url, isHLS);
    }

    if (attempt > 2) {
      resolvedUrl = this.getCacheBusted(resolvedUrl);
    }

    return resolvedUrl;
  }

  initializeAudioContext() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.currentVolume;
    } catch (e) {
      logger.error('AudioPool', 'Web Audio API not available', e);
    }
  }

  ensureAudioGraph(audio) {
    if (!this.audioContext || this.audioContext.state === 'closed') return null;
    const index = audio._poolIndex;
    let nodes = this.audioGraphNodes.get(index);
    if (!nodes || !nodes.sourceNode) {
      try {
        const sourceNode = audio._sourceNode || this.audioContext.createMediaElementSource(audio);
        const gainNode = audio._gainNode || this.audioContext.createGain();
        try { sourceNode.disconnect(); } catch {}
        try { gainNode.disconnect(); } catch {}
        sourceNode.connect(gainNode);
        gainNode.connect(this.masterGain);
        gainNode.gain.value = this.currentVolume;
        nodes = { sourceNode, gainNode };
        this.audioGraphNodes.set(index, nodes);
        audio._sourceNode = sourceNode;
        audio._gainNode = gainNode;
        logger.log('AudioPool', 'Created audio graph for index', { index });
      } catch (e) {
        logger.error('AudioPool', 'Failed to create audio graph', e);
        return null;
      }
    }
    return nodes;
  }

  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'none';
      audio._poolIndex = i;
      audio._stationId = null;
      audio._state = 'idle';
      audio._errorRetries = 0;
      audio._hlsInstance = null;
      audio.volume = this.currentVolume;
      this.setupAudioEventHandlers(audio);
      this.audioPool.push(audio);
      this.poolState.set(i, {
        state: 'idle',
        stationId: null,
        audio,
        lastUsed: 0,
        errorCount: 0,
        lastBufferEnd: 0,
        lastCurrentTime: 0,
        waitingStartTime: null,
        stallDetected: false,
        lastProgressTime: Date.now(),
        loadStartTime: null,
        firstByteTime: null,
        canPlayTime: null,
        isHLS: false,
        isPreload: false,
        opId: null,
        connectionQuality: 'good',
        recoveryAttempt: 0,
        playIntended: false
      });
      this.connectionStates.set(i, {
        hasError: false,
        recovering: false,
        lastSuccess: Date.now()
      });
    }
  }

  setupAudioEventHandlers(audio) {
    const index = audio._poolIndex;
    const updateState = (newState, data = {}) => {
      const state = this.poolState.get(index);
      if (state) {
        const prevState = state.state;
        state.state = newState;
        state.lastUsed = Date.now();

        if (state.isPreload && newState !== 'error') {
          return;
        }

        if (newState === 'error' && prevState !== 'error') {
          this.handleConnectionError(index, data.error);
        } else if (newState === 'playing' && prevState !== 'playing') {
          this.handleConnectionSuccess(index);
        }

        let bufferAhead = undefined;
        if (newState === 'waiting') {
          bufferAhead = this.getBufferAhead(audio);
        }

        this.onStateChange({
          type: 'pool-state-change',
          index,
          state: newState,
          previousState: prevState,
          stationId: state.stationId,
          audio,
          opId: state.opId,
          bufferAhead,
          isPreload: state.isPreload,
          ...data
        });
      }
    };

    audio.addEventListener('loadstart', () => {
      const state = this.poolState.get(index);
      state.loadStartTime = Date.now();
      state.firstByteTime = null;
      state.canPlayTime = null;
      updateState('loading');
      this.clearWatchdog(index);
      logger.audioEvent('loadstart', { index, stationId: state.stationId });
    });

    audio.addEventListener('progress', () => {
      const state = this.poolState.get(index);
      if (!state.firstByteTime && audio.buffered.length > 0) {
        state.firstByteTime = Date.now();
        logger.metric('first_byte', state.firstByteTime - state.loadStartTime, 'ms');
      }
      this.checkBufferProgress(index);
    });

    audio.addEventListener('loadedmetadata', () => updateState('metadata'));
    audio.addEventListener('loadeddata', () => updateState('loaded'));

    audio.addEventListener('canplay', () => {
      const state = this.poolState.get(index);
      state.canPlayTime = Date.now();
      state.errorCount = 0;
      state.recoveryAttempt = 0;
      audio._errorRetries = 0;
      updateState('ready');
      this.clearWatchdog(index);
      const loadTime = state.canPlayTime - state.loadStartTime;
      logger.metric('canplay_time', loadTime, 'ms');
      this.handleConnectionSuccess(index);
    });

    audio.addEventListener('canplaythrough', () => updateState('ready-through'));

    audio.addEventListener('play', () => {
      updateState('play-requested');
    });

    audio.addEventListener('playing', () => {
      updateState('playing');
      this.clearWatchdog(index);
      this.startProgressMonitor(index);
      const state = this.poolState.get(index);
      state.stallDetected = false;
      state.errorCount = 0;
      state.recoveryAttempt = 0;
      logger.audioEvent('playing', { index, stationId: state.stationId });
      this.handleConnectionSuccess(index);
    });

    audio.addEventListener('pause', () => {
      const state = this.poolState.get(index);
      this.stopProgressMonitor(index);
      this.clearWatchdog(index);

      if (!this.isTransitioning && state.state !== 'transitioning') {
        updateState('paused');
      }
    });

    audio.addEventListener('waiting', () => {
      const state = this.poolState.get(index);
      const ahead = this.getBufferAhead(audio);
      const isActive = index === this.activeIndex;

      if (!isActive || audio.paused) return;

      const threshold = state.isHLS ? this.minBufferAhead * 0.25 : this.minBufferAhead * 0.5;
      if (ahead >= threshold) return;

      state.waitingStartTime = Date.now();
      state.lastProgressTime = Date.now();
      updateState('waiting');
      this.startWatchdog(index);

      logger.log('AudioPool', 'WAITING detected', {
        index,
        stationId: state.stationId,
        opId: state.opId,
        bufferAhead: ahead,
        readyState: audio.readyState,
        currentTime: audio.currentTime,
        isHLS: state.isHLS
      });
    });

    audio.addEventListener('seeking', () => updateState('seeking'));
    audio.addEventListener('seeked', () => updateState('seeked'));

    audio.addEventListener('stalled', () => {
      const state = this.poolState.get(index);
      if (!state.stallDetected && index === this.activeIndex) {
        updateState('stalled');
        this.onDiagnostic({ type: 'stalled-event', index, opId: state.opId });
        logger.audioEvent('stalled', { index, stationId: state.stationId });
      }
    });

    audio.addEventListener('suspend', () => {
      if (audio.networkState === audio.NETWORK_IDLE) updateState('suspended');
    });

    audio.addEventListener('abort', () => {
      const state = this.poolState.get(index);
      if (!state.isPreload) {
        updateState('aborted');
      }
      this.clearWatchdog(index);
      this.stopProgressMonitor(index);
    });

    audio.addEventListener('error', () => {
      const state = this.poolState.get(index);
      const connectionState = this.connectionStates.get(index);

      if (index !== this.activeIndex && state.state === 'idle') {
        logger.log('AudioPool', 'Ignoring error from inactive slot', { index });
        return;
      }

      if (!audio.src || audio.src === '') {
        logger.log('AudioPool', 'Ignoring error from element without source', { index });
        return;
      }

      const now = Date.now();
      const lastError = this.lastErrorTime.get(index) || 0;
      if (now - lastError < 500) {
        logger.log('AudioPool', 'Ignoring rapid error', { index });
        return;
      }
      this.lastErrorTime.set(index, now);

      state.errorCount++;
      audio._errorRetries++;
      const err = audio.error || {};

      let errorMessage = 'Ошибка загрузки';
      let isRecoverable = true;

      if (err.code === 1) errorMessage = 'Загрузка прервана';
      else if (err.code === 2) {
        errorMessage = 'Сетевая ошибка';
        isRecoverable = true;
      }
      else if (err.code === 3) errorMessage = 'Ошибка декодирования';
      else if (err.code === 4) {
        errorMessage = 'Формат не поддерживается';
        isRecoverable = false;
      }
      else if (err.message && err.message.includes('DEMUXER_ERROR')) {
        errorMessage = 'Проблема с потоком';
        isRecoverable = true;
      }

      const errorInfo = {
        code: err.code,
        message: errorMessage,
        originalMessage: err.message,
        networkState: audio.networkState,
        readyState: audio.readyState,
        retries: audio._errorRetries,
        isRecoverable
      };

      updateState('error', { error: errorInfo });
      this.clearWatchdog(index);
      this.stopProgressMonitor(index);

      if (isRecoverable && index === this.activeIndex && !connectionState.recovering) {
        this.startRecovery(index, state.stationId, state.opId);
      }

      logger.error('AudioPool', `Error in audio ${index}`, errorInfo);
    });

    audio.addEventListener('ended', () => {
      updateState('ended');
      this.stopProgressMonitor(index);
    });

    audio.addEventListener('timeupdate', () => {
      const state = this.poolState.get(index);
      if (state.state === 'waiting' && index === this.activeIndex && !audio.paused) {
        if (audio.currentTime > state.lastCurrentTime) {
          state.lastCurrentTime = audio.currentTime;
          state.lastProgressTime = Date.now();
          updateState('playing');
          this.onDiagnostic({
            type: 'playback-resumed',
            index,
            currentTime: audio.currentTime,
            opId: state.opId
          });
        }
      }
    });
  }

  handleConnectionError(index, error) {
    const connectionState = this.connectionStates.get(index);
    if (connectionState) {
      connectionState.hasError = true;
      const now = Date.now();
      const timeSinceSuccess = now - connectionState.lastSuccess;

      const state = this.poolState.get(index);
      if (timeSinceSuccess < 5000) {
        state.connectionQuality = 'unstable';
      } else if (timeSinceSuccess < 30000) {
        state.connectionQuality = 'poor';
      } else {
        state.connectionQuality = 'critical';
      }
    }
  }

  handleConnectionSuccess(index) {
    const connectionState = this.connectionStates.get(index);
    if (connectionState) {
      connectionState.hasError = false;
      connectionState.recovering = false;
      connectionState.lastSuccess = Date.now();

      const state = this.poolState.get(index);
      state.connectionQuality = 'good';
      state.errorCount = 0;
      state.recoveryAttempt = 0;
    }
  }

  startRecovery(index, stationId, opId) {
    const connectionState = this.connectionStates.get(index);
    if (!connectionState || connectionState.recovering) return;

    connectionState.recovering = true;
    const recoveryId = `audio-${index}-${stationId}`;

    this.networkRecovery.startRecovery(
      recoveryId,
      async (attempt) => {
        const state = this.poolState.get(index);
        if (!state || state.stationId !== stationId || state.opId !== opId) {
          throw new Error('Context changed, aborting recovery');
        }

        state.recoveryAttempt = attempt;
        const audio = state.audio;
        const baseUrl = this.activeUrlByIndex.get(index) || audio.src;
        const url = this.resolveStreamUrl(baseUrl, attempt);

        if (attempt === 1) {
          await this.softReconnect(audio, url);
        } else if (attempt === 2) {
          await this.hardReconnect(audio, url, state.isHLS);
        } else {
          await this.hardReconnect(audio, url, state.isHLS);
        }

        const testPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Test timeout')), 5000);
          const handleCanPlay = () => {
            clearTimeout(timeout);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            resolve();
          };
          const handleError = () => {
            clearTimeout(timeout);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            reject(new Error('Load failed'));
          };
          audio.addEventListener('canplay', handleCanPlay, { once: true });
          audio.addEventListener('error', handleError, { once: true });
        });

        await testPromise;

        this.activeUrlByIndex.set(index, url);

        if (!audio.paused && index === this.activeIndex) {
          await audio.play();
        }

        return { success: true, attempt };
      },
      {
        maxRetries: 5,
        customDelays: [1000, 2000, 4000, 8000, 15000],
        silent: false
      }
    );
  }

  async softReconnect(audio, url) {
    try {
      audio.load();
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (e) {
      logger.log('AudioPool', 'Soft reconnect failed', e);
      throw e;
    }
  }

  async hardReconnect(audio, url, isHLS) {
    try {
      audio.pause();
      await new Promise(resolve => setTimeout(resolve, 50));

      if (isHLS && audio._hlsInstance) {
        try {
          audio._hlsInstance.recoverMediaError();
        } catch {
          audio._hlsInstance.destroy();
          audio._hlsInstance = null;
          await this.loadHLSStream(audio, url, false);
        }
      } else {
        const currentSrc = audio.currentSrc || audio.src;
        if (currentSrc !== url) {
          audio.src = url;
        }
        audio.load();
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (e) {
      logger.log('AudioPool', 'Hard reconnect failed', e);
      throw e;
    }
  }

  handleRecoveryRetry(id, attempt, delay) {
    logger.log('AudioPool', 'Recovery retry', { id, attempt, delay });
    if (attempt === 1) {
      this.onDiagnostic({
        type: 'recovery-started',
        id,
        message: 'Восстанавливаем соединение...'
      });
    }
  }

  handleRecoverySuccess(id, result) {
    logger.log('AudioPool', 'Recovery successful', { id, attempts: result.attempt });
    const [, index, stationId] = id.split('-');
    const connectionState = this.connectionStates.get(parseInt(index));
    if (connectionState) {
      connectionState.recovering = false;
      connectionState.hasError = false;
      connectionState.lastSuccess = Date.now();
    }
    this.onDiagnostic({
      type: 'recovery-success',
      id,
      message: 'Соединение восстановлено'
    });
  }

  handleRecoveryFailure(id, error) {
    logger.error('AudioPool', 'Recovery failed', { id, error });
    const [, index] = id.split('-');
    const connectionState = this.connectionStates.get(parseInt(index));
    if (connectionState) {
      connectionState.recovering = false;
    }
    this.onDiagnostic({
      type: 'recovery-failed',
      id,
      message: 'Не удалось восстановить соединение'
    });
  }

  async loadHLSStream(audio, url, preload = false) {
    const index = audio._poolIndex;
    const state = this.poolState.get(index);

    const extractOriginalUrl = (proxiedUrl) => {
      try {
        const u = new URL(proxiedUrl, window.location.origin);
        const encoded = u.searchParams.get('url');
        if (encoded) return decodeURIComponent(encoded);
      } catch {}
      return proxiedUrl;
    };

    const originalUrl = url.includes('/api/proxy/') ? extractOriginalUrl(url) : url;
    const proxiedManifestUrl = this.getProxiedUrl(originalUrl, true);

    if (this.hlsSupport.native) {
      audio.src = proxiedManifestUrl;
      try { audio.load(); } catch {}
      state.isHLS = true;
      return;
    }

    if (this.hlsSupport.hlsJs && window.Hls) {
      if (audio._hlsInstance) {
        audio._hlsInstance.destroy();
        audio._hlsInstance = null;
      }

      const Hls = window.Hls;
      const DefaultLoader = Hls.DefaultConfig.loader;

      class ProxyLoader extends DefaultLoader {
        constructor(config) {
          super(config);
        }

        load(context, config, callbacks) {
          const originalContextUrl = context.url;

          try {
            const manifestBase = new URL(originalUrl, window.location.href);
            const absoluteUrl = new URL(originalContextUrl, manifestBase.href);
            context.url = `/api/proxy/hls?url=${encodeURIComponent(absoluteUrl.toString())}`;
          } catch (e) {
            context.url = `/api/proxy/hls?url=${encodeURIComponent(originalContextUrl)}`;
          }

          super.load(context, config, callbacks);
        }
      }

      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 10,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        enableSoftwareAES: true,
        startLevel: -1,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        fragLoadingMaxRetryTimeout: 64000,
        startFragPrefetch: false,
        testBandwidth: true,
        progressive: false,
        loader: ProxyLoader
      });

      hls.on(window.Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(originalUrl);
      });

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        if (!preload && !state.isPreload) {
          audio.play().catch(e => {
            logger.error('AudioPool', 'HLS play error', e);
          });
        }
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              logger.error('AudioPool', 'Fatal network error in HLS', data);
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              logger.error('AudioPool', 'Fatal media error in HLS', data);
              hls.recoverMediaError();
              break;
            default:
              logger.error('AudioPool', 'Fatal HLS error', data);
              hls.destroy();
              break;
          }
        }
      });

      hls.attachMedia(audio);
      audio._hlsInstance = hls;
      state.isHLS = true;
      this.hlsInstances.set(index, hls);
      return;
    }

    throw new Error('HLS not supported and hls.js not available');
  }

  resetAudioElement(index) {
    if (index === this.activeIndex) {
      logger.log('AudioPool', 'Skip reset on active slot', { index });
      return;
    }
    const state = this.poolState.get(index);
    const audio = state.audio;

    this.clearPlayPromise(index);
    this.networkRecovery.cancelRecovery(`audio-${index}-${state.stationId}`);

    if (audio._hlsInstance) {
      audio._hlsInstance.destroy();
      audio._hlsInstance = null;
      this.hlsInstances.delete(index);
    }

    try { audio.pause(); } catch {}
    try { audio.removeAttribute('src'); } catch {}
    try { audio.load(); } catch {}

    state.state = 'idle';
    state.stationId = null;
    state.errorCount = 0;
    state.lastBufferEnd = 0;
    state.lastCurrentTime = 0;
    state.waitingStartTime = null;
    state.stallDetected = false;
    state.isHLS = false;
    state.isPreload = false;
    state.opId = null;
    state.connectionQuality = 'good';
    state.recoveryAttempt = 0;
    state.playIntended = false;
    audio._errorRetries = 0;
    audio._stationId = null;
    audio._state = 'idle';
    audio.volume = this.currentVolume;
    this.activeUrlByIndex.delete(index);

    const connectionState = this.connectionStates.get(index);
    if (connectionState) {
      connectionState.hasError = false;
      connectionState.recovering = false;
      connectionState.lastSuccess = Date.now();
    }

    logger.log('AudioPool', 'Reset audio element', { index });
  }

  clearPlayPromise(index) {
    if (this.playPromises.has(index)) {
      const promise = this.playPromises.get(index);
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {});
      }
      this.playPromises.delete(index);
    }
  }

  startWatchdog(index) {
    this.clearWatchdog(index);
    const checkStall = () => {
      const state = this.poolState.get(index);
      if (!state) return;
      const audio = state.audio;
      if (!['waiting', 'loading', 'buffering'].includes(state.state)) {
        this.clearWatchdog(index);
        return;
      }
      const now = Date.now();
      const timeSinceProgress = now - state.lastProgressTime;
      const buffered = this.getBufferedEnd(audio);
      const currentTime = audio.currentTime;
      const hasBufferProgress = buffered > state.lastBufferEnd;
      const hasTimeProgress = currentTime > state.lastCurrentTime;

      if (hasBufferProgress || hasTimeProgress) {
        state.lastProgressTime = now;
        state.lastBufferEnd = buffered;
        state.lastCurrentTime = currentTime;
        if (state.waitingStartTime && (hasTimeProgress || this.hasEnoughBuffer(audio))) {
          this.onDiagnostic({
            type: 'progress-detected',
            index,
            buffered,
            currentTime,
            bufferAhead: this.getBufferAhead(audio),
            opId: state.opId
          });
          if (state.state === 'waiting') state.waitingStartTime = null;
        }
      } else if (timeSinceProgress > this.stallThreshold && !state.stallDetected) {
        state.stallDetected = true;
        this.clearWatchdog(index);
        logger.metric('stall_duration', timeSinceProgress, 'ms');
        this.onDiagnostic({
          type: 'stall-detected',
          index,
          waitingTime: state.waitingStartTime ? now - state.waitingStartTime : null,
          progressTime: timeSinceProgress,
          buffered,
          currentTime,
          networkState: audio.networkState,
          readyState: audio.readyState,
          opId: state.opId
        });
      }
    };
    const watchdogId = setInterval(checkStall, Config.audio.watchdogInterval);
    this.watchdogs.set(index, watchdogId);
    checkStall();
  }

  clearWatchdog(index) {
    if (this.watchdogs.has(index)) {
      clearInterval(this.watchdogs.get(index));
      this.watchdogs.delete(index);
    }
  }

  startProgressMonitor(index) {
    this.stopProgressMonitor(index);
    const monitorId = setInterval(() => {
      const state = this.poolState.get(index);
      const audio = state?.audio;
      if (!state || state.state !== 'playing' || !audio || audio.paused) {
        this.stopProgressMonitor(index);
        return;
      }
      const bufferHealth = this.checkBufferHealth(index);
      if (bufferHealth.isLow && !audio.paused) {
        logger.bufferStatus(index, {
          ahead: bufferHealth.bufferAhead,
          behind: bufferHealth.bufferBehind,
          buffered: bufferHealth.buffered,
          isLow: bufferHealth.isLow,
          isOptimal: bufferHealth.isOptimal
        });
        this.onDiagnostic({
          type: 'low-buffer',
          index,
          opId: state.opId,
          ...bufferHealth
        });
      }
    }, 2000);
    this.progressMonitors.set(index, monitorId);
  }

  stopProgressMonitor(index) {
    if (this.progressMonitors.has(index)) {
      clearInterval(this.progressMonitors.get(index));
      this.progressMonitors.delete(index);
    }
  }

  checkBufferProgress(index) {
    const state = this.poolState.get(index);
    if (!state) return;
    const audio = state.audio;
    const buffered = this.getBufferedEnd(audio);
    const hasProgress = buffered > state.lastBufferEnd;
    if (hasProgress) {
      state.lastBufferEnd = buffered;
      state.lastProgressTime = Date.now();
      if (state.state === 'waiting' && this.hasEnoughBuffer(audio)) {
        this.onDiagnostic({
          type: 'buffer-recovered',
          index,
          buffered,
          bufferAhead: this.getBufferAhead(audio),
          opId: state.opId
        });
      }
    }
  }

  checkBufferHealth(index) {
    const state = this.poolState.get(index);
    const audio = state.audio;
    const bufferedEnd = this.getBufferedEnd(audio);
    const bufferAhead = this.getBufferAhead(audio);
    const bufferBehind = audio.currentTime;
    const bufferedAmount = this.getBufferedAmount(audio);
    const threshold = state.isHLS ? this.minBufferAhead * 0.5 : this.minBufferAhead;
    return {
      buffered: bufferedAmount,
      bufferAhead,
      bufferBehind,
      isLow: bufferAhead < threshold,
      isOptimal: bufferAhead >= this.optimalBufferAhead,
      percentage: audio.duration ? (bufferedAmount / audio.duration) * 100 : 0
    };
  }

  getBufferedEnd(audio) {
    if (!audio.buffered || audio.buffered.length === 0) return 0;
    try {
      for (let i = 0; i < audio.buffered.length; i++) {
        const start = audio.buffered.start(i);
        const end = audio.buffered.end(i);
        if (audio.currentTime >= start && audio.currentTime <= end) {
          return end;
        }
      }
      return audio.buffered.end(audio.buffered.length - 1);
    } catch {
      return 0;
    }
  }

  getBufferedAmount(audio) {
    if (!audio.buffered || audio.buffered.length === 0) return 0;
    try {
      let total = 0;
      for (let i = 0; i < audio.buffered.length; i++) {
        const start = audio.buffered.start(i);
        const end = audio.buffered.end(i);
        if (audio.currentTime >= start && audio.currentTime <= end) {
          total += end - audio.currentTime;
        } else if (end > audio.currentTime) {
          total += end - Math.max(start, audio.currentTime);
        }
      }
      return total;
    } catch {
      return 0;
    }
  }

  getBufferAhead(audio) {
    const bufferedEnd = this.getBufferedEnd(audio);
    return Math.max(0, bufferedEnd - audio.currentTime);
  }

  hasEnoughBuffer(audio) {
    const state = this.poolState.get(audio._poolIndex);
    const threshold = state?.isHLS ? this.optimalBufferAhead * 0.5 : this.optimalBufferAhead;
    return this.getBufferAhead(audio) >= threshold;
  }

  getNextAvailable() {
    for (const [index, state] of this.poolState) {
      if (state.state === 'idle' && !state.stationId && index !== this.activeIndex && !this.reservedIndices.has(index)) {
        return state.audio;
      }
    }
    for (const [index, state] of this.poolState) {
      if (['paused', 'suspended', 'ended'].includes(state.state) && index !== this.activeIndex && state.state !== 'playing' && !this.reservedIndices.has(index)) {
        return state.audio;
      }
    }
    let oldestIndex = -1;
    let oldestTime = Date.now();
    for (const [index, state] of this.poolState) {
      if (index !== this.activeIndex && state.state !== 'playing' && !this.reservedIndices.has(index) && state.lastUsed < oldestTime) {
        oldestTime = state.lastUsed;
        oldestIndex = index;
      }
    }
    if (oldestIndex >= 0) {
      this.resetAudioElement(oldestIndex);
      return this.poolState.get(oldestIndex).audio;
    }
    logger.log('AudioPool', 'No free slots available');
    return null;
  }

  abortLoadingForStation(stationId) {
    const controller = this.loadAbortControllers.get(stationId);
    if (controller) {
      controller.abort();
      this.loadAbortControllers.delete(stationId);
      this.loadingStations.delete(stationId);
    }
  }

  async loadStation(station, url, preload = false, opId = null) {
    if (this.loadingStations.has(station.id)) {
      const controller = this.loadAbortControllers.get(station.id);
      if (controller) {
        controller.abort();
      }
      this.loadAbortControllers.delete(station.id);
      this.loadingStations.delete(station.id);
    }

    const abortController = new AbortController();
    this.loadAbortControllers.set(station.id, abortController);
    this.loadingStations.set(station.id, true);

    try {
      const audio = this.getNextAvailable();
      if (!audio) {
        if (preload) {
          logger.log('AudioPool', 'Skip preload - no free slots');
          return null;
        }
        throw new Error('No available audio elements in pool');
      }
      if (audio === this.activeAudio) {
        logger.log('AudioPool', 'Guard hit - tried to load on active audio');
        return null;
      }

      if (abortController.signal.aborted) {
        throw new Error('Load aborted');
      }

      const index = audio._poolIndex;
      const state = this.poolState.get(index);

      this.clearWatchdog(index);
      this.stopProgressMonitor(index);
      this.clearPlayPromise(index);

      if (audio._hlsInstance) {
        audio._hlsInstance.destroy();
        audio._hlsInstance = null;
      }

      const currentSrc = audio.currentSrc || audio.src;
      if (currentSrc && currentSrc !== url) {
        try { audio.pause(); } catch {}
        try { audio.removeAttribute('src'); } catch {}
        try { audio.load(); } catch {}
        await new Promise(r => setTimeout(r, 50));
      }

      audio._stationId = station.id;
      state.stationId = station.id;
      state.errorCount = 0;
      state.lastBufferEnd = 0;
      state.lastCurrentTime = 0;
      state.waitingStartTime = null;
      state.stallDetected = false;
      state.lastProgressTime = Date.now();
      state.isHLS = false;
      state.isPreload = preload;
      state.opId = opId;
      state.connectionQuality = 'good';
      state.recoveryAttempt = 0;
      state.playIntended = !preload;
      audio._errorRetries = 0;
      audio.volume = this.currentVolume;

      const isHLS = this.isHLSUrl(url);
      const resolvedUrl = this.resolveStreamUrl(url, 0);

      logger.log('AudioPool', 'Loading station', {
        stationId: station.id,
        index,
        preload,
        isHLS,
        originalUrl: url,
        resolvedUrl
      });

      return new Promise((resolve, reject) => {
        let loadTimeout;
        let errorTimeout;
        let progressTimeout;
        let hasProgress = false;
        let extendedOnce = false;

        const needsProxy = resolvedUrl.includes('/api/proxy/');
        const baseTimeout = isHLS ? 45000 : (needsProxy ? 35000 : this.loadTimeout);
        let currentTimeout = baseTimeout;

        if (!navigator.onLine) {
          this.onDiagnostic({
            type: 'network-offline',
            message: 'Проверьте подключение к интернету'
          });
        }

        const resetTimeout = () => {
          if (hasProgress) {
            clearTimeout(loadTimeout);
            currentTimeout = Math.min(currentTimeout + 5000, 60000);
            loadTimeout = setTimeout(() => {
              if (!abortController.signal.aborted) {
                cleanup();
                reject(new Error('Loading timeout after progress'));
              }
            }, currentTimeout);
          }
        };

        const checkFirstByte = () => {
          if (!extendedOnce && state.firstByteTime) {
            const elapsed = state.firstByteTime - state.loadStartTime;
            if (elapsed > 3000) {
              extendedOnce = true;
              clearTimeout(loadTimeout);
              currentTimeout = Math.min(currentTimeout + 10000, 60000);
              loadTimeout = setTimeout(() => {
                if (!abortController.signal.aborted) {
                  cleanup();
                  reject(new Error('Extended loading timeout'));
                }
              }, currentTimeout);
              logger.log('AudioPool', 'Extended timeout due to slow firstByte', { elapsed, newTimeout: currentTimeout });
            }
          }
        };

        const cleanup = () => {
          clearTimeout(loadTimeout);
          clearTimeout(errorTimeout);
          clearTimeout(progressTimeout);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          audio.removeEventListener('loadeddata', handleLoadedData);
          audio.removeEventListener('progress', handleProgress);
          this.loadAbortControllers.delete(station.id);
          this.loadingStations.delete(station.id);
        };

        const handleProgress = () => {
          if (!abortController.signal.aborted) {
            hasProgress = true;
            resetTimeout();
            checkFirstByte();
          }
        };

        const handleCanPlay = () => {
          if (!abortController.signal.aborted) {
            cleanup();
            if (preload) {
              this.preloadQueue.set(station.id, audio);
              this.cleanupPreloadQueue();
            }
            this.activeUrlByIndex.set(index, resolvedUrl);
            resolve(audio);
          } else {
            cleanup();
            reject(new Error('Load aborted'));
          }
        };

        const handleLoadedData = () => {
          if (!abortController.signal.aborted) {
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
              cleanup();
              this.activeUrlByIndex.set(index, resolvedUrl);
              resolve(audio);
            }, 2000);
          }
        };

        const handleError = () => {
          if (!abortController.signal.aborted) {
            cleanup();
            const error = audio.error || {};
            const msg = error?.message || '';
            if (msg.includes('DEMUXER_ERROR') && audio._errorRetries < 2) {
              setTimeout(() => { try { audio.load(); } catch {} }, 500);
              return;
            }
            logger.error('AudioPool', 'Load failed', { stationId: station.id, error: msg });
            reject(new Error(`Failed to load audio: ${msg || 'unknown'}`));
          } else {
            cleanup();
            reject(new Error('Load aborted'));
          }
        };

        abortController.signal.addEventListener('abort', () => {
          cleanup();
          reject(new Error('Load aborted'));
        });

        loadTimeout = setTimeout(() => {
          if (!abortController.signal.aborted) {
            cleanup();
            logger.error('AudioPool', 'Load timeout', { stationId: station.id });
            reject(new Error('Loading timeout'));
          }
        }, currentTimeout);

        audio.addEventListener('canplay', handleCanPlay, { once: true });
        audio.addEventListener('loadeddata', handleLoadedData, { once: true });
        audio.addEventListener('error', handleError, { once: true });
        audio.addEventListener('progress', handleProgress);

        progressTimeout = setInterval(() => {
          if (!abortController.signal.aborted) {
            checkFirstByte();
          }
        }, 1000);

        if (isHLS) {
          this.loadHLSStream(audio, resolvedUrl, preload).catch(err => {
            if (!abortController.signal.aborted) {
              cleanup();
              reject(err);
            }
          });
        } else {
          audio.src = resolvedUrl;
          try { audio.load(); } catch {}
        }
      });
    } finally {
      this.loadAbortControllers.delete(station.id);
      this.loadingStations.delete(station.id);
    }
  }

  async switchToStation(station, url, volume = 0.7, opId = null) {
    for (const [stationId, controller] of this.loadAbortControllers) {
      if (stationId !== station.id) {
        controller.abort();
        this.loadAbortControllers.delete(stationId);
        this.loadingStations.delete(stationId);
      }
    }

    const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0.7));
    this.currentVolume = safeVolume;
    const oldIndex = this.activeIndex;

    if (this.isTransitioning) {
      if (this.transitionController) this.transitionController.abort();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isTransitioning = true;
    this.transitionController = new AbortController();
    if (oldIndex >= 0) {
      this.reservedIndices.add(oldIndex);
    }

    const timer = logger.timer('station_switch');
    try {
      let newAudio = this.preloadQueue.get(station.id);
      if (!newAudio || newAudio._stationId !== station.id) {
        newAudio = await this.loadStation(station, url, false, opId);
      } else {
        this.preloadQueue.delete(station.id);
        const newIndex = newAudio._poolIndex;
        const state = this.poolState.get(newIndex);
        if (state) {
          state.opId = opId;
          state.playIntended = true;
        }
      }

      if (!newAudio) throw new Error('No audio for switching');

      const newIndex = newAudio._poolIndex;
      this.reservedIndices.add(newIndex);

      if (this.transitionController.signal.aborted) {
        throw new Error('Transition aborted');
      }

      const result = await this.performCrossfade(this.activeAudio, newAudio, safeVolume, null);
      const oldAudio = this.activeAudio;
      this.activeAudio = newAudio;
      this.activeIndex = newIndex;

      if (oldAudio && oldAudio !== newAudio) {
        const oldState = this.poolState.get(oldAudio._poolIndex);
        if (oldState) {
          oldState.state = 'idle';
          oldState.stationId = null;
          oldState.opId = null;
          oldState.recoveryAttempt = 0;
          oldState.playIntended = false;
        }
        const oldConnState = this.connectionStates.get(oldAudio._poolIndex);
        if (oldConnState) {
          oldConnState.recovering = false;
        }
      }

      timer.end();
      return result;
    } finally {
      this.isTransitioning = false;
      this.transitionController = null;
      this.reservedIndices.clear();
    }
  }

  async performCrossfade(oldAudio, newAudio, targetVolume, sourceNode) {
    const safeVolume = Math.max(0, Math.min(1, Number(targetVolume) || 0.7));
    this.currentVolume = safeVolume;

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        return await this.performWebAudioCrossfade(oldAudio, newAudio, safeVolume, sourceNode);
      } catch (e) {
        logger.error('AudioPool', 'Web Audio crossfade failed', e);
      }
    }

    if (oldAudio && !oldAudio.paused) {
      const fadeSteps = 10;
      const stepTime = this.fadeTime / fadeSteps;
      for (let i = 0; i <= fadeSteps; i++) {
        if (this.transitionController?.signal.aborted) break;
        const progress = i / fadeSteps;
        oldAudio.volume = Math.max(0, Math.min(1, safeVolume * (1 - progress)));
        if (i < fadeSteps) await new Promise(resolve => setTimeout(resolve, stepTime));
      }

      try { oldAudio.pause(); } catch {}
      oldAudio.volume = safeVolume;

      const oldIndex = oldAudio._poolIndex;
      this.clearWatchdog(oldIndex);
      this.stopProgressMonitor(oldIndex);
      this.clearPlayPromise(oldIndex);
    }

    newAudio.volume = safeVolume;
    let playAttempts = 0;
    const maxPlayAttempts = 3;

    while (playAttempts < maxPlayAttempts) {
      try {
        const newIndex = newAudio._poolIndex;
        const playPromise = newAudio.play();
        this.playPromises.set(newIndex, playPromise);
        await playPromise;
        this.clearPlayPromise(newIndex);
        break;
      } catch (error) {
        playAttempts++;
        if (playAttempts >= maxPlayAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const newNodes = this.ensureAudioGraph(newAudio);
    return { audio: newAudio, sourceNode: newNodes?.sourceNode || null };
  }

  async performWebAudioCrossfade(oldAudio, newAudio, targetVolume, sourceNode) {
    const safeVolume = Math.max(0, Math.min(1, Number(targetVolume) || 0.7));
    this.currentVolume = safeVolume;

    if (this.audioContext.state === 'suspended') {
      try { await this.audioContext.resume(); } catch {}
    }

    const newNodes = this.ensureAudioGraph(newAudio);
    if (!newNodes) {
      throw new Error('Failed to create audio graph');
    }

    if (oldAudio) {
      this.ensureAudioGraph(oldAudio);
    }

    this.masterGain.gain.value = 1;
    const fadeTime = this.fadeTime / 1000;
    const now = this.audioContext.currentTime;
    const newGain = newNodes.gainNode;
    const oldGain = oldAudio?._gainNode;

    if (oldAudio && !oldAudio.paused && oldGain) {
      oldGain.gain.setValueAtTime(safeVolume, now);
      oldGain.gain.linearRampToValueAtTime(0, now + fadeTime);
      newGain.gain.setValueAtTime(0, now);
      newGain.gain.linearRampToValueAtTime(safeVolume, now + fadeTime);

      const newIndex = newAudio._poolIndex;
      const playPromise = newAudio.play();
      this.playPromises.set(newIndex, playPromise);
      await playPromise;
      this.clearPlayPromise(newIndex);

      setTimeout(() => {
        if (!this.transitionController?.signal.aborted) {
          try { oldAudio.pause(); } catch {}
          oldGain.gain.value = safeVolume;

          const oldIndex = oldAudio._poolIndex;
          this.clearWatchdog(oldIndex);
          this.stopProgressMonitor(oldIndex);
          this.clearPlayPromise(oldIndex);
        }
      }, this.fadeTime);
    } else {
      newGain.gain.setValueAtTime(safeVolume, now);
      const newIndex = newAudio._poolIndex;
      const playPromise = newAudio.play();
      this.playPromises.set(newIndex, playPromise);
      await playPromise;
      this.clearPlayPromise(newIndex);
    }

    return { audio: newAudio, sourceNode: newNodes.sourceNode };
  }

  async preloadStations(stations) {
    const promises = stations
      .slice(0, this.maxPreloadSize)
      .map(({ station, url }) => {
        if (!this.preloadQueue.has(station.id)) {
          return this.loadStation(station, url, true, null)
            .then(audio => {
              if (audio) {
                logger.log('AudioPool', `Preloaded station ${station.id}`);
              }
            })
            .catch(err => {
              logger.error('AudioPool', `Failed to preload station ${station.id}`, err);
            });
        }
        return null;
      })
      .filter(Boolean);
    await Promise.allSettled(promises);
  }

  cleanupPreloadQueue() {
    if (this.preloadQueue.size > this.maxPreloadSize) {
      const entries = Array.from(this.preloadQueue.entries());
      const toRemove = entries.slice(0, entries.length - this.maxPreloadSize);
      toRemove.forEach(([stationId, audio]) => {
        const index = audio._poolIndex;

        if (audio._hlsInstance) {
          audio._hlsInstance.destroy();
          audio._hlsInstance = null;
        }

        this.clearWatchdog(index);
        this.stopProgressMonitor(index);
        this.clearPlayPromise(index);

        try { audio.pause(); } catch {}
        try { audio.removeAttribute('src'); } catch {}
        try { audio.load(); } catch {}

        this.preloadQueue.delete(stationId);
        this.activeUrlByIndex.delete(index);

        const state = this.poolState.get(index);
        if (state) {
          state.isPreload = false;
          state.playIntended = false;
        }
      });
    }
  }

  getActiveAudio() {
    return this.activeAudio;
  }

  pause() {
    if (this.activeAudio && !this.activeAudio.paused) {
      const index = this.activeAudio._poolIndex;
      const state = this.poolState.get(index);
      if (state) {
        state.playIntended = false;
      }
      try { this.activeAudio.pause(); } catch {}
      return true;
    }
    return false;
  }

  async resume() {
    if (this.activeAudio && this.activeAudio.paused) {
      const index = this.activeAudio._poolIndex;
      const state = this.poolState.get(index);
      if (state) {
        state.playIntended = true;
      }
      const playPromise = this.activeAudio.play();
      this.playPromises.set(index, playPromise);
      await playPromise;
      this.clearPlayPromise(index);
      return true;
    }
    return false;
  }

  setVolume(volume) {
    const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    this.currentVolume = safeVolume;
    if (this.audioContext && this.masterGain) {
      this.masterGain.gain.value = safeVolume;
    }
    for (const [, nodes] of this.audioGraphNodes) {
      if (nodes.gainNode) {
        nodes.gainNode.gain.value = safeVolume;
      }
    }
    this.audioPool.forEach(audio => {
      if (!this.audioGraphNodes.has(audio._poolIndex)) {
        audio.volume = safeVolume;
      }
    });
  }

  async reconnect() {
    if (!this.activeAudio || this.activeIndex === -1)
      throw new Error('No active audio to reconnect');

    const state = this.poolState.get(this.activeIndex);
    if (!state || !state.stationId)
      throw new Error('No active station to reconnect');

    const index = this.activeIndex;
    const stationId = state.stationId;
    const opId = state.opId;

    return this.networkRecovery.startRecovery(
      `audio-${index}-${stationId}`,
      async (attempt) => {
        const audio = this.activeAudio;
        const baseUrl = this.activeUrlByIndex.get(index) || audio.currentSrc || audio.src || '';
        const url = this.resolveStreamUrl(baseUrl, attempt);

        if (attempt === 1) {
          await this.softReconnect(audio, url);
        } else {
          await this.hardReconnect(audio, url, state.isHLS);
        }

        this.activeUrlByIndex.set(index, url);

        const wasPlaying = !audio.paused;
        if (wasPlaying) {
          const playPromise = audio.play();
          this.playPromises.set(index, playPromise);
          await playPromise;
          this.clearPlayPromise(index);
        }

        return { success: true, attempt };
      },
      {
        maxRetries: 3,
        immediate: true,
        customDelays: [500, 1000, 2000]
      }
    );
  }

  clearAll() {
    for (const controller of this.loadAbortControllers.values()) {
      controller.abort();
    }
    this.loadAbortControllers.clear();
    this.loadingStations.clear();

    this.networkRecovery.clearAll();
    this.audioPool.forEach((audio, index) => {
      this.clearWatchdog(index);
      this.stopProgressMonitor(index);
      this.clearPlayPromise(index);
      if (audio._hlsInstance) {
        audio._hlsInstance.destroy();
        audio._hlsInstance = null;
      }
      try { if (!audio.paused) audio.pause(); } catch {}
      try { audio.removeAttribute('src'); } catch {}
      try { audio.load(); } catch {}
      const state = this.poolState.get(index);
      if (state) {
        state.state = 'idle';
        state.stationId = null;
        state.errorCount = 0;
        state.stallDetected = false;
        state.isHLS = false;
        state.isPreload = false;
        state.opId = null;
        state.connectionQuality = 'good';
        state.recoveryAttempt = 0;
        state.playIntended = false;
      }
      this.activeUrlByIndex.delete(index);
    });
    this.hlsInstances.clear();
    this.playPromises.clear();
    this.activeAudio = null;
    this.activeIndex = -1;
    this.preloadQueue.clear();
    this.errorCount = 0;
    this.connectionStates.forEach(state => {
      state.hasError = false;
      state.recovering = false;
      state.lastSuccess = Date.now();
    });
  }

  destroy() {
    this.clearAll();
    this.networkRecovery.destroy();
    this.watchdogs.forEach(id => clearInterval(id));
    this.watchdogs.clear();
    this.progressMonitors.forEach(id => clearInterval(id));
    this.progressMonitors.clear();
    this.hlsInstances.forEach(hls => hls.destroy());
    this.hlsInstances.clear();
    for (const [, nodes] of this.audioGraphNodes) {
      try { if (nodes.gainNode) nodes.gainNode.disconnect(); } catch {}
      try { if (nodes.sourceNode) nodes.sourceNode.disconnect(); } catch {}
    }
    this.audioGraphNodes.clear();
    if (this.audioContext && this.audioContext.state !== 'closed' && !this.externalAudioContext) {
      try { this.audioContext.close(); } catch {}
    }
    this.audioPool = [];
    this.poolState.clear();
    this.activeUrlByIndex.clear();
    this.connectionStates.clear();
    this.lastErrorTime.clear();
    this.playPromises.clear();
  }

  getDebugInfo() {
    const poolInfo = Array.from(this.poolState.entries()).map(([index, state]) => ({
      index,
      state: state.state,
      stationId: state.stationId,
      errorCount: state.errorCount,
      isActive: index === this.activeIndex,
      isHLS: state.isHLS,
      isPreload: state.isPreload,
      bufferAhead: state.audio.src ? this.getBufferAhead(state.audio) : 0,
      currentTime: state.audio.currentTime,
      duration: state.audio.duration,
      paused: state.audio.paused,
      networkState: state.audio.networkState,
      readyState: state.audio.readyState,
      volume: state.audio.volume,
      errorRetries: state.audio._errorRetries,
      hasSourceNode: !!this.audioGraphNodes.get(index)?.sourceNode,
      hasGainNode: !!this.audioGraphNodes.get(index)?.gainNode,
      opId: state.opId,
      connectionQuality: state.connectionQuality,
      recoveryAttempt: state.recoveryAttempt,
      actualUrl: this.activeUrlByIndex.get(index) || state.audio.src,
      playIntended: state.playIntended
    }));

    const connectionInfo = Array.from(this.connectionStates.entries()).map(([index, state]) => ({
      index,
      hasError: state.hasError,
      recovering: state.recovering,
      timeSinceSuccess: Date.now() - state.lastSuccess
    }));

    return {
      poolSize: this.poolSize,
      activeIndex: this.activeIndex,
      isTransitioning: this.isTransitioning,
      poolStates: poolInfo,
      connectionStates: connectionInfo,
      preloadedStations: Array.from(this.preloadQueue.keys()),
      activeWatchdogs: Array.from(this.watchdogs.keys()),
      activeMonitors: Array.from(this.progressMonitors.keys()),
      audioContextState: this.audioContext?.state,
      hasExternalAudioContext: this.externalAudioContext,
      globalErrorCount: this.errorCount,
      currentVolume: this.currentVolume,
      hlsSupport: this.hlsSupport,
      activeHLSInstances: this.hlsInstances.size,
      audioGraphNodes: this.audioGraphNodes.size,
      reservedIndices: Array.from(this.reservedIndices),
      activeRecoveries: Array.from(this.networkRecovery.activeRecoveries.keys()),
      loadingStations: Array.from(this.loadingStations.keys()),
      activePlayPromises: Array.from(this.playPromises.keys())
    };
  }
}