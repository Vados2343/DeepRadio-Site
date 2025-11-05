import { Config, hasNoTrackInfo, isEpisodicStation, getCorsProxyUrl, debugLog } from './config.js';

class MetadataService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.failedUrls = new Set();
    this.retryBackoff = new Map();
    this.abortControllers = new Map();
    this.lastTrackId = new Map();
    this.retryCount = new Map();
    this.fallbackCache = new Map();
  }

  async getTrackMeta(station) {
    if (!station) {
      return { artist: '', song: 'Radio', noData: true };
    }

    // Проверяем, есть ли у станции информация о треках
    if (hasNoTrackInfo(station)) {
      return { artist: station.name, song: 'В эфире', noData: true };
    }

    const cacheKey = `track_${station.id}`;
    const cached = this.cache.get(cacheKey);


    const ttl = isEpisodicStation(station)
      ? Config.metadata.episodicTTL
      : Config.metadata.cacheTTL;


    if (cached && Date.now() - cached.timestamp < ttl) {
      debugLog('metadata', 'Cache hit', { station: station.name, cached: cached.data });
      return cached.data;
    }


    if (this.pendingRequests.has(station.id)) {
      debugLog('metadata', 'Request already pending', { station: station.name });
      return this.pendingRequests.get(station.id);
    }


    const existingController = this.abortControllers.get(station.id);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    this.abortControllers.set(station.id, controller);

    const request = this.fetchMetadata(station, controller.signal)
      .finally(() => {
        this.pendingRequests.delete(station.id);
        this.abortControllers.delete(station.id);
      });

    this.pendingRequests.set(station.id, request);
    return request;
  }

  async fetchMetadata(station, signal) {
    const retries = this.retryCount.get(station.id) || 0;

    try {
      debugLog('metadata', 'Fetching metadata', {
        station: station.name,
        url: station.trackInfo,
        retries
      });

      let url = station.trackInfo;

      // Всегда используем наш API для метаданных (чтобы избежать CORS)
      const shouldUseProxy = this.failedUrls.has(url) ||
                            this.requiresProxy(url) ||
                            retries > 0;

      if (shouldUseProxy) {
        url = `/api/metadata/track?url=${encodeURIComponent(station.trackInfo)}`;
        debugLog('metadata', 'Using proxy', { originalUrl: station.trackInfo, proxyUrl: url });
      } else {
        url = getCorsProxyUrl(url);
      }

      const timeoutMs = Config.metadata.timeout;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      );

      const fetchPromise = fetch(url, {
        signal,
        cache: 'no-store',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Cache-Control': 'no-cache'
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        debugLog('metadata', 'HTTP error', { status: response.status, station: station.name });


        if (response.status === 403 || response.status === 429 || response.status === 404) {
          this.failedUrls.add(station.trackInfo);
        }

        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let result;

      if (contentType.includes('application/json')) {
        const data = await response.json();
        result = this.parseJSONResponse(data, station.trackInfo);
      } else {
        const text = await response.text();
        result = this.parseResponse(text, station.trackInfo);
      }

      debugLog('metadata', 'Metadata fetched successfully', {
        station: station.name,
        result
      });

      // Проверяем, есть ли реальные данные
      const trackId = `${result.artist}_${result.song}`;
      const lastId = this.lastTrackId.get(station.id);

      // Если трек не изменился и данных нет, возвращаем кэш
      if (trackId === lastId && (!result.artist && !result.song)) {
        const cached = this.cache.get(`track_${station.id}`);
        if (cached) {
          debugLog('metadata', 'Using cached data (no new info)', { station: station.name });
          return cached.data;
        }
      }


      if (result.artist || result.song) {
        this.lastTrackId.set(station.id, trackId);
        this.cache.set(`track_${station.id}`, {
          data: result,
          timestamp: Date.now()
        });

        // Сохраняем в fallback кэш
        this.fallbackCache.set(station.id, result);

        // Сбрасываем счетчик попыток при успехе
        this.retryCount.delete(station.id);
        this.updateBackoff(station.id, true);

        return result;
      }

      throw new Error('No track data');

    } catch (error) {
      debugLog('metadata', 'Fetch error', {
        station: station.name,
        error: error.message,
        retries
      });

      if (error.name === 'AbortError') {
        return { artist: station.name, song: '', loading: true };
      }


      this.retryCount.set(station.id, retries + 1);
      this.updateBackoff(station.id, false);


      const cached = this.cache.get(`track_${station.id}`);
      if (cached) {
        debugLog('metadata', 'Using cached data (error fallback)', { station: station.name });
        return { ...cached.data, serverError: true };
      }

      const fallback = this.fallbackCache.get(station.id);
      if (fallback) {
        debugLog('metadata', 'Using fallback cache', { station: station.name });
        return { ...fallback, serverError: true };
      }


      if (retries < Config.metadata.maxRetries && error.name !== 'AbortError') {
        debugLog('metadata', 'Retrying with proxy', { station: station.name, attempt: retries + 1 });


        await new Promise(resolve => setTimeout(resolve, Config.metadata.retryDelay));


        return this.fetchMetadata(station, signal);
      }


      debugLog('metadata', 'All retries exhausted', { station: station.name });
      return {
        artist: station.name,
        song: '',
        fallback: true,
        error: true
      };
    }
  }

  parseJSONResponse(data, url) {

    if (data.artist !== undefined || data.song !== undefined) {
      return {
        artist: this.cleanArtist(data.artist || ''),
        song: data.song || ''
      };
    }

    const parser = this.selectParser(url);
    return parser(data);
  }

  parseResponse(text, url) {
    try {
      const data = JSON.parse(text);
      return this.parseJSONResponse(data, url);
    } catch {
      return this.parseHTML(text);
    }
  }

  selectParser(url) {
    const parsers = {
      'atomic.radio': this.parseAtomic,
      'radiorecord.ru': this.parseRadioRecord,
      'recordstation': this.parseRadioRecord,
      '101.ru': this.parse101ru,
      'tavrmedia.ua': this.parseTavrMedia,
      'dfm.ru': this.parseDFM,
      'europaplus.ru': this.parseEuropaPlus,
      'dorognoe.ru': this.parseDorognoe,
      'zaycev.fm': this.parseZaycev,
      'pcradio.ru': this.parsePCRadio,
      'onlineradiobox.com': this.parseOnlineRadioBox,
      'hitfm.ua': this.parseUkrainian,
      'kissfm.ua': this.parseUkrainian,
      'nasheradio.ua': this.parseUkrainian,
      'meta.fmgid.com': this.parseMarusya,
      'radio-holding.ru': this.parseMarusya,
      'marusya': this.parseMarusya,
      'like': this.parseMarusya
    };

    for (const [domain, parser] of Object.entries(parsers)) {
      if (url.includes(domain)) {
        return parser.bind(this);
      }
    }

    return this.parseGeneric.bind(this);
  }

  parseAtomic(data) {
    if (data?.current_track) {
      return {
        artist: this.cleanArtist(data.current_track.artist || ''),
        song: data.current_track.title || ''
      };
    }
    return this.parseGeneric(data);
  }

  parseMarusya(data) {
    if (data?.uniqueid) {
      return {
        artist: this.cleanArtist(data.artist || ''),
        song: data.title || ''
      };
    }
    if (data?.artist && data?.title) {
      return {
        artist: this.cleanArtist(data.artist),
        song: data.title
      };
    }
    return this.parseGeneric(data);
  }

  parseRadioRecord(data) {
    if (data?.result?.history?.[0]) {
      const track = data.result.history[0];
      return {
        artist: this.cleanArtist(track.artist || ''),
        song: track.song || track.title || ''
      };
    }
    if (data?.result?.current) {
      const track = data.result.current;
      return {
        artist: this.cleanArtist(track.artist || ''),
        song: track.song || track.title || ''
      };
    }
    if (data?.result?.[0]) {
      const track = data.result[0];
      return {
        artist: this.cleanArtist(track.artist || track.executor || ''),
        song: track.song || track.title || ''
      };
    }
    if (data?.current) {
      return {
        artist: this.cleanArtist(data.current.artist || ''),
        song: data.current.song || data.current.title || ''
      };
    }
    return this.parseGeneric(data);
  }

  parse101ru(data) {
    if (data?.result?.short) {
      const track = data.result.short;
      return {
        artist: this.cleanArtist(track.titleExecutorFull || track.titleExecutor || track.artist || ''),
        song: track.titleTrack || track.title || ''
      };
    }
    return this.parseGeneric(data);
  }

  parseTavrMedia(data) {
    if (Array.isArray(data) && data[0]) {
      const track = data[0];
      if (track.stime) {
        return {
          artist: this.cleanArtist(track.singer || ''),
          song: track.song || ''
        };
      }
      return {
        artist: this.cleanArtist(track.Singer || track.singer || ''),
        song: track.Song || track.song || ''
      };
    }
    if (data?.Singer && data?.Song) {
      return { artist: this.cleanArtist(data.Singer), song: data.Song };
    }
    if (data?.iArtist && data?.iName) {
      return { artist: this.cleanArtist(data.iArtist), song: data.iName };
    }
    return this.parseGeneric(data);
  }

  parseDFM(data) {
    if (data?.result?.data?.dfm?.current) {
      const track = data.result.data.dfm.current;
      return {
        artist: this.cleanArtist(track.artist || ''),
        song: track.title || ''
      };
    }
    if (data?.result?.data?.[0]) {
      const track = data.result.data[0];
      return {
        artist: this.cleanArtist(track.artist || ''),
        song: track.title || ''
      };
    }
    if (data?.current) {
      return {
        artist: this.cleanArtist(data.current.artist || ''),
        song: data.current.song || data.current.title || ''
      };
    }
    if (data?.tracks?.[0]) {
      const track = data.tracks[0];
      return {
        artist: this.cleanArtist(track.artist || ''),
        song: track.song || track.title || ''
      };
    }
    return this.parseGeneric(data);
  }

  parseEuropaPlus(data) {
    if (data?.data?.[0]) {
      const track = data.data[0];
      if (track.raw) {
        return {
          artist: this.cleanArtist(track.raw.artist || ''),
          song: track.raw.name || track.name || ''
        };
      }
      return {
        artist: this.cleanArtist(track.artists?.[0]?.artist || track.artist || ''),
        song: track.name || track.title || ''
      };
    }
    if (data?.result?.[0]) {
      const track = data.result[0];
      return {
        artist: this.cleanArtist(track.artist || ''),
        song: track.title || ''
      };
    }
    return this.parseGeneric(data);
  }

  parseDorognoe(data) {
    if (Array.isArray(data) && data[0]) {
      return {
        artist: this.cleanArtist(data[0].artist || ''),
        song: data[0].title || ''
      };
    }
    return this.parseGeneric(data);
  }

  parseZaycev(data) {
    if (data?.latest?.[0]) {
      const track = data.latest[0];
      return {
        artist: this.cleanArtist(track.artist || ''),
        song: track.title || ''
      };
    }
    if (data?.tracks?.[0]) {
      const track = data.tracks[0];
      return {
        artist: this.cleanArtist(track.artist_name || track.artist || ''),
        song: track.title || ''
      };
    }
    return this.parseGeneric(data);
  }

  parsePCRadio(data) {
    return {
      artist: this.cleanArtist(data.artist || data.singer || ''),
      song: data.title || data.song || ''
    };
  }

  parseOnlineRadioBox(data) {
    const text = data.playing || data.title || '';
    return this.splitArtistSong(text);
  }

  parseUkrainian(data) {
    if (typeof data === 'string') {
      const cleanText = data.replace(/<[^>]*>/g, '').trim();
      return this.splitArtistSong(cleanText);
    }
    if (data?.current) {
      return {
        artist: this.cleanArtist(data.current.artist || ''),
        song: data.current.title || data.current.song || ''
      };
    }
    return this.parseGeneric(data);
  }

  parseGeneric(data) {
    if (!data || typeof data !== 'object') return { artist: '', song: '' };

    const possiblePaths = [
      data.current,
      data.now,
      data.now_playing,
      data.nowPlaying,
      data.playing,
      data.onair,
      data.on_air,
      data.track,
      data.result?.current,
      data.result?.now,
      Array.isArray(data) ? data[0] : null,
      Array.isArray(data.result) ? data.result[0] : null,
      data
    ];

    for (const track of possiblePaths) {
      if (!track || typeof track !== 'object') continue;

      const artist = track.artist || track.singer || track.author ||
                     track.performer || track.executor || track.artist_name ||
                     track.titleExecutor || track.artistName || '';

      const song = track.title || track.song || track.name ||
                   track.track || track.trackTitle || track.titleTrack ||
                   track.song_name || track.songName || '';

      if (artist || song) {
        return { artist: this.cleanArtist(artist), song };
      }

      const combined = track.nowplaying || track.now_playing || track.playing ||
                       track.title_full || track.full_title || track.full || track.text;

      if (combined && typeof combined === 'string') {
        return this.splitArtistSong(combined);
      }
    }

    return { artist: '', song: '' };
  }

  parseHTML(html) {
    const cleanText = html.replace(/<[^>]*>/g, '').trim();

    const patterns = [
      /Now\s+Playing:?\s*(.+)/i,
      /On\s+Air:?\s*(.+)/i,
      /В\s+эфире:?\s*(.+)/i,
      /Playing:?\s*(.+)/i,
      /Current:?\s*(.+)/i
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        return this.splitArtistSong(match[1]);
      }
    }

    if (cleanText && !cleanText.includes('DOCTYPE') && !cleanText.includes('<?xml')) {
      return this.splitArtistSong(cleanText.split('\n')[0].trim());
    }

    return { artist: '', song: '' };
  }

  splitArtistSong(text) {
    if (!text || typeof text !== 'string') return { artist: '', song: '' };

    const separators = [' - ', ' — ', ' – ', ' | ', ' :: ', ' / '];

    for (const sep of separators) {
      if (text.includes(sep)) {
        const parts = text.split(sep).map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          return {
            artist: this.cleanArtist(parts[0]),
            song: parts.slice(1).join(' - ')
          };
        }
      }
    }

    return { artist: '', song: text.trim() };
  }

  cleanArtist(artist) {
    if (!artist || typeof artist !== 'string') return '';

    return artist
      .replace(/\s*feat\.\s*/gi, ' feat. ')
      .replace(/\s*ft\.\s*/gi, ' ft. ')
      .replace(/\s*featuring\s*/gi, ' feat. ')
      .replace(/\s*&\s*/g, ' & ')
      .replace(/\s*\+\s*/g, ' & ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  updateBackoff(stationId, success) {
    if (success) {
      this.retryBackoff.delete(stationId);
    } else {
      const current = this.retryBackoff.get(stationId) || 0;
      const next = Math.min(current + 1, Config.metadata.backoffIntervals.length - 1);
      this.retryBackoff.set(stationId, next);
    }
  }

  getBackoffInterval(stationId) {
    const index = this.retryBackoff.get(stationId) || 0;
    return Config.metadata.backoffIntervals[index];
  }

  requiresProxy(url) {
    try {
      const hostname = new URL(url).hostname;
      return Config.domains.proxyRequired.some(domain =>
        hostname.includes(domain)
      );
    } catch {
      return false;
    }
  }

  cleanup() {
    // Отменяем все активные запросы
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.pendingRequests.clear();

    // Очищаем старый кэш
    if (this.cache.size > Config.metadata.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      while (this.cache.size > Config.metadata.maxCacheSize / 2) {
        const [key] = entries.shift();
        this.cache.delete(key);
      }
    }
  }

  clearStationCache(stationId) {
    this.cache.delete(`track_${stationId}`);
    this.lastTrackId.delete(stationId);
    this.retryCount.delete(stationId);
    debugLog('metadata', 'Cache cleared for station', { stationId });
  }

  destroy() {
    this.cleanup();
    this.cache.clear();
    this.fallbackCache.clear();
    this.failedUrls.clear();
    this.retryBackoff.clear();
    this.lastTrackId.clear();
    this.retryCount.clear();
  }
}

export const metadataService = new MetadataService(); 