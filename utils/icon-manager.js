// src/utils/icon-manager.js
import { createCache } from './performance.js';

export class IconManager {
  constructor() {
    this.cache = createCache(200);
    this.loading = new Map();
    this.failed = new Set();
    this.observers = new Map();
    this.retryDelays = [1000, 3000, 8000];
    this.retryCount = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.maxConcurrent = 3;
    this.activeLoads = 0;
    this.pendingRequests = new Map();
    this.fallbackSvg = this.generateFallbackSvg();
    this.initWorker();
  }

  initWorker() {
    this.worker = new Worker('/src/workers/iconLoader.worker.js', { type: 'module' });

    this.worker.onmessage = (e) => {
      const { id, success, bitmap, error } = e.data;
      if (this.pendingRequests.has(id)) {
        this.pendingRequests.delete(id);
      }
      if (success) {
        this.handleLoadSuccess(id, bitmap);
      } else {
        this.handleLoadError(id, error);
      }
    };

    this.worker.onerror = (error) => {
      console.error('Icon worker error:', error);
      this.worker.terminate();
      this.worker = null;
    };
  }

  generateFallbackSvg() {
    return (id) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cdefs%3E%3ClinearGradient id='g${id}' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23${this.getColorForId(id)};stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23${this.getColorForId(id + 100)};stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='180' height='180' rx='24' fill='url(%23g${id})' /%3E%3Ctext x='90' y='100' text-anchor='middle' fill='white' font-size='60' font-family='Arial' font-weight='bold'%3E${id + 1}%3C/text%3E%3C/svg%3E`;
  }

  getColorForId(id) {
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'F06292', '64B5F6', '81C784', 'FFD54F', 'FF8A65'];
    return colors[id % colors.length];
  }

  async getIcon(stationId, url, priority = false) {
    const cacheKey = `station_${stationId}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.failed.has(cacheKey) && (this.retryCount.get(cacheKey) || 0) >= this.retryDelays.length) {
      return this.fallbackSvg(stationId);
    }

    if (this.loading.has(cacheKey)) {
      return new Promise((resolve) => {
        const observers = this.observers.get(cacheKey) || [];
        observers.push(resolve);
        this.observers.set(cacheKey, observers);
      });
    }

    return this.loadIcon(stationId, url, priority);
  }

  async loadIcon(stationId, url, priority) {
    const cacheKey = `station_${stationId}`;
    this.loading.set(cacheKey, true);

    const loadPromise = new Promise((resolve) => {
      const observers = this.observers.get(cacheKey) || [];
      observers.push(resolve);
      this.observers.set(cacheKey, observers);
    });

    if (priority) {
      this.processLoad(stationId, url);
    } else {
      this.preloadQueue.push({ stationId, url });
      this.processQueue();
    }

    return loadPromise;
  }

  async processQueue() {
    if (this.isPreloading || this.activeLoads >= this.maxConcurrent || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;

    while (this.preloadQueue.length > 0 && this.activeLoads < this.maxConcurrent) {
      const { stationId, url } = this.preloadQueue.shift();
      this.processLoad(stationId, url);
    }

    this.isPreloading = false;
  }

  async processLoad(stationId, url) {
    this.activeLoads++;
    const cacheKey = `station_${stationId}`;
    const requestId = `${cacheKey}_${Date.now()}`;

    try {
      if (this.worker) {
        this.pendingRequests.set(requestId, true);
        this.worker.postMessage({ url, id: requestId, timeout: 5000 });
      } else {
        await this.loadImageFallback(stationId, url);
      }
    } catch (error) {
      this.handleLoadError(cacheKey, error && error.message ? error.message : String(error));
      this.scheduleRetry(stationId, url);
    } finally {
      this.activeLoads--;
      this.processQueue();
    }
  }

  async loadImageFallback(stationId, url) {
    const cacheKey = `station_${stationId}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loadPromise = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
    });

    img.src = url;

    const result = await Promise.race([
      loadPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(result, 0, 0, 180, 180);

    const dataUrl = canvas.toDataURL('image/webp', 0.8);
    this.handleLoadSuccess(cacheKey, dataUrl);
  }

  async handleLoadSuccess(id, data) {
    const cacheKey = id.includes('_') ? id.split('_')[0] + '_' + id.split('_')[1] : id;

    let imageData = data;
    if (data instanceof ImageBitmap) {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 180;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(data, 0, 0, 180, 180);
      imageData = canvas.toDataURL('image/webp', 0.8);
      data.close();
    }

    this.cache.set(cacheKey, imageData);
    this.loading.delete(cacheKey);
    this.failed.delete(cacheKey);
    this.retryCount.delete(cacheKey);

    const observers = this.observers.get(cacheKey) || [];
    observers.forEach((resolve) => resolve(imageData));
    this.observers.delete(cacheKey);
  }

  handleLoadError(idOrCacheKey, error) {
    const cacheKey = idOrCacheKey.includes('_') ? idOrCacheKey.split('_')[0] + '_' + idOrCacheKey.split('_')[1] : idOrCacheKey;
    this.loading.delete(cacheKey);
    this.failed.add(cacheKey);

    const stationId = parseInt(cacheKey.replace('station_', ''), 10);
    const fallback = this.fallbackSvg(stationId);

    const observers = this.observers.get(cacheKey) || [];
    observers.forEach((resolve) => resolve(fallback));
    this.observers.delete(cacheKey);
  }

  scheduleRetry(stationId, url) {
    const cacheKey = `station_${stationId}`;
    const retries = this.retryCount.get(cacheKey) || 0;

    if (retries < this.retryDelays.length) {
      const delay = this.retryDelays[retries];
      this.retryCount.set(cacheKey, retries + 1);

      setTimeout(() => {
        this.failed.delete(cacheKey);
        this.loadIcon(stationId, url, false);
      }, delay);
    }
  }

  preloadIcons(stations) {
    stations.forEach((station, index) => {
      setTimeout(() => {
        this.getIcon(station.id, `/Icons/icon${station.id + 1}.png`, false);
      }, index * 50);
    });
  }

  clearCache() {
    this.cache.clear();
    this.failed.clear();
    this.retryCount.clear();
    this.pendingRequests.clear();
  }

  getCacheSize() {
    return this.cache.size();
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.clearCache();
    this.observers.clear();
    this.loading.clear();
    this.preloadQueue = [];
  }
}
