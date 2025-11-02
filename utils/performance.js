export function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

export function rafThrottle(func) {
  let rafId = null;
  return function (...args) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

export function createCache(maxSize = 100) {
  const cache = new Map();

  return {
    get(key) {
      const item = cache.get(key);
      if (item) {
        cache.delete(key);
        cache.set(key, item);
        return item;
      }
      return undefined;
    },

    set(key, value) {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },

    has(key) {
      return cache.has(key);
    },

    clear() {
      cache.clear();
    },

    size() {
      return cache.size;
    }
  };
}

export function batchDOMUpdates(updates) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
      resolve();
    });
  });
}

export function observeIntersection(elements, callback, options = {}) {
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => callback(el, true));
    return { disconnect: () => {} };
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      callback(entry.target, entry.isIntersecting, entry);
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  });

  elements.forEach(el => observer.observe(el));

  return observer;
}

export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function createPool(createFn, resetFn, initialSize = 5) {
  const pool = [];

  for (let i = 0; i < initialSize; i++) {
    pool.push(createFn());
  }

  return {
    acquire() {
      return pool.length > 0 ? pool.pop() : createFn();
    },

    release(item) {
      if (resetFn) resetFn(item);
      pool.push(item);
    },

    size() {
      return pool.length;
    }
  };
}

export function measurePerformance(name, fn) {
  return async function (...args) {
    const start = performance.now();
    const result = await fn.apply(this, args);
    const duration = performance.now() - start;

    if (duration > 16) {
      console.warn(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  };
}

export function createWorker(fn) {
  const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

export function scheduleWork(tasks, timeSlice = 5) {
  return new Promise(resolve => {
    let index = 0;

    function runBatch() {
      const start = performance.now();

      while (index < tasks.length && performance.now() - start < timeSlice) {
        tasks[index]();
        index++;
      }

      if (index < tasks.length) {
        requestAnimationFrame(runBatch);
      } else {
        resolve();
      }
    }

    runBatch();
  });
}