import { store } from '../core/store.js';
import { showToast } from '../utils/toast.js';
import { t } from '../utils/i18n.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: var(--font-main);
    }

    .stats-header { 
      margin-bottom: 2rem; 
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title { 
      font-size: 2rem; 
      font-weight: 700; 
      margin-bottom: 0.5rem; 
      background: linear-gradient(135deg, var(--accent1), var(--accent2)); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
      background-clip: text; 
      color: transparent; 
    }

    .export-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.5rem 1rem;
      color: var(--text-primary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .export-btn:hover {
      background: var(--surface-hover);
      border-color: var(--accent1);
      transform: translateY(-1px);
    }

    .export-btn svg {
      width: 16px;
      height: 16px;
    }

    .summary-cards { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
      gap: 1.5rem; 
      margin-bottom: 3rem; 
    }

    .summary-card { 
      background: var(--surface); 
      backdrop-filter: blur(10px); 
      border: 1px solid var(--border); 
      border-radius: var(--radius-lg); 
      padding: 1.5rem; 
      transition: var(--transition); 
      box-shadow: var(--shadow-card);
      position: relative;
      overflow: hidden;
    }

    .summary-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--accent1), var(--accent2));
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    .summary-card:hover {
      transform: translateY(-2px); 
      box-shadow: 0 8px 24px rgba(0,0,0,.2); 
      border-color: var(--accent1);
    }

    .summary-card:hover::before {
      transform: scaleX(1);
    }

    .card-icon { 
      width: 48px; 
      height: 48px; 
      background: linear-gradient(135deg, var(--accent1), var(--accent2)); 
      border-radius: var(--radius); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin-bottom: 1rem; 
    }

    .card-icon svg { 
      width: 24px; 
      height: 24px; 
      color: #fff; 
    }

    .card-value { 
      font-size: 2rem; 
      font-weight: 700; 
      margin-bottom: 0.25rem; 
      text-shadow: 0 1px 2px rgba(0,0,0,.3); 
    }

    .card-label {
      color: var(--text-secondary);
      font-size: .875rem;
      text-shadow: 0 1px 1px rgba(0,0,0,.2);
    }

    .current-session {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-card);
    }

    .current-session-header {
      margin-bottom: 1rem;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, var(--accent1), var(--accent2));
      color: white;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .live-badge svg {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .current-session-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .current-session-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius);
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .current-session-info {
      flex: 1;
    }

    .current-session-station {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }

    .current-session-track {
      font-size: 1rem;
      color: var(--accent1);
      margin-bottom: 0.5rem;
    }

    .current-session-time {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .tabs { 
      display: flex; 
      gap: .5rem; 
      margin-bottom: 2rem; 
      border-bottom: 1px solid var(--border); 
      background: var(--surface); 
      backdrop-filter: blur(10px); 
      padding: .5rem; 
      border-radius: var(--radius-sm);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .tab { 
      padding: 1rem 1.5rem; 
      background: none; 
      border: none; 
      color: var(--text-secondary); 
      font-size: 1rem; 
      font-weight: 500; 
      cursor: pointer; 
      transition: var(--transition); 
      position: relative;
      white-space: nowrap;
    }

    .tab:hover { 
      color: var(--text-primary); 
    }

    .tab.active { 
      color: var(--accent1); 
    }

    .tab.active::after { 
      content: ''; 
      position: absolute; 
      bottom: -1px; 
      left: 0; 
      right: 0; 
      height: 3px; 
      background: var(--accent1); 
    }

    .content-section { 
      display: none; 
    }

    .content-section.active { 
      display: block; 
      background: var(--surface); 
      backdrop-filter: blur(10px); 
      border-radius: var(--radius-lg); 
      padding: 1rem; 
      animation: fadeIn 0.3s ease;
    }

    .calendar-container { 
      margin-bottom: 2rem; 
    }

    .calendar-nav { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 1rem; 
      padding: .5rem; 
    }

    .calendar-nav button { 
      background: var(--surface); 
      border: 1px solid var(--border); 
      border-radius: var(--radius-sm); 
      padding: .5rem 1rem; 
      color: var(--text-primary); 
      cursor: pointer; 
      transition: var(--transition); 
    }

    .calendar-nav button:hover { 
      background: var(--surface-hover); 
      border-color: var(--accent1); 
    }

    .calendar-current { 
      font-size: 1.1rem; 
      font-weight: 600; 
      color: var(--text-primary); 
    }

    .calendar-grid { 
      display: grid; 
      grid-template-columns: repeat(7,1fr); 
      gap: .5rem; 
    }

    .calendar-weekday { 
      text-align: center; 
      font-size: .875rem; 
      font-weight: 600; 
      color: var(--text-muted); 
      padding: .5rem; 
    }

    .calendar-day { 
      aspect-ratio: 1; 
      background: var(--surface); 
      border: 1px solid var(--border); 
      border-radius: var(--radius-sm); 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      cursor: pointer; 
      transition: var(--transition); 
      position: relative; 
    }

    .calendar-day.other-month { 
      opacity: .3; 
    }

    .calendar-day.selected, .calendar-day.today { 
      background: var(--accent1); 
      color: #000; 
      font-weight: 600; 
    }

    .calendar-day.today .calendar-day-time, 
    .calendar-day.selected .calendar-day-time { 
      color: rgba(0,0,0,.7); 
    }

    .calendar-day.has-data::after { 
      content: ''; 
      position: absolute; 
      bottom: 4px; 
      width: 4px; 
      height: 4px; 
      background: var(--accent2); 
      border-radius: 50%; 
    }

    .calendar-day-number { 
      font-size: .875rem; 
    }

    .calendar-day-time { 
      font-size: .7rem; 
      color: var(--text-muted); 
      margin-top: 2px; 
    }

    .history-filters { 
      display: flex; 
      gap: 1rem; 
      margin-bottom: 1.5rem; 
      flex-wrap: wrap; 
    }

    .filter-select { 
      background: var(--surface); 
      border: 1px solid var(--border); 
      border-radius: var(--radius-sm); 
      padding: .75rem 1.25rem; 
      color: var(--text-primary); 
      font-size: .875rem; 
      cursor: pointer; 
      transition: var(--transition); 
    }

    .filter-select:hover {
      border-color: var(--accent1);
      background: var(--surface-hover);
    }

    .filter-select option {
      background: #1a1a1a !important;
      background-color: #1a1a1a !important;
      color: #ffffff !important;
      padding: 0.75rem 1rem;
    }

    .filter-select option:hover,
    .filter-select option:focus,
    .filter-select option:checked {
      background: #2a2a2a !important;
      background-color: #2a2a2a !important;
      color: #ffffff !important;
    }

    .search-filter {
      flex: 1;
      min-width: 200px;
      position: relative;
    }

    .search-filter input {
      width: 100%;
      padding: 0.75rem 1.25rem 0.75rem 2.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.875rem;
      transition: var(--transition);
    }

    .search-filter input:focus {
      outline: none;
      border-color: var(--accent1);
      box-shadow: 0 0 0 3px rgba(8, 247, 254, 0.2);
    }

    .search-filter svg {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }

    .history-list { 
      display: flex; 
      flex-direction: column; 
      gap: 1.25rem; 
      padding: .5rem;
      max-height: 600px;
      overflow-y: auto;
    }

    .history-item { 
      background: var(--surface); 
      backdrop-filter: blur(10px); 
      border: 1px solid var(--border); 
      border-radius: var(--radius); 
      padding: 1.25rem 1.5rem; 
      display: flex; 
      align-items: center; 
      gap: 1.5rem; 
      transition: var(--transition); 
      box-shadow: var(--shadow-card); 
      animation: fadeIn .5s ease forwards;
      position: relative;
    }

    .history-item:nth-child(even) { 
      background: rgba(255,255,255,.05); 
    }

    .history-item.recent { 
      border-left: 3px solid var(--accent1); 
    }

    .history-item.liked { 
      border-left: 3px solid var(--accent3); 
    }

    .history-item:hover { 
      background: var(--surface-hover); 
      border-color: var(--border-hover); 
      transform: translateY(-2px); 
    }

    .history-icon { 
      width: 40px; 
      height: 40px; 
      border-radius: var(--radius-sm); 
      object-fit: cover; 
      flex-shrink: 0; 
      border: 1px solid var(--border); 
      margin-right: .5rem; 
    }

    .history-info { 
      flex: 1; 
      min-width: 0; 
      display: flex; 
      flex-direction: column; 
      gap: .25rem; 
    }

    .history-track { 
      font-weight: 600; 
      font-size: 1rem; 
      margin-bottom: .25rem; 
      overflow: hidden; 
      text-overflow: ellipsis; 
      white-space: normal; 
      color: var(--text-primary); 
      display: flex; 
      align-items: center; 
      gap: .5rem; 
    }

    .like-indicator { 
      width: 16px; 
      height: 16px; 
      color: var(--accent3); 
      flex-shrink: 0; 
    }

    .history-station { 
      font-size: .875rem; 
      color: var(--text-secondary); 
      overflow: hidden; 
      text-overflow: ellipsis; 
      white-space: normal; 
    }

    .track-details {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .track-item {
      background: var(--surface-hover);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }

    .history-time { 
      font-size: .875rem; 
      color: var(--text-secondary); 
      text-align: right; 
      flex-shrink: 0; 
      width: 120px; 
      display: flex; 
      flex-direction: column; 
      gap: .25rem; 
    }

    .session-duration { 
      font-size: .75rem; 
      color: var(--text-muted); 
    }

    .session-count { 
      font-size: .7rem; 
      color: var(--accent1); 
      background: var(--surface-hover); 
      padding: 2px 6px; 
      border-radius: var(--radius-sm); 
      margin-left: .5rem; 
    }

    .remove-btn { 
      background: rgba(255,68,68,.2); 
      border: 1px solid #ff4444; 
      border-radius: var(--radius-sm); 
      padding: .5rem 1rem; 
      color: var(--text-primary); 
      font-size: .75rem; 
      cursor: pointer; 
      transition: var(--transition); 
      flex-shrink: 0; 
    }

    .remove-btn:hover { 
      background: #ff4444; 
      color: #fff; 
      transform: translateY(-1px); 
      box-shadow: 0 0 10px rgba(255,68,68,.5); 
    }

    .genre-chart { 
      display: flex; 
      flex-direction: column; 
      gap: 1rem; 
    }

    .genre-item { 
      display: flex; 
      align-items: center; 
      gap: 1rem; 
    }

    .genre-name { 
      width: 100px; 
      font-size: .875rem; 
      color: var(--text-secondary); 
    }

    .genre-bar-container { 
      flex: 1; 
      height: 24px; 
      background: var(--surface); 
      border-radius: var(--radius-sm); 
      position: relative; 
      overflow: hidden; 
    }

    .genre-bar { 
      height: 100%; 
      background: linear-gradient(90deg, var(--accent1), var(--accent2)); 
      border-radius: var(--radius-sm); 
      transition: width .5s ease; 
    }

    .genre-percentage { 
      position: absolute; 
      right: .5rem; 
      top: 50%; 
      transform: translateY(-50%); 
      font-size: .75rem; 
      font-weight: 600; 
      color: var(--text-primary); 
      z-index: 1; 
    }

    .stats-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .clear-stats-btn { 
      background: var(--accent2); 
      border: none; 
      border-radius: var(--radius-sm); 
      padding: .75rem 1.5rem; 
      color: #fff; 
      font-size: .875rem; 
      font-weight: 600; 
      cursor: pointer; 
      transition: var(--transition); 
    }

    .clear-stats-btn:hover { 
      transform: translateY(-1px); 
      box-shadow: 0 4px 12px rgba(241,91,181,.4); 
    }

    .empty-state { 
      text-align: center; 
      padding: 4rem 2rem; 
      color: var(--text-muted); 
      background: var(--surface); 
      border-radius: var(--radius); 
      backdrop-filter: blur(10px); 
    }

    .empty-icon { 
      width: 80px; 
      height: 80px; 
      margin: 0 auto 1.5rem; 
      opacity: .5; 
    }

    .empty-title { 
      font-size: 1.25rem; 
      font-weight: 500; 
      margin-bottom: .5rem; 
      color: var(--text-secondary); 
    }

    .realtime-indicator { 
      display: inline-flex; 
      align-items: center; 
      gap: .5rem; 
      padding: .25rem .75rem; 
      background: var(--accent1); 
      color: #000; 
      border-radius: var(--radius-sm); 
      font-size: .75rem; 
      font-weight: 600; 
      animation: pulse 2s ease-in-out infinite;
      margin-left: 0.5rem;
    }

    .pagination {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .page-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.5rem 0.75rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      cursor: pointer;
      transition: var(--transition);
    }

    .page-btn:hover {
      background: var(--surface-hover);
      border-color: var(--accent1);
      color: var(--text-primary);
    }

    .page-btn.active {
      background: var(--accent1);
      border-color: var(--accent1);
      color: #000;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .confirm-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-gradient-start);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 2000;
      display: none;
    }

    .confirm-dialog.show {
      display: block;
    }

    .confirm-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }

    .confirm-text {
      margin-bottom: 1.5rem;
      color: var(--text-secondary);
    }

    .confirm-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .confirm-btn {
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .confirm-btn.cancel {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-primary);
    }

    .confirm-btn.cancel:hover {
      background: var(--surface-hover);
    }

    .confirm-btn.confirm {
      background: var(--accent2);
      border: none;
      color: #fff;
    }

    .confirm-btn.confirm:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(241, 91, 181, 0.4);
    }

    @keyframes pulse { 
      0%,100%{opacity:1;} 
      50%{opacity:.7;} 
    }

    @keyframes fadeIn { 
      from{opacity:0;transform:translateY(10px);} 
      to{opacity:1;transform:translateY(0);} 
    }

    @media (max-width: 768px) {
      :host{ padding:1rem; }
      .summary-cards{ grid-template-columns:1fr 1fr; gap:1rem; }
      .card-value{ font-size:1.5rem; }
      .tabs{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
      .history-item{ padding:1rem; flex-wrap:wrap; gap:1rem; }
      .history-icon{ width:32px; height:32px; }
      .history-time{ width:100px; }
      .calendar-grid{ gap:.25rem; }
      .calendar-day{ font-size:.8rem; }
      .search-filter{ min-width: 150px; }
    }

    @media (max-width: 480px) {
      .stats-header { flex-direction: column; align-items: flex-start; }
      .export-btn { width: 100%; justify-content: center; }
    }
  </style>
  
  <div class="stats-header">
 <h1 class="page-title" data-i18n="stats.title">Статистика прослушивания</h1>
    <button class="export-btn" id="export-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
      </svg>
      <span data-i18n="stats.export">Экспорт</span>
    </button>
  </div>

  <div class="summary-cards">
    <div class="summary-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <div class="card-value" id="today-time">0 мин</div>
      <div class="card-label" data-i18n="stats.today">Сегодня</div>

    </div>
    <div class="summary-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="card-value" id="week-time">0 мин</div>
      <div class="card-label" data-i18n="stats.week">За неделю</div>
    </div>
    <div class="summary-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <div class="card-value" id="stations-count">0</div>
      <div class="card-label" data-i18n="stats.stations">Станций</div>
    </div>
    <div class="summary-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <div class="card-value" id="total-time">
        <span id="total-time-value">0 мин</span>
        <span class="realtime-indicator" id="realtime-indicator" style="display:none;">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="12"/>
          </svg>
          LIVE
        </span>
      </div>
      <div class="card-label" data-i18n="stats.totalTime">Всего времени</div>
    </div>
  </div>

  <div class="current-session" id="current-session" style="display: none;">
    <div class="current-session-header">
      <div class="live-badge">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="12"/>
        </svg>
        <span data-i18n="stats.nowPlaying">Сейчас играет</span>
      </div>
    </div>
    <div class="current-session-content">
      <img class="current-session-icon" id="current-session-icon" src="" alt="">
      <div class="current-session-info">
        <div class="current-session-station" id="current-session-station"></div>
        <div class="current-session-track" id="current-session-track"></div>
        <div class="current-session-time" id="current-session-time"></div>
      </div>
    </div>
  </div>

  <div class="tabs">
    <button class="tab active" data-tab="calendar" data-i18n="stats.calendar">Календарь</button>
    <button class="tab" data-tab="history" data-i18n="stats.history">История</button>
    <button class="tab" data-tab="genres" data-i18n="stats.genres">Жанры</button>
    <button class="tab" data-tab="stations" data-i18n="stats.topStations">Топ станций</button>
  </div>

  <div class="content-section active" id="calendar-section">
    <div class="calendar-container">
      <div class="calendar-nav">
        <button id="calendar-prev">←</button>
        <div class="calendar-current" id="calendar-current"></div>
        <button id="calendar-next">→</button>
      </div>
      <div class="calendar-grid" id="calendar-grid"></div>
    </div>
    <div class="history-list" id="selected-day-history"></div>
  </div>

  <div class="content-section" id="history-section">
    <div class="history-filters">
      <select class="filter-select" id="time-filter">
       <option value="all" data-i18n="stats.allTime">Все время</option>
        <option value="today" data-i18n="stats.today">Сегодня</option>
        <option value="week" data-i18n="stats.thisWeek">Неделя</option>
        <option value="month" data-i18n="stats.thisMonth">Месяц</option>
      </select>
      <select class="filter-select" id="station-filter">
        <option value="all" data-i18n="stats.allStations">Все станции</option>
      </select>
      <div class="search-filter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="search" id="track-search" placeholder="Поиск по трекам..." data-i18n-placeholder="stats.searchTracks">
      </div>
    </div>
    <div class="history-list" id="history-list"></div>
    <div class="pagination" id="history-pagination"></div>
  </div>
  <div class="content-section" id="genres-section">
    <div class="genre-chart" id="genre-chart"></div>
  </div>
  <div class="content-section" id="stations-section">
    <div class="history-list" id="top-stations"></div>
  </div>
  <div class="stats-footer">
    <button class="clear-stats-btn" id="clear-stats" data-i18n="stats.clearStats">Очистить статистику</button>
  </div>
  <div class="confirm-dialog" id="confirm-dialog">
    <h3 class="confirm-title" data-i18n="stats.confirmClear">Подтверждение</h3>
    <p class="confirm-text" data-i18n="stats.confirmClearText">Вы уверены, что хотите очистить всю статистику? Это действие необратимо.</p>
    <div class="confirm-actions">
      <button class="confirm-btn cancel" id="confirm-cancel" data-i18n="stats.cancel">Отмена</button>
      <button class="confirm-btn confirm" id="confirm-clear" data-i18n="stats.clear">Очистить</button>
    </div>
  </div>
`;

class StatsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.currentDate = new Date();
    this.selectedDate = null;
    this.updateTimer = null;
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.searchQuery = '';
    this.activeTab = 'calendar';
  }

  // ФИКС: Helper для форматирования дат в LOCAL timezone (не UTC!)
  formatDateString(date) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  connectedCallback() {
    this.setupEventListeners();
    this.loadStats();
    this.initCalendar();
    this.updateTexts();
    store.on('stats-update', () => this.updateRealtimeStats());
    store.on('track-update', () => this.updateCurrentSession());
    store.on('station-change', () => this.updateCurrentSession());
    this.updateTimer = setInterval(() => this.updateRealtimeStats(), 5000);
    document.addEventListener('language-change', () => {
      this.updateTexts();
      this.renderCalendar();
      this.filterHistory();
       });
  }

  disconnectedCallback() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    store.off('stats-update', this.updateRealtimeStats);
    store.off('track-update', this.updateCurrentSession);
    store.off('station-change', this.updateCurrentSession);
  }

  setupEventListeners() {
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.shadowRoot.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        const sectionId = `${tab.dataset.tab}-section`;
        this.shadowRoot.getElementById(sectionId).classList.add('active');
        this.activeTab = tab.dataset.tab;
      });
    });

    this.shadowRoot.getElementById('time-filter').addEventListener('change', () => this.filterHistory());
    this.shadowRoot.getElementById('station-filter').addEventListener('change', () => this.filterHistory());
    this.shadowRoot.getElementById('track-search').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.currentPage = 1;
      this.filterHistory();
    });

    this.shadowRoot.getElementById('calendar-prev').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });

    this.shadowRoot.getElementById('calendar-next').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });

    this.shadowRoot.getElementById('clear-stats').addEventListener('click', () => {
      this.showConfirmDialog();
    });

    this.shadowRoot.getElementById('confirm-cancel').addEventListener('click', () => {
      this.hideConfirmDialog();
    });

    this.shadowRoot.getElementById('confirm-clear').addEventListener('click', () => {
      this.clearAllStats();
      this.hideConfirmDialog();
    });

    this.shadowRoot.getElementById('export-btn').addEventListener('click', () => {
      this.exportStats();
    });
  }

  loadStats() {
    const stats = this.getAllStats();
    this.updateSummaryCards(stats);
    this.updateHistoryList(stats.sessions);
    this.updateGenreChart(stats.genres);
    this.updateTopStations(stats.stations);
    this.updateStationFilter(stats.stations);
  }

  getAllStats() {
    const stats = store.getStats();
    const now = Date.now();
    const todayStart = new Date().setHours(0,0,0,0);
    const weekAgo = now - 604800000;

    const times = { today: 0, week: 0, total: stats.totalTime || 0 };

    const validSessions = this.validateSessions(stats.sessions);

    validSessions.forEach(session => {
      if (session.timestamp >= todayStart) times.today += session.time;
      if (session.timestamp >= weekAgo) times.week += session.time;
    });

    if (store.sessionStartTime && store.current) {
      const currentSessionTime = now - store.sessionStartTime;
      times.today += currentSessionTime;
      times.week += currentSessionTime;
      times.total += currentSessionTime;
    }

    return {
      sessions: validSessions.sort((a,b) => b.timestamp - a.timestamp),
      genres: this.sanitizeGenres(stats.genres),
      stations: this.sanitizeStations(stats.stations),
      times,
      dailyStats: stats.dailyStats || {}
    };
  }

  validateSessions(sessions) {
    if (!Array.isArray(sessions)) return [];

    return sessions.filter(session => {
      return session &&
             typeof session.id === 'string' &&
             typeof session.stationId === 'number' &&
             typeof session.timestamp === 'number' &&
             typeof session.time === 'number' &&
             session.time > 0 &&
             session.timestamp > 0;
    });
  }

  sanitizeGenres(genres) {
    if (!genres || typeof genres !== 'object') return {};

    const sanitized = {};
    for (const [genre, time] of Object.entries(genres)) {
      if (typeof time === 'number' && time > 0) {
        sanitized[this.escapeHtml(genre)] = time;
      }
    }
    return sanitized;
  }

  sanitizeStations(stations) {
    if (!stations || typeof stations !== 'object') return {};

    const sanitized = {};
    for (const [id, data] of Object.entries(stations)) {
      if (data && typeof data.time === 'number' && data.time > 0) {
        sanitized[id] = {
          name: this.escapeHtml(data.name || 'Unknown'),
          time: data.time,
          sessions: data.sessions || 0
        };
      }
    }
    return sanitized;
  }
updateTexts() {
  this.shadowRoot.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const text = t(key);
    element.textContent = text;
  });

  this.shadowRoot.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const text = t(key);
    element.placeholder = text;
  });

  this.updateStationFilterOptions();
}


  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateRealtimeStats() {
    const stats = this.getAllStats();
    this.updateSummaryCards(stats);
    const indicator = this.shadowRoot.getElementById('realtime-indicator');
    if (store.current && store.audio && !store.audio.paused) {
      indicator.style.display = 'inline-flex';
    } else {
      indicator.style.display = 'none';
    }

    // Обновить блок текущей сессии
    this.updateCurrentSession();
  }

  updateCurrentSession() {
    const currentSession = store.getCurrentSession();
    const container = this.shadowRoot.getElementById('current-session');

    if (!currentSession || !store.current) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    // ФИКС: Брать данные из store.current (актуальная станция), а не из currentSession!
    const station = store.current;
    const iconUrl = `/Icons/icon${station.id + 1}.png`;

    const icon = this.shadowRoot.getElementById('current-session-icon');
    icon.src = iconUrl;
    icon.alt = station.name;

    const stationEl = this.shadowRoot.getElementById('current-session-station');
    stationEl.textContent = station.name;

    // ФИКС: Брать текущий трек из store.currentTrack, а не из старой сессии!
    const trackEl = this.shadowRoot.getElementById('current-session-track');
    if (store.currentTrack && store.currentTrack.artist && store.currentTrack.song) {
      trackEl.textContent = `${store.currentTrack.artist} - ${store.currentTrack.song}`;
      trackEl.style.display = 'block';
    } else {
      trackEl.textContent = '';
      trackEl.style.display = 'none';
    }

    const timeEl = this.shadowRoot.getElementById('current-session-time');
    const duration = this.formatTime(currentSession.duration || 0);
    const genres = station.tags && station.tags.length > 0
      ? station.tags.join(', ')
      : '';
    timeEl.textContent = `${duration}${genres ? ` • ${genres}` : ''}`;
  }

  updateSummaryCards(stats) {
    this.shadowRoot.getElementById('today-time').textContent = this.formatTime(stats.times.today);
    this.shadowRoot.getElementById('week-time').textContent = this.formatTime(stats.times.week);
    this.shadowRoot.getElementById('total-time-value').textContent = this.formatTime(stats.times.total);
    this.shadowRoot.getElementById('stations-count').textContent = Object.keys(stats.stations).length;
  }

  initCalendar() {
    this.renderCalendar();
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
  const monthNames = t('stats.months');
    this.shadowRoot.getElementById('calendar-current').textContent = `${monthNames[month]} ${year}`;
    const grid = this.shadowRoot.getElementById('calendar-grid');
    grid.innerHTML = '';
    const weekdays = t('stats.weekdays');
    weekdays.forEach(d => {
      const e = document.createElement('div');
      e.className = 'calendar-weekday';
      e.textContent = d;
      grid.appendChild(e);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const offset = (firstDay.getDay() || 7) - 1;
    startDate.setDate(startDate.getDate() - offset);

    const stats = store.getStats();

    while (startDate <= lastDay || startDate.getDay() !== 1) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';

      if (startDate.getMonth() !== month) dayElement.classList.add('other-month');

      const dateStr = this.formatDateString(startDate);
      const dayStats = stats.dailyStats && stats.dailyStats[dateStr];

      const numDiv = document.createElement('div');
      numDiv.className = 'calendar-day-number';
      numDiv.textContent = startDate.getDate();
      dayElement.appendChild(numDiv);

      if (dayStats && dayStats.time > 0) {
        dayElement.classList.add('has-data');
        const tDiv = document.createElement('div');
        tDiv.className = 'calendar-day-time';
        tDiv.textContent = this.formatShortTime(dayStats.time);
        dayElement.appendChild(tDiv);
      }

      dayElement.dataset.date = dateStr;
      dayElement.addEventListener('click', () => this.selectDate(dateStr));

      grid.appendChild(dayElement);
      startDate.setDate(startDate.getDate() + 1);
    }

    const todayStr = this.formatDateString(new Date());
    const todayCell = grid.querySelector(`[data-date="${todayStr}"]`);
    if (todayCell) todayCell.classList.add('today');
  }

  selectDate(dateStr) {
    this.shadowRoot.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    const el = this.shadowRoot.querySelector(`[data-date="${dateStr}"]`);
    if (el) el.classList.add('selected');
    this.selectedDate = dateStr;
    this.showDayHistory(dateStr);
  }

  showDayHistory(dateStr) {
    const { dailyStats } = store.getStats();
    const container = this.shadowRoot.getElementById('selected-day-history');
    const dayStats = dailyStats && dailyStats[dateStr];

    if (!dayStats || !dayStats.sessions || dayStats.sessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
           <div class="empty-title">${t('stats.noDataFor')} ${new Date(dateStr).toLocaleDateString()}</div>
        </div>
      `;
      return;
    }

    const stationMap = {};
    dayStats.sessions.forEach(s => {
      if (!stationMap[s.stationId]) {
        stationMap[s.stationId] = {
          stationName: s.stationName,
          sessions: [],
          totalTime: 0,
          tracks: new Map()
        };
      }
      stationMap[s.stationId].sessions.push(s);
      stationMap[s.stationId].totalTime += s.time;

      if (s.track && s.track.id) {
        const trackId = s.track.id;
        if (!stationMap[s.stationId].tracks.has(trackId)) {
          stationMap[s.stationId].tracks.set(trackId, {
            ...s.track,
            count: 0,
            totalTime: 0
          });
        }
        const track = stationMap[s.stationId].tracks.get(trackId);
        track.count++;
        track.totalTime += s.time;
      }
    });

    container.innerHTML = Object.entries(stationMap).map(([id, data]) => {
      const station = store.stations.find(s => s.id === parseInt(id));
      const iconUrl = station ? `/Icons/icon${station.id + 1}.png` : '/Icons/default.png';

      const tracks = Array.from(data.tracks.values()).sort((a, b) => b.totalTime - a.totalTime);

      return `
        <div class="history-item">
          <img class="history-icon" src="${iconUrl}" alt="${this.escapeHtml(data.stationName)}" onerror="this.src='/Icons/default.png'">
          <div class="history-info">
            <div class="history-track">
              ${this.escapeHtml(data.stationName)}
              <span class="session-count">${data.sessions.length} ${this.pluralize(data.sessions.length, t('stats.session'), t('stats.sessions'), t('stats.sessionsMany'))}</span>
            </div>
            <div class="history-station">${this.formatTime(data.totalTime)}</div>
            ${tracks.length > 0 ? `
              <div class="track-details">
                ${tracks.slice(0, 3).map(t => `
                  <div class="track-item">
                    ${t.artist ? `${this.escapeHtml(t.artist)} - ${this.escapeHtml(t.song)}` : this.escapeHtml(t.song)}
                    ${t.count > 1 ? `(×${t.count})` : ''}
                  </div>
                `).join('')}
                ${tracks.length > 3 ? `<div class="track-item">${t('stats.andMore')} ${tracks.length - 3}...</div>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  updateHistoryList(sessions) {
    const container = this.shadowRoot.getElementById('history-list');

    let filteredSessions = this.filterSessions(sessions);

    if (filteredSessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
           <div class="empty-title">${t('stats.noHistory')}</div>
          <div>${t('stats.startListening')}</div>
        </div>
      `;
      this.updatePagination(0);
      return;
    }

    const totalPages = Math.ceil(filteredSessions.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageSessions = filteredSessions.slice(startIndex, endIndex);

    const fragment = document.createDocumentFragment();

    pageSessions.forEach(session => {
      const station = store.stations.find(s => s.id === session.stationId);
      const iconUrl = station ? `/Icons/icon${station.id + 1}.png` : '/Icons/default.png';
      const isRecent = Date.now() - session.timestamp < 3600000;

      const item = document.createElement('div');
      item.className = `history-item${isRecent?' recent':''}${session.liked?' liked':''}`;
      item.dataset.sessionId = session.id;

      const trackInfo = session.track ?
        `<div class="history-station" style="color: var(--text-primary); font-size: 0.875rem; margin: 0.25rem 0;">
          ${session.track.artist ? `${this.escapeHtml(session.track.artist)} - ${this.escapeHtml(session.track.song)}` : this.escapeHtml(session.track.song)}
        </div>` : '';

      item.innerHTML = `
        <img class="history-icon" src="${iconUrl}" alt="${this.escapeHtml(session.stationName)}" onerror="this.src='/Icons/default.png'">
        <div class="history-info">
          <div class="history-track">
            ${this.escapeHtml(session.stationName)}${session.liked?' <svg class="like-indicator" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>':''}
          </div>
          ${trackInfo}
          <div class="history-station">${t('stats.genresLabel')}: ${session.genres.map(g => this.escapeHtml(g)).join(', ')}</div>
        </div>
        <div class="history-time">
          ${new Date(session.timestamp).toLocaleString('ru-RU',{dateStyle:'short',timeStyle:'short'})}
          <span class="session-duration">${this.formatTime(session.time)}</span>
        </div>
        <button class="remove-btn" data-session-id="${session.id}">${t('stats.remove')}</button>
      `;

      fragment.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(fragment);

    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.removeSession(btn.dataset.sessionId);
      });
    });

    this.updatePagination(totalPages);
  }

  filterSessions(sessions) {
    let filtered = [...sessions];

    const timeFilter = this.shadowRoot.getElementById('time-filter').value;
    const stationFilter = this.shadowRoot.getElementById('station-filter').value;

    if (timeFilter !== 'all') {
      const now = Date.now();
      const bounds = {
        today: new Date().setHours(0,0,0,0),
        week: now - 604800000,
        month: now - 2592000000
      };
      filtered = filtered.filter(s => s.timestamp >= bounds[timeFilter]);
    }

    if (stationFilter !== 'all') {
      filtered = filtered.filter(s => s.stationId === parseInt(stationFilter));
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        if (s.track) {
          const trackStr = `${s.track.artist} ${s.track.song}`.toLowerCase();
          return trackStr.includes(query);
        }
        return s.stationName.toLowerCase().includes(query);
      });
    }

    return filtered;
  }

  updatePagination(totalPages) {
    const container = this.shadowRoot.getElementById('history-pagination');

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';

    html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">←</button>`;

    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      html += `<button class="page-btn" data-page="1">1</button>`;
      if (start > 2) html += `<span style="padding: 0 0.5rem;">...</span>`;
    }

    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span style="padding: 0 0.5rem;">...</span>`;
      html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">→</button>`;

    container.innerHTML = html;

    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          this.currentPage = parseInt(btn.dataset.page);
          this.filterHistory();
        }
      });
    });
  }

  updateGenreChart(genres) {
    const container = this.shadowRoot.getElementById('genre-chart');
    const entries = Object.entries(genres);

    if (entries.length === 0) {
     container.innerHTML = `<div class="empty-state"><div class="empty-title">${t('stats.noGenres')}</div></div>`;
      return;
    }

    const sorted = entries.sort((a,b) => b[1] - a[1]);
    const total = sorted.reduce((sum,[,t]) => sum+t,0);

    container.innerHTML = sorted.slice(0,10).map(([g,t]) => {
      const pct = Math.round(t/total*100);
      return `
        <div class="genre-item">
          <div class="genre-name">${g}</div>
          <div class="genre-bar-container">
            <div class="genre-bar" style="width:${pct}%"></div>
            <div class="genre-percentage">${pct}%</div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateTopStations(stations) {
    const container = this.shadowRoot.getElementById('top-stations');
    const entries = Object.entries(stations);

    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-title">${t('stats.noStations')}</div></div>`;
      return;
    }

    const sorted = entries.sort((a,b) => b[1].time - a[1].time);

    container.innerHTML = sorted.slice(0,10).map(([id,data]) => {
      const station = store.stations.find(s => s.id === parseInt(id));
      const iconUrl = station ? `/Icons/icon${station.id + 1}.png` : '/Icons/default.png';
      const sessions = data.sessions || 0;

      return `
        <div class="history-item">
          <img class="history-icon" src="${iconUrl}" alt="${data.name}" onerror="this.src='/Icons/default.png'">
          <div class="history-info">
            <div class="history-track">${data.name}</div>
            <div class="history-station">
              ${this.formatTime(data.time)} • <span class="station-sessions">${sessions}</span> ${this.pluralize(sessions, t('stats.session'), t('stats.sessions'), t('stats.sessionsMany'))}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  updateStationFilter(stations) {
    const select = this.shadowRoot.getElementById('station-filter');
    const current = select.value;
select.innerHTML = `<option value="all">${t('stats.allStations')}</option>`;
    Object.entries(stations)
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .forEach(([id, data]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = data.name;
        select.appendChild(option);
      });
    if (current && select.querySelector(`option[value="${current}"]`)) {
      select.value = current;
    }
  }
  updateStationFilterOptions() {
    const stats = this.getAllStats();
    if (stats && stats.stations) {
      this.updateStationFilter(stats.stations);
    }
  }

  filterHistory() {
    const stats = this.getAllStats();
    this.updateHistoryList(stats.sessions);
  }

  removeSession(sessionId) {
    const stats = store.getStats();
    const idx = stats.sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return;

    const session = stats.sessions[idx];
    stats.sessions.splice(idx,1);
    stats.totalTime -= session.time;

    if (stats.stations[session.stationId]) {
      stats.stations[session.stationId].time -= session.time;
      stats.stations[session.stationId].sessions--;
      if (stats.stations[session.stationId].sessions === 0) {
        delete stats.stations[session.stationId];
      }
    }

    session.genres.forEach(g => {
      if (stats.genres[g]) {
        stats.genres[g] -= session.time;
        if (stats.genres[g] <= 0) delete stats.genres[g];
      }
    });

    const dayStr = session.date || this.formatDateString(new Date(session.timestamp));
    if (stats.dailyStats && stats.dailyStats[dayStr]) {
      stats.dailyStats[dayStr].time -= session.time;
      const di = stats.dailyStats[dayStr].sessions.findIndex(s => s.id === sessionId);
      if (di !== -1) stats.dailyStats[dayStr].sessions.splice(di,1);
      if (stats.dailyStats[dayStr].sessions.length === 0) {
        delete stats.dailyStats[dayStr];
      }
    }
    store.setStorage('listeningStats',stats);
    this.loadStats();
    this.renderCalendar();
   showToast(t('stats.sessionRemoved'),'success');
  }
  showConfirmDialog() {
    this.shadowRoot.getElementById('confirm-dialog').classList.add('show');
  }
  hideConfirmDialog() {
    this.shadowRoot.getElementById('confirm-dialog').classList.remove('show');
  }
  clearAllStats() {
    store.resetStats();
    this.currentPage = 1;
    this.loadStats();
    this.renderCalendar();
    showToast(t('stats.statsCleared'),'success');
  }

  exportStats() {
    const stats = this.getAllStats();

    const data = {
      exportDate: new Date().toISOString(),
      totalTime: stats.times.total,
      totalSessions: stats.sessions.length,
      stations: Object.entries(stats.stations).map(([id, data]) => ({
        id: parseInt(id),
        name: data.name,
        time: data.time,
        sessions: data.sessions
      })),
      genres: stats.genres,
      sessions: stats.sessions.map(s => ({
        ...s,
        date: new Date(s.timestamp).toLocaleDateString('ru-RU'),
        time: new Date(s.timestamp).toLocaleTimeString('ru-RU'),
        duration: this.formatTime(s.time),
        track: s.track || null
      }))
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `deepradio-stats-${this.formatDateString(new Date())}.json`;
    a.click();

    URL.revokeObjectURL(url);
     showToast(t('stats.statsExported'), 'success');
  }

  formatTime(ms) {
    const minutes = Math.floor(Math.max(0,ms)/60000);
    const hours = Math.floor(minutes/60);
    const days = Math.floor(hours/24);

    if (days > 0) return `${days} ${this.pluralize(days,t('stats.day'),t('stats.days'),t('stats.daysMany'))}`;
    if (hours > 0) return `${hours} ${this.pluralize(hours,t('stats.hour'),t('stats.hours'),t('stats.hoursMany'))}`;
    return `${minutes} ${t('stats.minutes')}`;
  }

  formatShortTime(ms) {
    const minutes = Math.floor(Math.max(0,ms)/60000);
    const hours = Math.floor(minutes/60);

    if (hours > 0) return `${hours}ч`;
    return `${minutes}м`;
  }

  pluralize(count, one, few, many) {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;

    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }
}

customElements.define('stats-view', StatsView);