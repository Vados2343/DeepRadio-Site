export class NetworkRecoveryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 5;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.retryMultiplier = options.retryMultiplier || 1.5;
    this.onRetry = options.onRetry || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
    this.onFailure = options.onFailure || (() => {});
    this.activeRecoveries = new Map();
    this.retryTimers = new Map();
    this.networkState = navigator.onLine ? 'online' : 'offline';
    this.lastNetworkChange = Date.now();
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.networkState = 'online';
      this.lastNetworkChange = Date.now();
      this.accelerateRecoveries();
    });

    window.addEventListener('offline', () => {
      this.networkState = 'offline';
      this.lastNetworkChange = Date.now();
      this.pauseRecoveries();
    });
  }

  async startRecovery(id, recoveryFn, options = {}) {
    if (this.activeRecoveries.has(id)) {
      return this.activeRecoveries.get(id);
    }

    const recovery = {
      id,
      fn: recoveryFn,
      attempts: 0,
      startTime: Date.now(),
      lastAttempt: 0,
      state: 'pending',
      options: {
        maxRetries: options.maxRetries || this.maxRetries,
        immediate: options.immediate || false,
        silent: options.silent || false,
        customDelays: options.customDelays || null
      }
    };

    this.activeRecoveries.set(id, recovery);

    if (recovery.options.immediate) {
      return this.attemptRecovery(recovery);
    }

    return this.scheduleRecovery(recovery, 0);
  }

  async attemptRecovery(recovery) {
    if (this.networkState === 'offline' && recovery.attempts > 0) {
      return this.scheduleRecovery(recovery, this.calculateDelay(recovery));
    }

    recovery.attempts++;
    recovery.lastAttempt = Date.now();
    recovery.state = 'attempting';

    try {
      const result = await recovery.fn(recovery.attempts);
      recovery.state = 'success';
      this.activeRecoveries.delete(recovery.id);
      this.clearTimer(recovery.id);

      if (!recovery.options.silent) {
        this.onSuccess(recovery.id, result, recovery.attempts);
      }

      return result;
    } catch (error) {
      if (this.shouldRetry(recovery, error)) {
        const delay = this.calculateDelay(recovery);
        recovery.state = 'waiting';

        if (!recovery.options.silent) {
          this.onRetry(recovery.id, recovery.attempts, delay, error);
        }

        return this.scheduleRecovery(recovery, delay);
      } else {
        recovery.state = 'failed';
        this.activeRecoveries.delete(recovery.id);
        this.clearTimer(recovery.id);

        if (!recovery.options.silent) {
          this.onFailure(recovery.id, error, recovery.attempts);
        }

        throw error;
      }
    }
  }

  scheduleRecovery(recovery, delay) {
    return new Promise((resolve, reject) => {
      this.clearTimer(recovery.id);

      const timer = setTimeout(async () => {
        try {
          const result = await this.attemptRecovery(recovery);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.retryTimers.set(recovery.id, timer);
    });
  }

  calculateDelay(recovery) {
    if (recovery.options.customDelays && recovery.attempts <= recovery.options.customDelays.length) {
      return recovery.options.customDelays[recovery.attempts - 1];
    }

    const exponentialDelay = this.baseDelay * Math.pow(this.retryMultiplier, recovery.attempts - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    const delay = Math.min(exponentialDelay + jitter, this.maxDelay);

    if (this.networkState === 'online' && Date.now() - this.lastNetworkChange < 5000) {
      return Math.min(delay * 0.5, 2000);
    }

    return delay;
  }

  shouldRetry(recovery, error) {
    if (recovery.attempts >= recovery.options.maxRetries) {
      return false;
    }

    if (error?.code === 'ABORT_ERR' || error?.name === 'AbortError') {
      return false;
    }

    if (error?.message?.includes('DEMUXER_ERROR') && recovery.attempts < 2) {
      return true;
    }

    const isNetworkError = error?.code === 2 ||
                          error?.message?.includes('network') ||
                          error?.message?.includes('fetch') ||
                          error?.message?.includes('CORS');

    return isNetworkError || this.networkState === 'offline';
  }

  accelerateRecoveries() {
    for (const recovery of this.activeRecoveries.values()) {
      if (recovery.state === 'waiting') {
        this.clearTimer(recovery.id);
        this.scheduleRecovery(recovery, 500);
      }
    }
  }

  pauseRecoveries() {
    for (const recovery of this.activeRecoveries.values()) {
      if (recovery.state === 'attempting') {
        recovery.state = 'paused';
      }
    }
  }

  cancelRecovery(id) {
    this.clearTimer(id);
    this.activeRecoveries.delete(id);
  }

  clearTimer(id) {
    if (this.retryTimers.has(id)) {
      clearTimeout(this.retryTimers.get(id));
      this.retryTimers.delete(id);
    }
  }

  getRecoveryState(id) {
    const recovery = this.activeRecoveries.get(id);
    return recovery ? {
      attempts: recovery.attempts,
      state: recovery.state,
      elapsed: Date.now() - recovery.startTime
    } : null;
  }

  isRecovering(id) {
    return this.activeRecoveries.has(id);
  }

  clearAll() {
    for (const id of this.retryTimers.keys()) {
      this.clearTimer(id);
    }
    this.activeRecoveries.clear();
  }

  destroy() {
    this.clearAll();
  }
}