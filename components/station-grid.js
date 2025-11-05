import { store } from '../core/store.js';
import { showToast } from '../utils/toast.js';
import { PlayerStates } from '../core/PlayerStateMachine.js';
import { t } from '../utils/i18n.js';
const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block }
    .genre-filter {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 0.75rem;
      background: var(--surface);
      border-radius: var(--radius-lg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      overflow-x: auto;
      scrollbar-width: thin;
      justify-content: center;
      flex-wrap: wrap;
      transition: all 0.3s ease;
    }
    .genre-filter.edit-mode { opacity: 0.6; pointer-events: none }
    .genre-btn {
      padding: 0.75rem 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
    }
    .genre-btn:hover { background: var(--surface-hover); border-color: var(--accent1); color: var(--accent1); transform: translateY(-1px) }
    .genre-btn.active {
      background: var(--accent1);
      border-color: transparent;
      color: #000;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(8, 247, 254, 0.3);
    }
    [data-accent="gradient"] .genre-btn.active { background: linear-gradient(135deg, #08f7fe, #f15bb5) }
    .edit-mode-banner {
      display: none;
      background: linear-gradient(135deg, rgba(8, 247, 254, 0.1), rgba(241, 91, 181, 0.1));
      border: 1px solid rgba(8, 247, 254, 0.3);
      border-radius: var(--radius);
      padding: 1rem 1.5rem;
      margin-bottom: 1rem;
      text-align: center;
      color: var(--accent1);
      font-weight: 500;
      animation: slideDown 0.3s ease;
    }
    .edit-mode-banner.show { display: block }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-20px) } to { opacity: 1; transform: translateY(0) } }
    .edit-mode-banner .banner-content { display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap }
    .banner-text { display: flex; align-items: center; gap: 0.5rem }
    .banner-text svg { width: 20px; height: 20px }
    .exit-edit-btn {
      background: var(--accent2);
      color: #000;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: var(--radius);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .exit-edit-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(241, 91, 181, 0.4) }
    .stations-container[data-display="grid"] .stations-grid { display: grid; grid-template-columns: repeat(auto-fill, 180px); gap: 1.5rem; justify-content: center; padding: 0 1rem 1rem; transition: all 0.3s ease }
    .stations-container.edit-mode[data-display="grid"] .stations-grid { gap: 2rem }
    .stations-container[data-display="list"] .stations-grid { display: flex; flex-direction: column; gap: 0.75rem; padding: 0 1rem 1rem }
    .stations-container.edit-mode[data-display="list"] .stations-grid { gap: 1rem }
    .stations-container[data-display="compact"] .stations-grid { display: grid; grid-template-columns: repeat(auto-fill, 120px); gap: 1rem; justify-content: center; padding: 0 1rem 1rem }
    .stations-container.edit-mode[data-display="compact"] .stations-grid { gap: 1.5rem }
    .stations-container[data-display="cover"] .stations-grid { display: grid; grid-template-columns: repeat(auto-fill, 240px); gap: 2rem; justify-content: center; padding: 0 1rem 1rem }
    .station-card { position: relative; cursor: pointer; transition: var(--transition); animation: slideUp 0.5s ease backwards; user-select: none; will-change: transform }
    .station-card.edit-mode { cursor: move; animation: wobble 2s ease-in-out infinite }
    .station-card.edit-mode:active { cursor: grabbing }
    .station-card.edit-mode.favorite { animation: wobbleFavorite 2s ease-in-out infinite }
    .station-card.dragging { opacity: 0.3; transform: scale(0.95); animation: none }
    .station-card.drop-target { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) }
    .station-card.shift-left { transform: translateX(-20px) }
    .station-card.shift-right { transform: translateX(20px) }
    .station-card.drag-over { transform: scale(1.02); border: 2px solid var(--accent2); background: rgba(241, 91, 181, 0.1) }
    .station-card.drop-target::before { content: ''; position: absolute; inset: -6px; border: 2px dashed var(--accent1); border-radius: var(--radius-xl); background: rgba(8, 247, 254, 0.1); animation: pulse 1s infinite; pointer-events: none }
    @keyframes wobble { 0%, 100% { transform: rotate(0deg) } 25% { transform: rotate(-1deg) } 75% { transform: rotate(1deg) } }
    @keyframes wobbleFavorite { 0%, 100% { transform: rotate(0deg) scale(1) } 25% { transform: rotate(-1.5deg) scale(1.02) } 75% { transform: rotate(1.5deg) scale(1.02) } }
    @keyframes pulse { 0%, 100% { opacity: 0.6 } 50% { opacity: 1 } }
    [data-display="grid"] .station-card { width: 180px; height: 180px }
    [data-display="list"] .station-card { display: flex; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; gap: 1rem; min-height: 80px }
    [data-display="compact"] .station-card { width: 120px; height: 120px }
    [data-display="cover"] .station-card { width: 240px; height: 280px }
    .station-icon { border-radius: var(--radius-xl); object-fit: cover; background: var(--surface); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); transition: var(--transition); flex-shrink: 0; opacity: 0; animation: fadeIn 0.3s ease forwards; animation-fill-mode: forwards }
    @media (prefers-reduced-motion: reduce) { .edit-mode .station-icon { animation: fadeIn 0.3s ease forwards !important } .edit-mode .action-btn, .station-card.edit-mode { animation: none !important } }
    .edit-mode .station-icon { animation: fadeIn 0.3s ease forwards, iconWobble 2s ease-in-out infinite; pointer-events: none }
    @keyframes iconWobble { 0%, 100% { transform: scale(1) rotate(0deg) } 25% { transform: scale(0.98) rotate(-0.5deg) } 75% { transform: scale(0.98) rotate(0.5deg) } }
    @keyframes fadeIn { to { opacity: 1 } }
    [data-display="grid"] .station-icon { width: 100%; height: 100% }
    [data-display="list"] .station-icon { width: 60px; height: 60px; border-radius: var(--radius) }
    [data-display="compact"] .station-icon { width: 100%; height: 100%; border-radius: var(--radius) }
    [data-display="cover"] .station-icon { width: 100%; height: 240px; border-radius: var(--radius-lg) var(--radius-lg) 0 0 }
    .station-card:hover .station-icon { transform: scale(1.05); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4) }
    .station-card.edit-mode:hover .station-icon { transform: scale(1.02) }
    [data-display="list"] .station-card:hover .station-icon { transform: scale(1.1) }
    [data-display="list"] .station-card.edit-mode:hover .station-icon { transform: scale(1.05) }
    .station-card.active .station-icon { box-shadow: 0 0 0 3px var(--accent1), 0 12px 32px rgba(8, 247, 254, 0.4) }
    .station-overlay { position: absolute; inset: 0; border-radius: var(--radius-xl); background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.9) 100%); opacity: 0; transition: var(--transition); display: flex; flex-direction: column; justify-content: flex-end; padding: 1rem; pointer-events: none }
    .edit-mode .station-overlay { opacity: 0.3 }
    [data-display="list"] .station-overlay { position: static; background: none; opacity: 1; padding: 0; flex: 1; min-width: 0; pointer-events: auto }
    [data-display="cover"] .station-overlay { position: static; background: var(--surface); border: 1px solid var(--border); border-radius: 0 0 var(--radius-lg) var(--radius-lg); border-top: none; opacity: 1; padding: 1rem; height: 40px; justify-content: center; pointer-events: auto }
    .station-card:hover .station-overlay { opacity: 1 }
    .station-card.edit-mode:hover .station-overlay { opacity: 0.5 }
    .station-name { font-size: 14px; font-weight: 600; margin-bottom: 0.25rem }
    [data-display="grid"] .station-name, [data-display="compact"] .station-name { color: white; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5) }
    [data-display="list"] .station-name { color: var(--text-primary); font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
    [data-display="cover"] .station-name { color: var(--text-primary); text-align: center }
    .station-tags { display: flex; gap: 0.25rem; flex-wrap: wrap }
    .tag { font-size: 11px; padding: 0.125rem 0.5rem; border-radius: 999px; transition: all 0.2s ease }
    [data-display="grid"] .tag, [data-display="compact"] .tag { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); color: rgba(255, 255, 255, 0.9) }
    [data-display="list"] .tag, [data-display="cover"] .tag { background: var(--surface-hover); border: 1px solid var(--border); color: var(--text-muted) }
    .play-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); width: 56px; height: 56px; background: var(--accent1); border: none; border-radius: 50%; color: #000; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(8, 247, 254, 0.4); transition: var(--transition); flex-shrink: 0; z-index: 10 }
    .edit-mode .play-btn { opacity: 0.3; transform: translate(-50%, -50%) scale(0.7); pointer-events: none }
    [data-display="list"] .play-btn { position: static; transform: none; margin-left: auto; width: 48px; height: 48px; flex-shrink: 0 }
    [data-display="list"] .edit-mode .play-btn { transform: none; opacity: 0.3 }
    [data-display="compact"] .play-btn { width: 40px; height: 40px }
    .station-card:hover .play-btn { transform: translate(-50%, -50%) scale(1) }
    .station-card.edit-mode:hover .play-btn { transform: translate(-50%, -50%) scale(0.7) }
    [data-display="list"] .station-card .play-btn { transform: none }
    [data-display="list"] .station-card.edit-mode .play-btn { transform: none }
    .station-card.active .play-btn { transform: translate(-50%, -50%) scale(1); background: var(--accent2) }
    [data-display="list"] .station-card.active .play-btn { transform: none }
    .action-buttons { position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem; opacity: 0; transition: var(--transition); flex-shrink: 0; z-index: 10 }
    .edit-mode .action-buttons { opacity: 1; transform: scale(1.15) }
    @media (prefers-reduced-motion: reduce) { .edit-mode .action-buttons { transform: scale(1.1) } }
    [data-display="list"] .action-buttons { position: static; opacity: 1; margin-left: 1rem; flex-shrink: 0 }
    .station-card:hover .action-buttons { opacity: 1 }
    .action-btn { width: 36px; height: 36px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); flex-shrink: 0 }
    .edit-mode .action-btn { background: rgba(0, 0, 0, 0.8); border-color: rgba(255, 255, 255, 0.4); cursor: pointer; animation: actionBtnPulse 2s ease-in-out infinite }
    @media (prefers-reduced-motion: reduce) { .edit-mode .action-btn { animation: none } }
    @keyframes actionBtnPulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.05) } }
    .edit-mode .action-btn.active { background: var(--accent2); border-color: var(--accent2); color: #000; transform: scale(1.2); animation: heartbeat 1.5s ease-in-out infinite }
    @keyframes heartbeat { 0%, 100% { transform: scale(1.2) } 50% { transform: scale(1.3) } }
    [data-display="list"] .action-btn { background: var(--surface); border-color: var(--border); color: var(--text-secondary) }
    .action-btn:hover { transform: scale(1.1); background: rgba(0, 0, 0, 0.8) }
    .edit-mode .action-btn:hover { transform: scale(1.25) }
    [data-display="list"] .action-btn:hover { background: var(--surface-hover); color: var(--text-primary) }
    .action-btn.active { color: var(--accent3); background: rgba(241, 91, 181, 0.2); border-color: var(--accent3) }
    .drag-handle { position: absolute; top: 1rem; left: 1rem; width: 32px; height: 32px; background: rgba(0, 0, 0, 0.8); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 50%; color: var(--accent1); cursor: grab; display: none; align-items: center; justify-content: center; transition: var(--transition); z-index: 20; user-select: none }
    .edit-mode .drag-handle { display: flex; animation: dragHandlePulse 2s ease-in-out infinite }
    .drag-handle:active { cursor: grabbing }
    [data-display="list"] .drag-handle { position: static; margin-right: 1rem }
    @keyframes dragHandlePulse { 0%, 100% { opacity: 0.8; transform: scale(1) } 50% { opacity: 1; transform: scale(1.1) } }
    .pulse-indicator { position: absolute; top: 1rem; left: 1rem; width: 12px; height: 12px; background: var(--accent1); border-radius: 50%; display: none; animation: pulse-indicator 2s infinite; box-shadow: 0 0 8px var(--accent1); flex-shrink: 0; z-index: 10 }
    .edit-mode .pulse-indicator { display: none }
    [data-display="list"] .pulse-indicator { position: static; margin-right: 1rem; flex-shrink: 0 }
    .station-card.active .pulse-indicator { display: block }
    .station-card.active.edit-mode .pulse-indicator { display: none }
    @keyframes pulse-indicator { 0% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.5); opacity: 0.5 } 100% { transform: scale(1); opacity: 1 }
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    .drop-indicator { position: absolute; left: -10px; right: -10px; height: 4px; background: linear-gradient(90deg, var(--accent1), var(--accent2)); border-radius: 2px; opacity: 0; transition: opacity 0.2s ease; pointer-events: none; z-index: 1001 }
    .drop-indicator.show { opacity: 1; animation: dropGlow 1s ease-in-out infinite alternate }
    .drop-indicator.before { top: -2px }
    .drop-indicator.after { bottom: -2px }
    @keyframes dropGlow { 0% { box-shadow: 0 0 5px var(--accent1) } 100% { box-shadow: 0 0 15px var(--accent1), 0 0 25px var(--accent2) } }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--text-muted); text-align: center; animation: fadeIn 0.5s ease }
    .empty-icon { width: 80px; height: 80px; margin-bottom: 1rem; opacity: 0.3 }
    .empty-title { font-size: 1.2rem; font-weight: 500; margin-bottom: 0.5rem; color: var(--text-secondary) }
    @media (max-width: 768px) {
      .genre-filter { margin-bottom: 1rem; padding: 0.75rem; overflow-x: auto; flex-wrap: nowrap; justify-content: flex-start }
      .genre-btn { padding: 0.5rem 1rem; font-size: 13px }
      [data-display="grid"] .stations-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem }
      .stations-container.edit-mode[data-display="grid"] .stations-grid { gap: 1.5rem }
      [data-display="grid"] .station-card { width: 100%; aspect-ratio: 1; max-width: 180px; height: auto }
      [data-display="compact"] .stations-grid { grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.75rem }
      .stations-container.edit-mode[data-display="compact"] .stations-grid { gap: 1rem }
      [data-display="compact"] .station-card { width: 100%; aspect-ratio: 1; max-width: 120px; height: auto }
      [data-display="cover"] .stations-grid { grid-template-columns: 1fr }
      [data-display="cover"] .station-card { width: 100%; height: 280px }
      [data-display="list"] .station-card { padding: 0.75rem; min-height: 70px }
      [data-display="list"] .station-icon { width: 50px; height: 50px }
      [data-display="list"] .play-btn { width: 44px; height: 44px }
      [data-display="list"] .action-btn { width: 32px; height: 32px }
      .station-card.edit-mode { animation: wobbleMobile 1.5s ease-in-out infinite }
      @keyframes wobbleMobile { 0%, 100% { transform: rotate(0deg) } 25% { transform: rotate(-0.5deg) } 75% { transform: rotate(0.5deg) } }
      .edit-mode-banner .banner-content { flex-direction: column; gap: 0.75rem }
      .drag-handle { width: 28px; height: 28px }
    }
    @media (max-width: 480px) {
      [data-display="grid"] .stations-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; padding: 0 0.75rem 0.75rem }
      .stations-container.edit-mode[data-display="grid"] .stations-grid { gap: 1rem }
      [data-display="compact"] .stations-grid { grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 0.5rem; padding: 0 0.75rem 0.75rem }
      .stations-container.edit-mode[data-display="compact"] .stations-grid { gap: 0.75rem }
      [data-display="list"] .station-card { padding: 0.5rem; min-height: 60px }
      [data-display="list"] .station-icon { width: 45px; height: 45px }
      [data-display="list"] .play-btn { width: 40px; height: 40px }
      [data-display="list"] .action-btn { width: 30px; height: 30px }
      [data-display="list"] .station-name { font-size: 13px }
      .drag-handle { width: 26px; height: 26px }
    }
  </style>
  <div class="edit-mode-banner" id="edit-mode-banner">
    <div class="banner-content">
      <div class="banner-text">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        <span>Режим редактирования избранного активен. Перетащите станции для изменения порядка.</span>
      </div>
      <button class="exit-edit-btn" id="exit-edit-btn">Готово</button>
    </div>
  </div>
  <div class="genre-filter" id="genre-filter"></div>
  <div class="stations-container" id="stations-container" data-display="grid"></div>
`;

export class StationGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.elements = this.getElements();
    this.state = this.initState();
    this.dragState = this.initDragState();
    this.boundMethods = this.bindMethods();
    this.updateActiveRafId = null;
    this.updatePlayRafId = null;
    this.renderThrottle = null;
    this.stationsGridCache = null;
    this.currentStation = store?.current ?? null;

    // Инициализируем playingStationId консистентно с FSM
    try {
      const isPlaying = store?.playerFSM?.isInState?.(PlayerStates.PLAYING);
      this.playingStationId = isPlaying ? (this.currentStation?.id ?? null) : null;
    } catch {
      this.playingStationId = null;
    }
  }

  getElements() {
    return {
      genreFilter: this.shadowRoot.getElementById('genre-filter'),
      container: this.shadowRoot.getElementById('stations-container'),
      editBanner: this.shadowRoot.getElementById('edit-mode-banner'),
      exitEditBtn: this.shadowRoot.getElementById('exit-edit-btn')
    };
  }

  initState() {
    return { selectedGenre: 'all', displayMode: 'grid', viewMode: 'all', isEditMode: false, isRendering: false };
  }

  initDragState() {
    return { draggedCard: null, draggedStationId: null, draggedIndex: -1, dropTarget: null, dropPosition: null, touchStartPos: { x: 0, y: 0 }, isDragging: false, dragOffset: { x: 0, y: 0 }, lastMoveTime: 0, currentPos: { x: 0, y: 0 }, pushedCards: new Map(), animationFrame: null, ghost: null };
  }

  bindMethods() {
    return {
      handleDragStart: this.handleDragStart.bind(this),
      handleDragOver: this.handleDragOver.bind(this),
      handleDrop: this.handleDrop.bind(this),
      handleDragEnd: this.handleDragEnd.bind(this),
      handleTouchStart: this.handleTouchStart.bind(this),
      handleTouchMove: this.handleTouchMove.bind(this),
      handleTouchEnd: this.handleTouchEnd.bind(this),
      handleClickOutside: this.handleClickOutside.bind(this)
    };
  }

  connectedCallback() {
    this.initGenres();
    this.render();
    this.createContextMenu();
    this.setupEventListeners();
    // Первая синхронизация после монтирования
    this.syncFromStore();
  }

  disconnectedCallback() {
    this.cleanup();
    document.removeEventListener('click', this.boundMethods.handleClickOutside);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }
  }

  cleanup() {
    if (this.updateActiveRafId) cancelAnimationFrame(this.updateActiveRafId);
    if (this.updatePlayRafId) cancelAnimationFrame(this.updatePlayRafId);
    if (this.renderThrottle) clearTimeout(this.renderThrottle);
    this.updateActiveRafId = null;
    this.updatePlayRafId = null;
    this.renderThrottle = null;
    this.stationsGridCache = null;
  }

  setupEventListeners() {
    this.setupStoreListeners();
    this.setupDocumentListeners();
    this.setupContainerListeners();
    this.elements.exitEditBtn.addEventListener('click', () => { store.setEditMode(false) });
  }

  // ЕДИНЫЙ метод консистентной синхронизации UI с состоянием плеера/стора
  syncFromStore() {
    try {
      this.currentStation = store.current ?? null;
      const fsm = store?.playerFSM;

      const isPlaying = fsm?.isInState?.(PlayerStates.PLAYING) ?? false;
      const isTransitioning = fsm?.isInStates?.(
        PlayerStates.LOADING,
        PlayerStates.BUFFERING,
        PlayerStates.SWITCHING,
        PlayerStates.READY,
        PlayerStates.WAITING
      ) ?? false;

      if (isPlaying) {
        this.playingStationId = this.currentStation?.id ?? null;
      } else if (isTransitioning && this.currentStation) {
        this.playingStationId = this.currentStation.id;
      } else {
        this.playingStationId = null;
      }
    } catch {
      this.playingStationId = null;
    }
    this.updateActiveStation();
    this.updatePlayStates();
  }

  setupStoreListeners() {
    const sync = () => this.syncFromStore();

    // Активная станция/трек меняются — синхронизируем
    store.on('track-change', sync);
    store.on('station-active', sync);
    store.on('station-changing', sync);

    // Простые события плеера — синхронизируем (без дублей)
    store.on('play', sync);
    store.on('pause', sync);

    // Событие для целевого UI-синка из плеера/баров
    store.on('ui-sync', (e) => {
      const { isPlaying, station } = e.detail;
      this.currentStation = station ?? store.current ?? null;
      this.playingStationId = isPlaying ? (this.currentStation?.id ?? null) : null;
      this.updateActiveStation();
      this.updatePlayStates();
    });

    // Прочие изменения представления/фильтров
    store.on('view-change', (e) => { this.state.viewMode = e.detail; this.render() });
    store.on('filter-change', () => { if (!this.state.isRendering) this.throttledRender() });
    store.on('favorites-change', () => { this.updateFavorites(); if (this.state.viewMode === 'favorites') this.render() });
    store.on('edit-mode-change', (e) => { this.handleEditModeChange(e.detail) });
  }

  setupDocumentListeners() {
    document.addEventListener('display-mode-change', (e) => {
      this.state.displayMode = e.detail;
      this.elements.container.setAttribute('data-display', this.state.displayMode);
      if (this.state.viewMode !== 'stats') this.render();
    });
    document.addEventListener('click', this.boundMethods.handleClickOutside);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('previoustrack', () => { store.step(-1) });
      navigator.mediaSession.setActionHandler('nexttrack', () => { store.step(1) });
    }
  }

  handleClickOutside(e) {
    if (this.contextMenu && !this.contextMenu.contains(e.target)) this.contextMenu.style.display = 'none';
  }

  setupContainerListeners() {
    this.elements.container.addEventListener('dragstart', this.boundMethods.handleDragStart, true);
    this.elements.container.addEventListener('dragover', this.boundMethods.handleDragOver);
    this.elements.container.addEventListener('drop', this.boundMethods.handleDrop);
    this.elements.container.addEventListener('dragend', this.boundMethods.handleDragEnd, true);
    this.elements.container.addEventListener('touchstart', this.boundMethods.handleTouchStart, { passive: false });
    this.elements.container.addEventListener('touchmove', this.boundMethods.handleTouchMove, { passive: false });
    this.elements.container.addEventListener('touchend', this.boundMethods.handleTouchEnd);
  }

  handleEditModeChange(enabled) {
    this.state.isEditMode = enabled;
    const shouldShow = enabled && this.state.viewMode === 'favorites';
    this.elements.editBanner.classList.toggle('show', shouldShow);
    this.elements.genreFilter.classList.toggle('edit-mode', enabled);
    this.elements.container.classList.toggle('edit-mode', enabled);
    if (!enabled) {
      this.resetDragState();
      if (this.state.viewMode === 'favorites') this.render();
    } else if (enabled && this.state.viewMode === 'favorites') {
      this.render();
    }
  }

  createContextMenu() {
    const existingMenu = document.getElementById('station-context-menu');
    if (existingMenu) existingMenu.remove();
    this.contextMenu = document.createElement('div');
    this.contextMenu.id = 'station-context-menu';
    this.contextMenu.style.cssText = `position:fixed;background:var(--bg-gradient-start);border:1px solid var(--border);border-radius:var(--radius);padding:0.5rem;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:1000;display:none;backdrop-filter:blur(20px)`;
    document.body.appendChild(this.contextMenu);
  }

  initGenres() {
    const genres = ['all', 'Pop', 'EDM', 'Dance', 'House', 'Trance', 'Bass', 'Rap/Urban', 'Chill', 'Rock', 'Oldschool', 'Rus', 'Ukr'];
   this.genres = genres;
    this.updateGenreButtons();
    this.elements.genreFilter.addEventListener('click', e => {
      if (e.target.classList.contains('genre-btn') && !this.state.isEditMode) {
        this.state.selectedGenre = e.target.dataset.genre;
        this.shadowRoot.querySelectorAll('.genre-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.genre === this.state.selectedGenre);
        });
        this.render();
      }
    });
  }
  updateGenreButtons() {
    if (!this.genres || !this.elements.genreFilter) return;
    this.elements.genreFilter.innerHTML = this.genres
      .map(genre => `<button class="genre-btn ${genre === 'all' ? 'active' : ''}" data-genre="${genre}">${genre === 'all' ? t('nav.allGenres') : genre}</button>`)
      .join('');
  }

  throttledRender() {
    if (this.renderThrottle) return;
    this.renderThrottle = setTimeout(() => { this.render(); this.renderThrottle = null }, 16);
  }

  render() {
    if (this.state.isRendering) return;
    this.state.isRendering = true;
    requestAnimationFrame(() => {
      if (this.state.viewMode === 'stats') {
        this.elements.container.innerHTML = `<stats-view></stats-view>`;
        this.elements.genreFilter.style.display = 'none';
        this.elements.editBanner.classList.remove('show');
        this.state.isRendering = false;
        return;
      }
      this.elements.genreFilter.style.display = 'flex';
      const shouldShowBanner = this.state.isEditMode && this.state.viewMode === 'favorites';
      this.elements.editBanner.classList.toggle('show', shouldShowBanner);

      const stations = this.getFilteredStations();
      if (stations.length === 0) {
        this.renderEmpty();
        this.state.isRendering = false;
        return;
      }

      this.elements.container.innerHTML =
        `<div class="stations-grid">${stations.map((station, index) => this.renderStation(station, index)).join('')}</div>`;
      this.stationsGridCache = this.elements.container.querySelector('.stations-grid');

      this.attachEventListeners();
      this.syncFromStore();
     document.addEventListener('language-change', () => {

      this.updateGenreButtons();

    });
      this.updateFavorites();
      this.state.isRendering = false;
    });
  }

  getFilteredStations() {
    let stations = store.getFilteredStations();
    if (this.state.viewMode === 'favorites') {
      const favoriteStations = [];
      store.favorites.forEach(id => { const station = store.stations.find(s => s.id === id); if (station) favoriteStations.push(station) });
      stations = favoriteStations;
    } else if (this.state.viewMode === 'recent') {
      const recentStations = [];
      store.recent.forEach(id => { const station = store.stations.find(s => s.id === id); if (station) recentStations.push(station) });
      stations = recentStations;
    }
    if (this.state.selectedGenre !== 'all') stations = stations.filter(s => s.tags.includes(this.state.selectedGenre));
    return stations;
  }

  renderStation(station, index) {
    const isActive = store.current?.id === station.id;
    const isFavorite = store.isFavorite(station.id);
    const isEditMode = this.state.isEditMode && this.state.viewMode === 'favorites';
    const canDrag = isEditMode && isFavorite;
    const stationNameEscaped = this.escapeHtml(station.name);
    return `
      <div class="station-card ${isActive ? 'active' : ''} ${isEditMode ? 'edit-mode' : ''} ${isFavorite ? 'favorite' : ''}" data-id="${station.id}" data-index="${index}" draggable="${canDrag}" style="animation-delay:${Math.min(index * 30, 300)}ms">
        <div class="drop-indicator before"></div>
        ${canDrag ? `<div class="drag-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/></svg></div>` : ''}
        ${this.state.displayMode === 'list' && isActive && !isEditMode ? '<div class="pulse-indicator"></div>' : ''}
        <img class="station-icon" src="/Icons/icon${station.id + 1}.png" alt="${stationNameEscaped}" loading="lazy" draggable="false">
        <div class="station-overlay">
          <div class="station-name">${stationNameEscaped}</div>
          ${this.state.displayMode !== 'cover' ? `<div class="station-tags">${station.tags.slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        </div>
        ${this.state.displayMode !== 'list'
          ? `<div class="action-buttons"><button class="action-btn ${isFavorite ? 'active' : ''}" data-action="favorite" data-id="${station.id}" title="${isFavorite ? 'Удалить из избранного' : 'В избранное'}"><svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button></div>`
          : `<div class="action-buttons"><button class="action-btn ${isFavorite ? 'active' : ''}" data-action="favorite" data-id="${station.id}" title="${isFavorite ? 'Удалить из избранного' : 'В избранное'}"><svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button></div>`
        }
        <button class="play-btn" data-id="${station.id}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
        ${this.state.displayMode !== 'list' && isActive && !isEditMode ? '<div class="pulse-indicator"></div>' : ''}
        <div class="drop-indicator after"></div>
      </div>
    `;
  }

  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  attachEventListeners() {
    this.shadowRoot.querySelectorAll('.station-icon').forEach(img => {
      img.addEventListener('error', (e) => {
        const card = e.target.closest('.station-card');
        const stationId = parseInt(card.dataset.id);
        e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180%22%3E%3Crect width="180" height="180" rx="24" fill="%231e293b"/%3E%3Ctext x="90" y="100" text-anchor="middle" fill="%2364748b" font-size="60" font-family="Arial"%3E${stationId + 1}%3C/text%3E%3C/svg%3E`;
      });
    });

    this.shadowRoot.querySelectorAll('.station-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('.action-btn') || e.target.closest('.drag-handle') || e.target.closest('.play-btn')) return;
        if (this.state.isEditMode) return;
        const id = parseInt(card.dataset.id);
        const station = store.stations.find(s => s.id === id);
        if (!station) return;
        const same = store.current?.id === id;
        const fsm = store.playerFSM;
        if (same) {
          if (fsm.isInState(PlayerStates.PLAYING)) return;
          if (fsm.isInStates(PlayerStates.PAUSED, PlayerStates.PAUSED_WAITING, PlayerStates.READY, PlayerStates.WAITING)) { await store.ensurePlaying(store.current); return }
          if (fsm.isInStates(PlayerStates.ERROR, PlayerStates.IDLE)) { await store.play(store.current); return }
        } else {
          await store.play(station);
        }
      });

      card.addEventListener('contextmenu', e => {
        if (this.state.isEditMode) return;
        e.preventDefault();
        const id = parseInt(card.dataset.id);
        this.showContextMenu(e, id);
      });
    });

    this.shadowRoot.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const station = store.stations.find(s => s.id === id);
        if (!station) return;
        const same = store.current?.id === id;
        const fsm = store.playerFSM;
        if (same) {
          if (fsm.isInState(PlayerStates.PLAYING)) { await store.ensurePaused(); return }
          if (fsm.isInStates(PlayerStates.PAUSED, PlayerStates.PAUSED_WAITING, PlayerStates.READY, PlayerStates.WAITING)) { await store.ensurePlaying(store.current); return }
          if (fsm.isInStates(PlayerStates.ERROR, PlayerStates.IDLE)) { await store.play(store.current); return }
        } else {
          await store.play(station);
        }
      });
    });

    this.shadowRoot.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'favorite') {
          store.toggleFavorite(id);
          this.updateFavorites();
          const station = store.stations.find(s => s.id === id);
          if (station) showToast(store.isFavorite(id) ? `"${station.name}" добавлена в избранное` : `"${station.name}" удалена из избранного`, 'success');
        }
      });
    });
  }

  handleDragStart(e) {
    if (!this.state.isEditMode || this.state.viewMode !== 'favorites') return;
    const card = e.target.closest('.station-card');
    if (!card || !card.hasAttribute('draggable') || card.getAttribute('draggable') !== 'true') { e.preventDefault(); return }
    if (e.target.closest('.action-btn') || e.target.closest('.play-btn')) { e.preventDefault(); return }
    this.dragState.draggedCard = card;
    this.dragState.draggedStationId = parseInt(card.dataset.id);
    this.dragState.draggedIndex = store.getFavoriteIndex(this.dragState.draggedStationId);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    const rect = card.getBoundingClientRect();
    this.dragState.dragOffset.x = e.clientX - rect.left;
    this.dragState.dragOffset.y = e.clientY - rect.top;
    const dragImage = card.cloneNode(true);
    dragImage.style.width = rect.width + 'px';
    dragImage.style.height = rect.height + 'px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.opacity = '0.5';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, this.dragState.dragOffset.x, this.dragState.dragOffset.y);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    this.startPhysicsAnimation();
  }

  startPhysicsAnimation() {
    const animate = () => {
      if (!this.dragState.isDragging && !this.dragState.draggedCard) return;
      this.applyPushPhysics();
      this.dragState.animationFrame = requestAnimationFrame(animate);
    };
    this.dragState.animationFrame = requestAnimationFrame(animate);
  }

  applyPushPhysics() {
    if (!this.dragState.currentPos.x || !this.dragState.currentPos.y) return;
    const draggedCard = this.dragState.draggedCard;
    if (!draggedCard) return;
    const draggedRect = draggedCard.getBoundingClientRect();
    const dragRect = {
      left: this.dragState.currentPos.x - this.dragState.dragOffset.x,
      top: this.dragState.currentPos.y - this.dragState.dragOffset.y,
      right: this.dragState.currentPos.x - this.dragState.dragOffset.x + draggedRect.width,
      bottom: this.dragState.currentPos.y - this.dragState.dragOffset.y + draggedRect.height
    };
    const cards = this.shadowRoot.querySelectorAll('.station-card:not(.dragging)');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const dragCenter = { x: (dragRect.left + dragRect.right) / 2, y: (dragRect.top + dragRect.bottom) / 2 };
      const distance = Math.hypot(cardCenter.x - dragCenter.x, cardCenter.y - dragCenter.y);
      const diagonal = Math.hypot(rect.width, rect.height);
      const pushRadius = diagonal * 0.6;
      const pushForce = diagonal * 0.35;
      if (distance < pushRadius) {
        const force = (1 - distance / pushRadius) * pushForce;
        const angle = Math.atan2(cardCenter.y - dragCenter.y, cardCenter.x - dragCenter.x);
        const pushX = Math.cos(angle) * force;
        const pushY = Math.sin(angle) * force;
        card.style.transform = `translate(${pushX}px, ${pushY}px) scale(${1 - force / (pushForce * 6)})`;
        card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        this.dragState.pushedCards.set(card, { pushX, pushY });
      } else if (this.dragState.pushedCards.has(card)) {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.dragState.pushedCards.delete(card);
      }
    });
  }

  handleDragOver(e) {
    if (!this.state.isEditMode || !this.dragState.draggedCard) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.dragState.currentPos.x = e.clientX;
    this.dragState.currentPos.y = e.clientY;
    const targetCard = this.getCardUnderCursor(e.clientX, e.clientY);
    if (targetCard && targetCard !== this.dragState.draggedCard) this.updateDropTarget(targetCard);
  }

  getCardUnderCursor(x, y) {
    const allCards = this.shadowRoot.querySelectorAll('.station-card');
    for (const card of allCards) {
      if (card === this.dragState.draggedCard) continue;
      const rect = card.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return card;
    }
    return null;
  }

  updateDropTarget(targetCard) {
    const targetIndex = parseInt(targetCard.dataset.index);
    const draggedIndex = this.dragState.draggedIndex;
    if (targetIndex !== draggedIndex) {
      this.dragState.dropTarget = targetCard;
      this.dragState.dropPosition = targetIndex > draggedIndex ? 'after' : 'before';
      this.shadowRoot.querySelectorAll('.station-card').forEach(card => { card.classList.remove('drop-target', 'shift-left', 'shift-right') });
      targetCard.classList.add('drop-target');
      if (targetIndex > draggedIndex) targetCard.classList.add('shift-right'); else targetCard.classList.add('shift-left');
    }
  }

  handleDrop(e) {
    if (!this.state.isEditMode) return;
    e.preventDefault();
    if (!this.dragState.dropTarget || !this.dragState.draggedCard) return;
    const draggedStationId = this.dragState.draggedStationId;
    const targetStationId = parseInt(this.dragState.dropTarget.dataset.id);
    const draggedIndex = store.getFavoriteIndex(draggedStationId);
    let targetIndex = store.getFavoriteIndex(targetStationId);
    if (this.dragState.dropPosition === 'after') {
      targetIndex++;
      if (draggedIndex < targetIndex) targetIndex--;
    }
    if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
      store.reorderFavorites(draggedIndex, targetIndex);
      showToast('Порядок станций изменен', 'success', 1500);
      setTimeout(() => { this.render() }, 300);
    }
    this.resetDragState();
  }

  handleDragEnd() {
    this.cleanupDragEffects();
    this.resetDragState();
  }

  cleanupDragEffects() {
    if (this.dragState.animationFrame) cancelAnimationFrame(this.dragState.animationFrame);
    if (this.dragState.ghost) {
      try { document.body.removeChild(this.dragState.ghost) } catch {}
      this.dragState.ghost = null;
    }
    this.shadowRoot.querySelectorAll('.station-card').forEach(card => {
      card.style.transform = '';
      card.style.transition = '';
      card.classList.remove('dragging', 'drop-target', 'shift-left', 'shift-right');
    });
    this.dragState.pushedCards.clear();
  }

  handleTouchStart(e) {
    if (!this.state.isEditMode || this.state.viewMode !== 'favorites') return;
    const card = e.target.closest('.station-card');
    if (!card || !card.hasAttribute('draggable') || card.getAttribute('draggable') !== 'true') return;
    if (e.target.closest('.action-btn') || e.target.closest('.play-btn')) return;
    const touch = e.touches[0];
    this.dragState.touchStartPos = { x: touch.clientX, y: touch.clientY };
    this.dragState.draggedCard = card;
    this.dragState.draggedStationId = parseInt(card.dataset.id);
    this.dragState.draggedIndex = store.getFavoriteIndex(this.dragState.draggedStationId);
    const rect = card.getBoundingClientRect();
    this.dragState.dragOffset.x = touch.clientX - rect.left;
    this.dragState.dragOffset.y = touch.clientY - rect.top;
  }

  handleTouchMove(e) {
    if (!this.state.isEditMode || !this.dragState.draggedCard) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.dragState.touchStartPos.x;
    const deltaY = touch.clientY - this.dragState.touchStartPos.y;
    const movementThreshold = 'ontouchstart' in window ? 10 : 5;
    if (!this.dragState.isDragging && (Math.abs(deltaX) > movementThreshold || Math.abs(deltaY) > movementThreshold)) {
      this.dragState.isDragging = true;
      this.dragState.draggedCard.classList.add('dragging');
      this.startPhysicsAnimation();
      e.preventDefault();
      const ghost = this.dragState.draggedCard.cloneNode(true);
      ghost.id = 'drag-ghost';
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.5';
      ghost.style.zIndex = '10000';
      ghost.style.width = this.dragState.draggedCard.offsetWidth + 'px';
      ghost.style.height = this.dragState.draggedCard.offsetHeight + 'px';
      document.body.appendChild(ghost);
      this.dragState.ghost = ghost;
    }
    if (this.dragState.isDragging) {
      e.preventDefault();
      this.dragState.currentPos.x = touch.clientX;
      this.dragState.currentPos.y = touch.clientY;
      if (this.dragState.ghost) {
        this.dragState.ghost.style.left = (touch.clientX - this.dragState.dragOffset.x) + 'px';
        this.dragState.ghost.style.top = (touch.clientY - this.dragState.dragOffset.y) + 'px';
      }
      const targetCard = this.getCardUnderCursor(touch.clientX, touch.clientY);
      if (targetCard) this.updateDropTarget(targetCard);
    }
  }

  handleTouchEnd(e) {
    if (this.dragState.ghost) {
      try { document.body.removeChild(this.dragState.ghost) } catch {}
      this.dragState.ghost = null;
    }
    if (this.dragState.isDragging) {
      const touch = e.changedTouches[0];
      const targetCard = this.getCardUnderCursor(touch.clientX, touch.clientY);
      if (targetCard && targetCard !== this.dragState.draggedCard) {
        this.dragState.dropTarget = targetCard;
        this.handleDrop(e);
      }
    }
    this.cleanupDragEffects();
    this.resetDragState();
  }

  resetDragState() {
    if (this.dragState.draggedCard) this.dragState.draggedCard.classList.remove('dragging');
    this.cleanupDragEffects();
    this.dragState = this.initDragState();
  }

  showContextMenu(e, stationId) {
    const station = store.stations.find(s => s.id === stationId);
    if (!station) return;
    if (!this.contextMenu || !document.body.contains(this.contextMenu)) this.createContextMenu();

    const isFavorite = store.isFavorite(stationId);
    const isPlaying = this.playingStationId === stationId;

    const menuItems = [
     { action: 'play', icon: isPlaying ? 'M6 4h4v16H6zm8 0h4v16h-4z' : 'M8 5v14l11-7z', text: isPlaying ? t('contextMenu.pause') : t('contextMenu.play') },

      { action: 'favorite', icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>', text: isFavorite ? t('contextMenu.removeFromFavorites') : t('contextMenu.addToFavorites'), fill: isFavorite ? 'currentColor' : 'none', stroke: true }

    ];



    if (this.state.viewMode === 'favorites') {

      menuItems.push({ divider: true });

      menuItems.push({ action: 'edit-favorites', icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z', text: t('contextMenu.editMode') });

    }

    menuItems.push({ divider: true });

    menuItems.push({ action: 'copy-url', icon: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', text: t('contextMenu.copyUrl'), stroke: true });
    this.contextMenu.innerHTML = `
      <style>
        .context-menu-item { display:flex; align-items:center; gap:.75rem; padding:.75rem 1rem; border-radius:var(--radius-sm); color:var(--text-secondary); font-size:.875rem; cursor:pointer; transition:var(--transition); border:none; background:none; width:100%; text-align:left }
        .context-menu-item:hover { background:var(--surface-hover); color:var(--text-primary) }
        .context-menu-item svg { width:18px; height:18px; flex-shrink:0 }
        .context-menu-divider { height:1px; background:var(--border); margin:.5rem 0 }
      </style>
      ${menuItems.map(item => item.divider ? '<div class="context-menu-divider"></div>' : `<button class="context-menu-item" data-action="${item.action}" data-id="${stationId}"><svg viewBox="0 0 24 24" fill="${item.fill || 'currentColor'}" ${item.stroke ? 'stroke="currentColor" stroke-width="2"' : ''}>${item.icon}</svg><span>${item.text}</span></button>`).join('')}
    `;
    this.positionContextMenu(e);
    this.attachContextMenuListeners();
  }

  positionContextMenu(e) {
    this.contextMenu.style.display = 'block';
    this.contextMenu.style.left = `${e.pageX}px`;
    this.contextMenu.style.top = `${e.pageY}px`;
    requestAnimationFrame(() => {
      const rect = this.contextMenu.getBoundingClientRect();
      if (rect.right > window.innerWidth) this.contextMenu.style.left = `${e.pageX - rect.width}px`;
      if (rect.bottom > window.innerHeight) this.contextMenu.style.top = `${e.pageY - rect.height}px`;
    });
  }

  attachContextMenuListeners() {
    this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        const id = parseInt(item.dataset.id);
        const fsm = store.playerFSM;
        switch (action) {
          case 'play': {
            if (store.current?.id === id) {
              if (fsm.isInState(PlayerStates.PLAYING)) { await store.ensurePaused() }
              else if (fsm.isInStates(PlayerStates.PAUSED, PlayerStates.PAUSED_WAITING, PlayerStates.READY, PlayerStates.WAITING)) { await store.ensurePlaying(store.current) }
              else if (fsm.isInStates(PlayerStates.ERROR, PlayerStates.IDLE)) { await store.play(store.current) }
            } else {
              const station = store.stations.find(s => s.id === id);
              if (station) await store.play(station);
            }
            break;
          }
          case 'favorite': {
            store.toggleFavorite(id);
            this.updateFavorites();
            const station = store.stations.find(s => s.id === id);
            if (station) showToast(store.isFavorite(id) ? `"${station.name}" добавлена в избранное` : `"${station.name}" удалена из избранного`, 'success');
            break;
          }
          case 'edit-favorites': {
            store.setEditMode(true);
            break;
          }
          case 'copy-url': {
            const st = store.stations.find(s => s.id === id);
            if (st) { navigator.clipboard.writeText(st.url); showToast('URL скопирован в буфер обмена', 'success') }
            break;
          }
        }
        this.contextMenu.style.display = 'none';
      });
    });
  }

  updateFavorites() {
    this.shadowRoot.querySelectorAll('.action-btn[data-action="favorite"]').forEach(btn => {
      const id = parseInt(btn.dataset.id);
      const isFavorite = store.isFavorite(id);
      btn.classList.toggle('active', isFavorite);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', isFavorite ? 'currentColor' : 'none');
    });
  }

  updateActiveStation() {
    if (this.updateActiveRafId) return;
    this.updateActiveRafId = requestAnimationFrame(() => {
      const grid = this.stationsGridCache || this.shadowRoot.querySelector('.stations-grid');
      if (!grid) { this.updateActiveRafId = null; return }
      grid.querySelectorAll('.station-card').forEach(card => {
        const id = parseInt(card.dataset.id);
        const isActive = store.current?.id === id;
        if (isActive && !card.classList.contains('active')) {
          card.classList.add('active');
          if (!this.state.isEditMode) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (!isActive && card.classList.contains('active')) {
          card.classList.remove('active');
        }
      });
      this.updateActiveRafId = null;
    });
  }

  updatePlayStates() {
    const grid = this.stationsGridCache || this.shadowRoot.querySelector('.stations-grid');
    if (!grid) return;
    grid.querySelectorAll('.station-card').forEach(card => {
      const id = parseInt(card.dataset.id, 10);
      const playBtn = card.querySelector('.play-btn');
      if (!playBtn) return;
      const shouldShowPause = id === this.playingStationId;
      playBtn.innerHTML = shouldShowPause
        ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    });
  }

  renderEmpty() {
    this.elements.container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <div class="empty-title">Ничего не найдено</div>
        <div>Попробуйте изменить фильтры или поисковый запрос</div>
      </div>
    `;
  }
}
customElements.define('station-grid', StationGrid);