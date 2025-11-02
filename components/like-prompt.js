import { store } from '../core/store.js';
import { showToast } from '../utils/toast.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      position: fixed;
      bottom: calc(var(--player-height) + 1rem);
      right: 1rem;
      z-index: 1500;
      pointer-events: none;
    }

    .prompt-container {
      background: var(--surface);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      pointer-events: auto;
      max-width: 350px;
    }

    .prompt-container.show {
      transform: translateX(0);
      opacity: 1;
    }

    .prompt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .prompt-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-right: 0.5rem;
    }

    .info-btn {
      background: none;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--accent1);
      color: #000;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      position: relative;
    }

    .info-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(8, 247, 254, 0.4);
    }

    .info-btn svg {
      width: 14px;
      height: 14px;
      font-weight: 900;
    }

    .tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      right: 0;
      background: var(--bg-gradient-start);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      color: var(--text-primary);
      width: 250px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.2s ease;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      z-index: 10;
    }

    .info-btn:hover .tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .tooltip::after {
      content: '';
      position: absolute;
      bottom: -6px;
      right: 8px;
      width: 12px;
      height: 12px;
      background: var(--bg-gradient-start);
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      transform: rotate(45deg);
    }

    .track-info {
      margin-bottom: 1rem;
    }

    .track-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .station-name {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .prompt-actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .action-btn {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .action-btn:hover {
      background: var(--surface-hover);
      border-color: var(--border-hover);
    }

    .action-btn.like {
      background: var(--accent1);
      border-color: var(--accent1);
      color: #000;
    }

    .action-btn.like:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(8, 247, 254, 0.4);
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
    }

    .disable-prompts {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .disable-prompts input {
      width: 16px;
      height: 16px;
      accent-color: var(--accent1);
      cursor: pointer;
    }

    .disable-prompts label {
      cursor: pointer;
      user-select: none;
    }

    @media (max-width: 768px) {
      :host {
        right: 0.5rem;
        bottom: calc(var(--player-height) + 0.5rem);
      }

      .prompt-container {
        max-width: calc(100vw - 1rem);
      }
    }
  </style>

  <div class="prompt-container" id="prompt">
    <div class="prompt-header">
      <div class="prompt-title">Вам понравился этот трек?</div>
      <button class="info-btn" aria-label="Информация">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
        </svg>
        <div class="tooltip">
          Мы спрашиваем об этом, чтобы собирать более точную статистику прослушивания. Если трек вам понравился, он будет добавлен в статистику, даже если вы слушали его меньше минуты.
        </div>
      </button>
    </div>

    <div class="track-info">
      <div class="track-name" id="track-name"></div>
      <div class="station-name" id="station-name"></div>
    </div>

    <div class="prompt-actions">
      <button class="action-btn like" id="like-btn">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.85-1.26l3.03-7.05c.09-.23.12-.47.12-.72v-1.91l-.01-.01L23 10z"/>
        </svg>
        <span>Да</span>
      </button>
      <button class="action-btn" id="dislike-btn">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 3H6c-.83 0-1.54.5-1.85 1.26l-3.03 7.05c-.09.23-.12.47-.12.72v1.91l.01.01L1 14c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
        </svg>
        <span>Нет</span>
      </button>
    </div>

    <div class="disable-prompts">
      <input type="checkbox" id="disable-checkbox">
      <label for="disable-checkbox">Больше не показывать это сообщение</label>
    </div>
  </div>
`;

export class LikePrompt extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.prompt = this.shadowRoot.getElementById('prompt');
    this.trackName = this.shadowRoot.getElementById('track-name');
    this.stationName = this.shadowRoot.getElementById('station-name');
    this.hideTimeout = null;
  }

  connectedCallback() {
    this.setupEventListeners();

    store.on('show-like-prompt', (e) => {
      this.show(e.detail);
    });
  }

  setupEventListeners() {
    const likeBtn = this.shadowRoot.getElementById('like-btn');
    const dislikeBtn = this.shadowRoot.getElementById('dislike-btn');
    const disableCheckbox = this.shadowRoot.getElementById('disable-checkbox');

    likeBtn.addEventListener('click', () => {
      store.likeCurrentSession();
      showToast('Трек добавлен в статистику', 'success');
      this.hide();
    });

    dislikeBtn.addEventListener('click', () => {
      store.dislikeCurrentSession();
      this.hide();
    });

    disableCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        store.disableLikePrompts();
        showToast('Уведомления отключены', 'info');
        this.hide();
      }
    });
  }

  show(data) {
    const { track, station } = data;

    if (track) {
      this.trackName.textContent = `${track.artist} - ${track.song}`;
    } else {
      this.trackName.textContent = 'Неизвестный трек';
    }

    this.stationName.textContent = station.name;

    this.prompt.classList.add('show');

    // Автоматически скрыть через 15 секунд
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 15000);
  }

  hide() {
    this.prompt.classList.remove('show');

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

customElements.define('like-prompt', LikePrompt);