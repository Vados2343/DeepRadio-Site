const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .panel {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 90%;
      max-width: 600px;
      background: var(--bg-gradient-start);
      border-left: 1px solid var(--border);
      padding: 2rem;
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host(.open) .panel {
      transform: translateX(0);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .panel-title {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent1), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-primary);
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
    }
    .close-btn:hover {
      background: var(--surface-hover);
    }
    .changelog-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .version-block {
      padding: 1.5rem;
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }
    .version-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .version-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent1);
    }
    .version-badge {
      padding: 0.25rem 0.75rem;
      background: linear-gradient(135deg, var(--accent1), var(--accent2));
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #000;
      text-transform: uppercase;
    }
    .version-date {
      margin-left: auto;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .changes-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .change-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: var(--radius-sm);
      transition: var(--transition);
    }
    .change-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .change-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }
    .change-icon.new { color: #10b981; }
    .change-icon.fix { color: #ef4444; }
    .change-icon.improve { color: #3b82f6; }
    .change-text {
      flex: 1;
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.6;
    }
    .category-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 1.5rem 0 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .category-title::before {
      content: '';
      width: 4px;
      height: 1.125rem;
      background: linear-gradient(135deg, var(--accent1), var(--accent2));
      border-radius: 2px;
    }
    @media (max-width: 768px) {
      .panel {
        width: 100%;
        max-width: 100%;
        padding: 1.5rem;
      }
      .panel-title { font-size: 1.5rem; }
      .version-number { font-size: 1.25rem; }
    }
  </style>

  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">Список изменений</h2>
      <button class="close-btn" id="close-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <div class="changelog-content">
      <div class="version-block">
        <div class="version-header">
          <span class="version-number">v2.0.1</span>
          <span class="version-badge">ИСПРАВЛЕНИЕ</span>
          <span class="version-date">02.11.2025</span>
        </div>

        <div class="category-title">🔧 Исправления архитектуры</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Устранено дублирование функционала мобильного поиска между header-search.js и mobile-search.js</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">header-search.js теперь отвечает только за desktop поиск</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">mobile-search.js полностью отвечает за мобильный поиск и анимацию</span>
          </li>
        </ul>

        <div class="category-title">✨ Улучшения кода</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Улучшена обработка состояния анимации в mobile-search.js</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Добавлена защита от двойного вызова анимации</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Оптимизирован core.css, убраны дублирующиеся правила</span>
          </li>
        </ul>

        <div class="category-title">📦 Структура компонентов</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Проведен полный анализ компонентов, лишних файлов не обнаружено</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Все 14 компонентов работают в своих областях ответственности</span>
          </li>
        </ul>
      </div>

      <div class="version-block">
        <div class="version-header">
          <span class="version-number">v2.0.0</span>
          <span class="version-badge">КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ</span>
          <span class="version-date">02.11.2025</span>
        </div>

        <div class="category-title">✅ Метаданные и отображение треков</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Исправлено отображение названий песен и исполнителей</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Улучшена синхронизация метаданных между store и player-bar</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Добавлена принудительная эмиссия track-update при смене состояний</span>
          </li>
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Исправлена задержка отображения метаданных при загрузке</span>
          </li>
        </ul>

        <div class="category-title">✅ Исправления состояний Play/Pause</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Полностью переписана логика синхронизации состояний playingStationId</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Добавлен флаг isActuallyPlaying для точного отслеживания состояния</span>
          </li>
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Исправлена проблема с несоответствием иконки play/pause реальному состоянию</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Улучшена обработка быстрых переключений станций</span>
          </li>
        </ul>

        <div class="category-title">✅ Мобильная версия</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Реализована анимация превращения логотипа в поиск на 180°</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Создан модуль mobile-search.js с плавной анимацией</span>
          </li>
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Исправлена работа кнопки поиска на мобильных устройствах</span>
          </li>
        </ul>

        <div class="category-title">✅ Навигация и Header</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Исправлена проблема с заблюренным навигационным ящиком</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Создан модуль header-manager.js для управления layout</span>
          </li>
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Настройка «Центрировать элементы» теперь работает корректно</span>
          </li>
        </ul>
      </div>

      <div class="version-block">
        <div class="version-header">
          <span class="version-number">v1.2.0</span>
          <span class="version-badge">МЕТАДАННЫЕ</span>
          <span class="version-date">02.11.2025</span>
        </div>

        <div class="category-title">🎵 Метаданные - главное обновление</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Полностью реализована система метаданных — теперь отображаются названия треков</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Автоматическое обновление метаданных каждые 30 секунд</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Поддержка atomic.radio, 101.ru, radiorecord.ru, dfm.ru и других API</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Кэширование метаданных для быстрого доступа</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Fallback к названию станции при ошибках получения метаданных</span>
          </li>
        </ul>

        <div class="category-title">🔧 Критические исправления</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Полностью переписан patch-hls.js</span>
          </li>
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Исправлено зависание PlayerBar на состоянии «Загрузка…»</span>
          </li>
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Исправлены быстрые переключения состояний и гонки UI</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Оптимизированы таймауты и повторные попытки подключения</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Улучшена обработка HLS потоков</span>
          </li>
        </ul>
      </div>

      <div class="version-block">
        <div class="version-header">
          <span class="version-number">v1.1.3</span>
          <span class="version-badge">КРИТИЧЕСКИЙ ФИКС</span>
          <span class="version-date">01.11.2025</span>
        </div>

        <div class="category-title">🐛 Критические исправления</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Исправлена ошибка «logger.isDebugEnabled is not a function»</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Добавлена простая функция isDebugEnabled()</span>
          </li>
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Воспроизведение станций полностью восстановлено</span>
          </li>
        </ul>
      </div>

      <div class="version-block">
        <div class="version-header">
          <span class="version-number">v1.1.0</span>
          <span class="version-badge">ОБНОВЛЕНИЕ</span>
          <span class="version-date">30.07.2025</span>
        </div>

        <div class="category-title">✨ Новые возможности</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Новая вкладка «Изменения» с локальным логом релизов</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Гибридный стриминг: прямой URL и автопереход на прокси при ошибках</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Умная дельта-логика метаданных</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Лайк-промпт после первого трека</span>
          </li>
          <li class="change-item">
            <svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
            </svg>
            <span class="change-text">Фикс гонок UI при быстрых переключениях</span>
          </li>
          <li class="change-item">
            <svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span class="change-text">Тихий режим консоли</span>
          </li>
        </ul>
      </div>

      <div class="version-block">
        <div class="version-header">
          <span class="version-number">v1.0.0</span>
          <span class="version-badge">ПЕРВЫЙ РЕЛИЗ</span>
          <span class="version-date">18.07.2025</span>
        </div>

        <div class="category-title">🎉 Первый стабильный релиз</div>
        <ul class="changes-list">
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Обновлённая сетка станций</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Избранное, Недавние и Плейлисты</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Player Bar с управлением и визуализацией</span>
          </li>
          <li class="change-item">
            <svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
            </svg>
            <span class="change-text">Модальное окно эпизодов</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
`;

export class ChangelogPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const closeBtn = this.shadowRoot.getElementById('close-btn');
    closeBtn.addEventListener('click', () => this.close());
    this.addEventListener('click', (e) => {
      if (e.target === this) {
        this.close();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.classList.contains('open')) {
        this.close();
      }
    });
  }

  open() {
    this.style.display = 'block';
    requestAnimationFrame(() => {
      this.classList.add('open');
    });
  }

  close() {
    this.classList.remove('open');
    setTimeout(() => {
      this.style.display = 'none';
    }, 300);
  }
}

customElements.define('changelog-panel', ChangelogPanel);
