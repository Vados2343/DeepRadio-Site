export const Config = {
  audio: {
    poolSize: 3,
    fadeTime: 300,
    loadTimeout: 25000, // Уменьшено с 45 до 25 секунд
    bufferCheckInterval: 2000,
    stallThreshold: 8000,
    minBufferAhead: 0.5,
    optimalBufferAhead: 2,
    maxRetries: 3,
    retryDelay: 1500,
    watchdogInterval: 1500
  },

  metadata: {
    timeout: 10000,
    cacheTTL: 30000,
    episodicTTL: 60000,
    maxCacheSize: 100,
    backoffIntervals: [30000, 60000, 120000, 180000, 300000],
    maxUpdateInterval: 120000,
    updateInterval: 30000,
    maxRetries: 2,
    retryDelay: 1500
  },

  storage: {
    prefix: 'deepradio_',
    keys: {
      favorites: 'favorites',
      recent: 'recent',
      playlists: 'playlists',
      volume: 'volume',
      theme: 'theme',
      accent: 'accent',
      animations: 'animations',
      compact: 'compact',
      displayMode: 'displayMode',
      visualizerClass: 'visualizerClass',
      visualizerMode: 'visualizerMode',
      visualizerEnabled: 'visualizerEnabled',
      vizOpacity: 'vizOpacity',
      headerLayout: 'headerLayout',
      playerStyle: 'playerStyle',
      centerElements: 'centerElements',
      last: 'last',
      trackBuffer: 'trackBuffer',
      trackCache: 'trackCache',
      listeningStats: 'listeningStats',
      customStations: 'customStations',
      hlsFailedStations: 'hlsFailedStations',
      likePromptsDisabled: 'likePromptsDisabled',
      sessionLikes: 'sessionLikes',
      debug: 'debug'
    }
  },

  domains: {
    proxyRequired: [
      'online.hitfm.ua',
      'online.kissfm.ua',
      'online.nasheradio.ua',
      'online.radiobayraktar.ua',
      'cast.fex.net',
      'pub0102.101.ru',
      '101.ru',
      'solfm.ru',
      'meta.pcradio.ru',
      'tavrmedia.ua',
      'tim-fm.tim.ua',
      'radiorecord.hostingradio.ru',
      'radiorecord.ru',
      'dfm.ru',
      'dorognoe.ru',
      'europaplus.ru',
      'icecast.luxnet.ua',
      'player.101.ru',
      'ic7.101.ru',
      'edge02.atomicradio.eu'
    ],
    corsProblematic: [
      'radiorecord.ru',
      '101.ru',
      'dfm.ru',
      'tavrmedia.ua',
      'edge02.atomicradio.eu'
    ]
  },

  stations: {
    episodic: [
      'MEGAMIX',
      'LADY WAKS',
      'OLIVER HELDENS',
      'GVOZD',
      'NEJTRINO & BAUR',
      'DJ ЦВЕТKOFF',
      'ARMIN VAN BUUREN',
      'FEEL',
      'RECORD CLASSIX',
      'Ultra Music Festival',
      'Festivals',
      'A State of Trance'
    ],
    withoutTracks: [
      'DJ FM',
      'Соль FM',
      'TIM FM'
    ]
  },

  visualizer: {
    defaultOpacity: 15,
    defaultClass: 'geometric',
    defaultMode: 0
  },

  ui: {
    marqueeDelay: 250,
    toastDuration: 3000,
    contextMenuZIndex: 1000,
    throttleResize: 250,
    animationDelay: 30,
    maxAnimationDelay: 300,
    likePromptDelay: 30000
  },

  debug: {
    enabled: false,
    logMetadata: true,
    logAudio: true,
    logNetwork: true
  }
};

export const getStorageKey = (key) => {
  return `${Config.storage.prefix}${Config.storage.keys[key] || key}`;
};

export const getProxyUrl = (url) => {
  if (!url) return '';

  const isHls = /m3u8|\/hls|playlist|manifest/i.test(url);

  if (isHls) {
    return `/api/proxy/hls?url=${encodeURIComponent(url)}`;
  }

  if (isProxyRequired(url)) {
    return `/api/proxy/stream?url=${encodeURIComponent(url)}`;
  }

  if (window.location.protocol === 'https:' && url.startsWith('http://')) {
    return `/api/proxy/stream?url=${encodeURIComponent(url)}`;
  }

  return url;
};

export const isProxyRequired = (url) => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return Config.domains.proxyRequired.some(domain =>
      hostname.includes(domain.toLowerCase())
    );
  } catch {
    return Config.domains.proxyRequired.some(domain =>
      url.toLowerCase().includes(domain.toLowerCase())
    );
  }
};

export const isEpisodicStation = (station) => {
  if (!station) return false;
  return Config.stations.episodic.some(name =>
    station.name.toUpperCase().includes(name.toUpperCase())
  );
};

export const hasNoTrackInfo = (station) => {
  if (!station) return false;

  if (station.trackInfo === 'unknown' ||
      station.trackInfo === false ||
      !station.trackInfo ||
      station.trackInfo === '') {
    return true;
  }

  return Config.stations.withoutTracks.some(name =>
    station.name.toUpperCase().includes(name.toUpperCase())
  );
};

export const getCorsProxyUrl = (url) => {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const needsCorsProxy = Config.domains.corsProblematic.some(domain =>
      hostname.includes(domain.toLowerCase())
    );

    if (needsCorsProxy) {
      return `/api/metadata/track?url=${encodeURIComponent(url)}`;
    }
  } catch {}

  return url;
};

export const debugLog = (category, message, data) => {
  if (!Config.debug.enabled) return;

  const categoryEnabled = {
    metadata: Config.debug.logMetadata,
    audio: Config.debug.logAudio,
    network: Config.debug.logNetwork
  };

  if (categoryEnabled[category] !== false) {
    console.log(`[${category.toUpperCase()}]`, message, data || '');
  }
};