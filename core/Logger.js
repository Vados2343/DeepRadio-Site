import { getStorageKey } from './config.js';

class Logger {
  constructor() {
    this.enabled = false;
    this.sessionId = null;
    this.metrics = new Map();
    this.events = [];
    this.maxEvents = 1000;
    this.checkDebugMode();
  }

  checkDebugMode() {
    try {
      this.enabled = localStorage.getItem(getStorageKey('debug')) === '1';
    } catch {
      this.enabled = false;
    }
  }

  enable() {
    this.enabled = true;
    localStorage.setItem(getStorageKey('debug'), '1');
    console.log('[Logger] Debug mode enabled');
  }

  disable() {
    this.enabled = false;
    localStorage.removeItem(getStorageKey('debug'));
    console.log('[Logger] Debug mode disabled');
  }

  setSessionId(id) {
    this.sessionId = id;
  }

  log(category, message, data = {}) {
    if (!this.enabled) return;

    const event = {
      timestamp: Date.now(),
      category,
      message,
      sessionId: this.sessionId,
      ...data
    };

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents / 2);
    }

    const prefix = `[${category}]`;
    const details = Object.keys(data).length > 0 ? data : '';

    if (details) {
      console.log(prefix, message, details);
    } else {
      console.log(prefix, message);
    }
  }

  metric(name, value, unit = '') {
    if (!this.enabled) return;

    const key = `${name}_${unit}`.replace(/\s+/g, '_');

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        name,
        unit,
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity
      });
    }

    const metric = this.metrics.get(key);
    metric.values.push({ value, timestamp: Date.now() });
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);

    if (metric.values.length > 100) {
      metric.values = metric.values.slice(-50);
    }
  }

  timer(name) {
    const startTime = performance.now();

    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.metric(name, duration, 'ms');
        return duration;
      }
    };
  }

  audioEvent(event, data = {}) {
    this.log('Audio', event, {
      stationId: data.stationId,
      stationName: data.stationName,
      index: data.index,
      state: data.state,
      ...data
    });
  }

  fsmTransition(from, to, event, data = {}) {
    this.log('FSM', `${from} → ${to}`, {
      event,
      ...data
    });
  }

  networkEvent(event, data = {}) {
    this.log('Network', event, {
      url: data.url,
      status: data.status,
      duration: data.duration,
      ...data
    });
  }

  bufferStatus(index, data) {
    if (!this.enabled) return;

    this.log('Buffer', `Audio ${index}`, {
      ahead: `${data.ahead}s`,
      behind: `${data.behind}s`,
      buffered: `${data.buffered}s`,
      isLow: data.isLow,
      isOptimal: data.isOptimal
    });
  }

  error(category, message, error) {
    const errorData = {
      message: error?.message || message,
      stack: error?.stack,
      code: error?.code,
      name: error?.name
    };

    this.log(`Error:${category}`, message, errorData);

    if (this.enabled) {
      console.error(`[${category}]`, message, error);
    }
  }

  getStats() {
    const stats = {};

    this.metrics.forEach((metric, key) => {
      stats[key] = {
        count: metric.count,
        avg: metric.sum / metric.count,
        min: metric.min,
        max: metric.max,
        last: metric.values[metric.values.length - 1]?.value
      };
    });

    return stats;
  }

  getRecentEvents(category = null, limit = 50) {
    let events = this.events;

    if (category) {
      events = events.filter(e => e.category === category);
    }

    return events.slice(-limit);
  }

  exportData() {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      events: this.events,
      metrics: this.getStats()
    };
  }

  clear() {
    this.events = [];
    this.metrics.clear();
    this.sessionId = null;
  }
}

export const logger = new Logger();

if (typeof window !== 'undefined') {
  window.__deepRadioLogger = logger;
  window.__deepRadioStats = () => logger.getStats();
  window.__deepRadioEvents = (category, limit) => logger.getRecentEvents(category, limit);
  window.__deepRadioExport = () => logger.exportData();
}