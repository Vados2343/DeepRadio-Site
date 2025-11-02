export class PlayerStateMachine {
  constructor(options = {}) {
    this.currentState = 'IDLE';
    this.previousState = null;
    this.stateData = {};
    this.onStateChange = options.onStateChange || (() => {});
    this.onError = options.onError || (() => {});
    this.transitions = {
      IDLE: { LOAD: 'LOADING', ERROR: 'ERROR' },
      LOADING: { LOADED: 'LOADED', READY: 'READY', PLAY: 'BUFFERING', ERROR: 'ERROR', SWITCH: 'SWITCHING' },
      LOADED: { BUFFERING: 'BUFFERING', PLAY: 'BUFFERING', ERROR: 'ERROR', SWITCH: 'SWITCHING' },
      BUFFERING: { READY: 'READY', ERROR: 'ERROR', PAUSE: 'PAUSED', SWITCH: 'SWITCHING' },
      READY: { PLAY: 'PLAYING', FORCE: 'PLAYING', ERROR: 'ERROR', SWITCH: 'SWITCHING' },
      PLAYING: { PAUSE: 'PAUSED', WAITING: 'WAITING', ERROR: 'ERROR', END: 'IDLE', SWITCH: 'SWITCHING' },
      SWITCHING: { READY: 'READY', PLAY: 'PLAYING', ERROR: 'ERROR', BUFFERING: 'BUFFERING', LOADED: 'LOADED' },
      WAITING: { RESUME: 'PLAYING', PAUSE: 'PAUSED', STALLED: 'STALLED', ERROR: 'ERROR', SWITCH: 'SWITCHING' },
      PAUSED: { PLAY: 'PLAYING', RESUME: 'PLAYING', WAITING: 'PAUSED_WAITING', ERROR: 'ERROR', STOP: 'IDLE', SWITCH: 'SWITCHING' },
      PAUSED_WAITING: { PLAY: 'WAITING', RESUME: 'WAITING', STOP: 'IDLE' },
      STALLED: { RECOVER: 'RECOVERING', ERROR: 'ERROR', PAUSE: 'PAUSED', SWITCH: 'SWITCHING' },
      RECOVERING: { RECOVERED: 'BUFFERING', FAILED: 'ERROR' },
      ERROR: { RETRY: 'RETRYING', RESET: 'IDLE', LOAD: 'LOADING' },
      RETRYING: { LOAD: 'LOADING', ERROR: 'ERROR' }
    };
    this.stateHistory = [];
    this.maxHistorySize = 100;
    this.metadata = {
      loadStartTime: null,
      lastStateChange: Date.now(),
      errorCount: 0,
      recoveryAttempts: 0,
      stallCount: 0,
      retryCount: 0,
      switchCount: 0
    };
  }

  getState() { return this.currentState; }
  isInState(state) { return this.currentState === state; }
  isInStates(...states) { return states.includes(this.currentState); }
  canTransition(event) { return this.transitions[this.currentState]?.[event] !== undefined; }

  transition(event, payload = null) {
    const fromState = this.currentState;
    const toState = this.transitions[fromState]?.[event];
    if (!toState) {
      return false;
    }
    this.addToHistory(fromState, event, toState, payload);
    this.onExit(fromState, toState, event);
    this.previousState = fromState;
    this.currentState = toState;
    this.stateData = { event, payload, timestamp: Date.now() };
    this.metadata.lastStateChange = Date.now();
    this.onEnter(toState, fromState, event);
    this.onStateChange({
      from: fromState,
      to: toState,
      event,
      payload,
      timestamp: Date.now(),
      metadata: { ...this.metadata }
    });
    return true;
  }

  onExit(state, nextState, event) {
    switch (state) {
      case 'LOADING':
        if (nextState === 'ERROR') this.metadata.errorCount++;
        break;
      case 'PLAYING':
        if (nextState === 'WAITING') this.metadata.lastPlayingTime = Date.now();
        if (nextState === 'SWITCHING') this.metadata.switchCount++;
        break;
      case 'STALLED':
        if (nextState !== 'RECOVERING') this.metadata.stallCount = 0;
        break;
      case 'ERROR':
        if (nextState === 'RETRYING' || nextState === 'LOADING') {
          this.metadata.loadStartTime = Date.now();
        }
        break;
      case 'RETRYING':
        if (nextState === 'ERROR') {
          this.metadata.retryCount++;
        } else {
          this.metadata.retryCount = 0;
        }
        break;
    }
  }

  onEnter(state, prevState, event) {
    switch (state) {
      case 'LOADING':
        this.metadata.loadStartTime = Date.now();
        if (prevState !== 'RETRYING') {
          this.metadata.recoveryAttempts = 0;
        }
        break;
      case 'PLAYING':
        this.metadata.errorCount = 0;
        this.metadata.stallCount = 0;
        this.metadata.recoveryAttempts = 0;
        this.metadata.retryCount = 0;
        break;
      case 'SWITCHING':
        this.metadata.switchCount++;
        break;
      case 'STALLED':
        this.metadata.stallCount++;
        break;
      case 'RECOVERING':
        this.metadata.recoveryAttempts++;
        break;
      case 'RETRYING':
        this.metadata.retryCount++;
        break;
      case 'ERROR':
        if (this.stateData.payload) this.onError(this.stateData.payload);
        break;
    }
  }

  addToHistory(from, event, to, payload) {
    const entry = {
      from,
      event,
      to,
      payload: payload ? { ...payload } : null,
      timestamp: Date.now(),
      duration: Date.now() - this.metadata.lastStateChange
    };
    this.stateHistory.push(entry);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }
  }

  getHistory(limit = 10) { return this.stateHistory.slice(-limit); }
  getFullHistory() { return [...this.stateHistory]; }

  isPlayable() { return ['READY', 'PLAYING', 'PAUSED', 'WAITING', 'PAUSED_WAITING', 'SWITCHING'].includes(this.currentState); }
  isPauseable() { return ['PLAYING', 'WAITING', 'BUFFERING', 'STALLED', 'SWITCHING'].includes(this.currentState); }
  isRecoverable() { return this.currentState === 'STALLED' && this.metadata.recoveryAttempts < 3; }
  isRetryable() { return this.currentState === 'ERROR' && this.metadata.retryCount < 5; }
  getTimeSinceLastStateChange() { return Date.now() - this.metadata.lastStateChange; }
  getLoadDuration() { return this.metadata.loadStartTime ? Date.now() - this.metadata.loadStartTime : 0; }

  reset() {
    this.currentState = 'IDLE';
    this.previousState = null;
    this.stateData = {};
    this.stateHistory = [];
    this.metadata = {
      loadStartTime: null,
      lastStateChange: Date.now(),
      errorCount: 0,
      recoveryAttempts: 0,
      stallCount: 0,
      retryCount: 0,
      switchCount: 0
    };
    this.onStateChange({
      from: null,
      to: 'IDLE',
      event: 'RESET',
      timestamp: Date.now(),
      metadata: { ...this.metadata }
    });
  }

  forceState(state) {
    const prevState = this.currentState;
    this.currentState = state;
    this.metadata.lastStateChange = Date.now();
    this.addToHistory(prevState, 'FORCE', state, { forced: true });
    this.onStateChange({
      from: prevState,
      to: state,
      event: 'FORCE',
      timestamp: Date.now(),
      metadata: { ...this.metadata },
      forced: true
    });
  }

  destroy() {
    this.stateHistory = [];
    this.metadata = {};
    this.onStateChange = () => {};
    this.onError = () => {};
  }

  getDebugInfo() {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      stateData: this.stateData,
      metadata: { ...this.metadata },
      canPause: this.isPauseable(),
      canPlay: this.isPlayable(),
      canRecover: this.isRecoverable(),
      canRetry: this.isRetryable(),
      timeSinceChange: this.getTimeSinceLastStateChange(),
      recentHistory: this.getHistory(20)
    };
  }
}

export const PlayerStates = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  LOADED: 'LOADED',
  BUFFERING: 'BUFFERING',
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  WAITING: 'WAITING',
  PAUSED_WAITING: 'PAUSED_WAITING',
  SWITCHING: 'SWITCHING',
  STALLED: 'STALLED',
  RECOVERING: 'RECOVERING',
  ERROR: 'ERROR',
  RETRYING: 'RETRYING'
};

export const PlayerEvents = {
  LOAD: 'LOAD',
  LOADED: 'LOADED',
  BUFFERING: 'BUFFERING',
  READY: 'READY',
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  WAITING: 'WAITING',
  STALLED: 'STALLED',
  SWITCH: 'SWITCH',
  RECOVER: 'RECOVER',
  RECOVERED: 'RECOVERED',
  FAILED: 'FAILED',
  ERROR: 'ERROR',
  RETRY: 'RETRY',
  RESET: 'RESET',
  STOP: 'STOP',
  END: 'END',
  FORCE: 'FORCE'
};