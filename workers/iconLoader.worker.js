
'use strict';

const DEFAULT_SIZE = 180;       // целевой размер стороны
const DEFAULT_QUALITY = 0.8;    // качество WebP
const DEFAULT_TIMEOUT = 5000;   // мс

self.onmessage = async (e) => {
  const payload = e?.data || {};
  const id = String(payload.id || '');
  const url = String(payload.url || '');
  const timeout = Number.isFinite(payload.timeout) ? payload.timeout : DEFAULT_TIMEOUT;
  const size = Number.isFinite(payload.size) ? payload.size : DEFAULT_SIZE;
  const quality = typeof payload.quality === 'number' ? payload.quality : DEFAULT_QUALITY;

  if (!id || !url) {
    self.postMessage({ id, success: false, error: 'Invalid parameters' });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      credentials: 'same-origin',
      cache: 'no-store',
      mode: 'cors'
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const srcBlob = await res.blob();

    if (srcBlob.type && !srcBlob.type.startsWith('image/')) {
      throw new Error(`Unexpected content-type: ${srcBlob.type}`);
    }

    // Основной путь: OffscreenCanvas → WebP Blob
    if (typeof OffscreenCanvas !== 'undefined') {
      const bitmap = await createImageBitmap(srcBlob);

      const w = size;
      const h = size;
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d', { alpha: true });

      // Заполняем фон прозрачностью и рисуем битмап, приводя к квадрату
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();

      const webpBlob = await canvas.convertToBlob({ type: 'image/webp', quality });

      clearTimeout(timeoutId);
      self.postMessage(
        { id, success: true, blob: webpBlob, width: w, height: h, type: 'image/webp' }
      );
      return;
    }

    // Фолбек: OffscreenCanvas нет — отдаём исходный Blob как есть
    clearTimeout(timeoutId);
    self.postMessage(
      { id, success: true, blob: srcBlob, type: srcBlob.type || 'application/octet-stream' }
    );
  } catch (err) {
    clearTimeout(timeoutId);
    if (err && err.name === 'AbortError') {
      self.postMessage({ id, success: false, error: 'Timeout' });
    } else {
      self.postMessage({ id, success: false, error: String(err?.message || err) });
    }
  }
};
