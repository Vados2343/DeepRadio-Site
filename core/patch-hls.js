import { logger } from './Logger.js';

function extractOriginalUrl(proxiedUrl) {
  try {
    const url = new URL(proxiedUrl, window.location.origin);
    const encoded = url.searchParams.get('url');
    if (encoded) return decodeURIComponent(encoded);
  } catch {}
  return proxiedUrl;
}

// Патч для AudioPoolManager - улучшенная поддержка HLS
const originalCheckHLS = AudioPoolManager.prototype.checkHLSSupport;
AudioPoolManager.prototype.checkHLSSupport = function() {
  const video = document.createElement('video');
  const nativeHLS = video.canPlayType('application/vnd.apple.mpegurl') !== '';
  const hlsJs = typeof window.Hls !== 'undefined' &&
                typeof window.Hls.isSupported === 'function' &&
                window.Hls.isSupported();

  logger.log('HLS', 'Support check', { native: nativeHLS, hlsJs });
  return { native: nativeHLS, hlsJs };
};

const originalIsHLS = AudioPoolManager.prototype.isHLSUrl;
AudioPoolManager.prototype.isHLSUrl = function(url) {
  if (!url) return false;

  // Проверяем прямой URL
  if (/\.m3u8(\?|$)/i.test(url)) return true;

  // Проверяем URL внутри прокси
  try {
    const urlObj = new URL(url, window.location.origin);
    const innerUrl = urlObj.searchParams.get('url') || '';
    if (/\.m3u8(\?|$)/i.test(innerUrl)) return true;
  } catch {}

  return false;
};

const originalLoadHLS = AudioPoolManager.prototype.loadHLSStream;
AudioPoolManager.prototype.loadHLSStream = async function(audio, url, preload = false) {
  const index = audio._poolIndex;
  const state = this.poolState.get(index);

  const originalUrl = extractOriginalUrl(url);
  const proxiedManifestUrl = `/api/proxy/hls?url=${encodeURIComponent(originalUrl)}`;

  logger.log('HLS', 'Loading stream', {
    index,
    originalUrl,
    proxiedUrl: proxiedManifestUrl,
    preload,
    nativeSupport: this.hlsSupport.native,
    hlsJsSupport: this.hlsSupport.hlsJs
  });

  // Используем нативную поддержку HLS (Safari)
  if (this.hlsSupport.native) {
    audio.src = proxiedManifestUrl;
    try {
      audio.load();
    } catch (e) {
      logger.error('HLS', 'Native load failed', e);
    }
    state.isHLS = true;
    return;
  }

  // Используем hls.js для браузеров без нативной поддержки
  if (this.hlsSupport.hlsJs && window.Hls) {
    // Уничтожаем старый инстанс если есть
    if (audio._hlsInstance) {
      try {
        audio._hlsInstance.destroy();
      } catch {}
      audio._hlsInstance = null;
    }

    const Hls = window.Hls;
    const DefaultLoader = Hls.DefaultConfig.loader;

    // Кастомный loader для проксирования всех запросов
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

    const hls = new Hls({
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

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      logger.log('HLS', 'Media attached', { index });
      hls.loadSource(originalUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      logger.log('HLS', 'Manifest parsed', { index, preload });

      // НЕ запускаем автоматически play() - это решает Store
      if (!preload && !state.isPreload && state.playIntended) {
        audio.play().catch(e => {
          logger.error('HLS', 'Auto-play failed', e);
        });
      }
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      logger.error('HLS', 'HLS.js error', {
        type: data.type,
        details: data.details,
        fatal: data.fatal,
        index
      });

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            logger.log('HLS', 'Network error, trying to recover', { index });
            hls.startLoad();
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            logger.log('HLS', 'Media error, trying to recover', { index });
            hls.recoverMediaError();
            break;

          default:
            logger.error('HLS', 'Fatal error, destroying instance', { index });
            hls.destroy();
            break;
        }
      }
    });

    hls.attachMedia(audio);
    audio._hlsInstance = hls;
    state.isHLS = true;
    this.hlsInstances.set(index, hls);

    logger.log('HLS', 'hls.js configured', { index });
    return;
  }

  throw new Error('HLS not supported and hls.js not available');
};

logger.log('Patch', 'HLS patch applied successfully');