export function createEpisodeModal(options = {}) {
  const {
    mode = 'info',
    title = mode === 'warn' ? 'Предупреждение станции' : 'Информация об эпизодах',
    message = mode === 'warn'
      ? 'Нам очень жаль, но данная станция не предоставляет публичных API для трек‑информации. Мы не смогли получить данные. Если у вас есть доступ к API или документации — свяжитесь с нами.'
      : 'Данная радиостанция транслирует только эпизоды и диджейские сеты. Мы отображаем номер эпизода и дату выпуска вместо названий отдельных треков.',
    linkUrl = '#',
    linkLabel = mode === 'warn' ? 'Связаться с нами' : 'Перейти к эпизодам'
  } = options;

  const existingModal = document.getElementById('episode-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'episode-modal';
  modal.className = `episode-modal episode-modal--${mode}`;
  modal.innerHTML = `
    <div class="episode-modal-overlay"></div>
    <div class="episode-modal-content" role="dialog" aria-modal="true" aria-labelledby="episode-modal-title">
      <div class="episode-modal-header">
        <h3 id="episode-modal-title">${escapeHtml(title)}</h3>
        <button class="episode-modal-close" aria-label="Закрыть">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="episode-modal-body">
        <p class="episode-message">${escapeHtml(message)}</p>
        <div class="episode-modal-link">
          <a href="${escapeAttr(linkUrl)}" target="_blank" rel="noopener noreferrer" class="episode-link">${escapeHtml(linkLabel)}</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const overlay = modal.querySelector('.episode-modal-overlay');
  const closeBtn = modal.querySelector('.episode-modal-close');
  const content = modal.querySelector('.episode-modal-content');

  const closeModal = () => {
    modal.classList.add('closing');
    setTimeout(() => modal.remove(), 300);
  };

  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  content.addEventListener('click', (e) => e.stopPropagation());

  requestAnimationFrame(() => modal.classList.add('show'));

  return {
    setLink: (url) => {
      const link = modal.querySelector('.episode-link');
      if (link && url) link.href = url;
    },
    setMessage: (text) => {
      const p = modal.querySelector('.episode-message');
      if (p && text) p.textContent = text;
    },
    setTitle: (text) => {
      const h = modal.querySelector('#episode-modal-title');
      if (h && text) h.textContent = text;
    },
    setMode: (newMode) => {
      modal.classList.remove('episode-modal--info', 'episode-modal--warn');
      modal.classList.add(`episode-modal--${newMode === 'warn' ? 'warn' : 'info'}`);
    },
    setLinkLabel: (label) => {
      const link = modal.querySelector('.episode-link');
      if (link && label) link.textContent = label;
    },
    close: closeModal
  };
}

// Безопасные экранирующие функции
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function escapeAttr(str) {
  return escapeHtml(str);
}

// Стили — подключаем ОДИН раз
const STYLE_ID = 'episode-modal-style';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  .episode-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .episode-modal.show { opacity: 1; }
  .episode-modal.closing { opacity: 0; }

  .episode-modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
  }

  .episode-modal-content {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .episode-modal.show .episode-modal-content { transform: scale(1); }

  .episode-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  .episode-modal-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
  .episode-modal-close {
    background: var(--surface-hover);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary);
    transition: var(--transition);
  }

  /* Ховеры/акценты различаются по режимам */
  .episode-modal--info .episode-modal-close:hover {
    background: var(--accent1);
    border-color: var(--accent1);
    color: #000;
    transform: rotate(90deg);
  }
  .episode-modal--warn .episode-modal-close:hover {
    background: #f2c94c;
    border-color: #f2c94c;
    color: #000;
    transform: rotate(90deg);
  }

  .episode-modal-body { color: var(--text-secondary); line-height: 1.6; }
  .episode-modal-body p { margin: 0 0 1rem 0; }

  .episode-modal-link {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }
  .episode-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    text-decoration: none;
    font-weight: 600;
    transition: var(--transition);
    margin-top: 0.5rem;
  }
  .episode-link::after { content: '→'; font-size: 1.2em; }

  /* Цвет кнопки по режиму */
  .episode-modal--info .episode-link { background: var(--accent1); color: #000; }
  .episode-modal--info .episode-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(8, 247, 254, 0.4);
  }

  .episode-modal--warn .episode-link { background: #f2c94c; color: #000; }
  .episode-modal--warn .episode-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(242, 201, 76, .35);
  }

  @media (max-width: 768px) {
    .episode-modal-content { padding: 1.5rem; margin: 0 1rem; }
    .episode-modal-header h3 { font-size: 1.1rem; }
    .episode-modal-body { font-size: 0.95rem; }
  }
  `;
  document.head.appendChild(style);
}
