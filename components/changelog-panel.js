import { t, getCurrentLanguage } from '../utils/i18n.js';



const styles = `

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

      pointer-events: none;

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

    :host(.open) {

      pointer-events: auto;

    }

    :host(.open) .panel {

      transform: translateX(0);

    }

    .panel-header {

      display: flex;

      justify-content: space-between;

      align-items: center;

      margin-bottom: 1rem;

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

    .header-controls {

      display: flex;

      align-items: center;

      gap: 1rem;

    }

    .lang-selector {

      display: flex;

      gap: 0.5rem;

      padding: 0.25rem;

      background: var(--surface);

      border-radius: var(--radius);

      border: 1px solid var(--border);

    }

    .lang-btn {

      padding: 0.4rem 0.75rem;

      background: none;

      border: none;

      border-radius: var(--radius-sm);

      color: var(--text-secondary);

      font-size: 0.875rem;

      font-weight: 600;

      cursor: pointer;

      transition: var(--transition);

      text-transform: uppercase;

    }

    .lang-btn:hover {

      background: var(--surface-hover);

      color: var(--text-primary);

    }

    .lang-btn.active {

      background: var(--accent1);

      color: #000;

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

      margin-top: 1rem;

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

        padding: 1.5rem 1rem;

      }

      .panel-title { font-size: 1.5rem; }

      .panel-header { flex-wrap: wrap; gap: 0.75rem; }

      .header-controls { order: 2; width: 100%; justify-content: space-between; }

      .version-number { font-size: 1.25rem; }

      .version-badge {

        font-size: 0.7rem;

        padding: 0.2rem 0.6rem;

      }

      .version-date {

        font-size: 0.8rem;

        width: 100%;

        margin-left: 0;

        margin-top: 0.5rem;

      }

      .version-header {

        flex-wrap: wrap;

      }

      .category-title {

        font-size: 1rem;

        margin: 1rem 0 0.75rem;

      }

      .change-item {

        padding: 0.6rem;

        flex-direction: row;

        align-items: flex-start;

      }

      .change-icon {

        width: 18px;

        height: 18px;

        margin-top: 0.1rem;

      }

      .change-text {

        font-size: 0.875rem;

        line-height: 1.5;

      }

      .changelog-content {

        gap: 1.5rem;

      }

      .version-block {

        padding: 1.25rem;

      }

    }

    @media (max-width: 480px) {

      .panel {

        padding: 1rem 0.75rem;

      }

      .panel-header {

        margin-bottom: 1.5rem;

        padding: 0 0.25rem;

      }

      .panel-title { font-size: 1.25rem; }

      .close-btn {

        width: 36px;

        height: 36px;

      }

      .version-number { font-size: 1.125rem; }

      .version-badge { font-size: 0.65rem; }

      .category-title {

        font-size: 0.9375rem;

        margin: 0.75rem 0 0.5rem;

      }

      .change-item {

        padding: 0.5rem;

        gap: 0.5rem;

      }

      .change-icon {

        width: 16px;

        height: 16px;

      }

      .change-text {

        font-size: 0.8125rem;

      }

      .version-block {

        padding: 1rem;

        border-radius: var(--radius);

      }

    }

  </style>

`;



// Changelog data with full translations for en, ru, uk

const changelogData = {

  en: [

    {
       version: 'v3.0.1',

      badge: 'improve',

      date: '05.11.2025',

      categories: [

        {

          title: '🌍 Complete i18n Implementation',

          changes: [

            { type: 'fix', text: 'Fixed capsule search placeholder translation (now uses data-i18n attribute)' },

            { type: 'new', text: 'Added context menu translations for all actions (Play, Pause, Add to Favorites, Copy URL, Edit Mode)' },

            { type: 'fix', text: 'Fixed stats calendar translations (months and weekdays now translate correctly)' },

            { type: 'fix', text: 'Fixed stats view placeholder translation (Search tracks...)' },

            { type: 'new', text: 'Added language selector to changelog panel (EN/RU/UK buttons)' },

            { type: 'improve', text: 'Changelog content language now independent from UI language' },

            { type: 'fix', text: 'Fixed changelog closing when selecting language (added stopPropagation)' }

          ]

        },

        {

          title: '🎨 Translation Fixes',

          changes: [

            { type: 'fix', text: 'Translated all genre buttons ("All Genres" now translates properly)' },

            { type: 'fix', text: 'Translated player bar messages (Loading info, On Air, Select station)' },

            { type: 'fix', text: 'Fixed station-grid.js to use translations for genre filter' },

            { type: 'new', text: 'Changed default application language from Russian to English' },

            { type: 'improve', text: 'Improved updateTexts() logic to handle placeholders separately' }

          ]

        },

        {

          title: '🔧 Technical Improvements',

          changes: [

            { type: 'improve', text: 'Completely rewrote changelog-panel.js with dynamic data structure' },

            { type: 'improve', text: 'Added getCurrentLanguage() import for changelog language detection' },

            { type: 'new', text: 'Added changelog_lang localStorage key for persistent language selection' },

            { type: 'improve', text: 'Separated data-i18n and data-i18n-placeholder handling in stats-view' }

          ]

        }

      ]

    },

    {

      version: 'v3.0.0',

      badge: 'majorRelease',

      date: '04.11.2025',

      categories: [

        {

          title: '✨ Capsule Search: Flip Animation',

          changes: [

            { type: 'new', text: 'Introduced capsule search component with smooth 3D flip animation (rotateY 180°)' },

            { type: 'new', text: 'Added flip() and flipBack() methods with JavaScript logic for mouseenter/mouseleave events' },

            { type: 'fix', text: 'Fixed capsule jitter during flip: added display: inline-block to .capsule-scene for size stability' },

            { type: 'fix', text: 'Resolved transform conflicts: hover effects (translateY) now only apply when capsule is not flipped' },

            { type: 'fix', text: 'Fixed CSS typo: capsule-clear.visible → .capsule-clear.visible' },

            { type: 'improve', text: 'Capsule now flips on hover, returns on mouse leave, stays flipped when activated, and closes on click outside or Escape' }

          ]

        },

        {

          title: '🌍 Full Internationalization (i18n)',

          changes: [

            { type: 'new', text: 'Complete translation system for English, Russian, and Ukrainian languages' },

            { type: 'new', text: 'Translated all UI elements: sidebar navigation, settings panel, statistics view, and changelog' },

            { type: 'new', text: 'Extended i18n.js with 150+ translation keys covering all settings options, visualization controls, and statistics labels' },

            { type: 'improve', text: 'Implemented data-i18n attributes throughout HTML for automatic translation updates' }

          ]

        },

        {

          title: '🎨 UI/UX Improvements',

          changes: [

            { type: 'improve', text: 'Enhanced changelog panel with better mobile responsiveness and touch-friendly UI' },

            { type: 'improve', text: 'Improved version badges with gradient styling and better visual hierarchy' },

            { type: 'improve', text: 'Refined change item hover effects with smooth background transitions' }

          ]

        },

        {

          title: '🔧 Technical Improvements',

          changes: [

            { type: 'improve', text: 'Optimized CSS animations with cubic-bezier timing for butter-smooth transitions' },

            { type: 'improve', text: 'Removed redundant CSS rules and cleaned up conflicting selectors' },

            { type: 'new', text: 'Added transform-style: preserve-3d for proper 3D animation rendering' }

          ]

        },

        {

          title: '📱 Mobile Enhancements',

          changes: [

            { type: 'improve', text: 'Improved changelog mobile layout with responsive padding and font sizes' },

            { type: 'improve', text: 'Enhanced touch targets for better mobile interaction' },

            { type: 'improve', text: 'Full-width panels on mobile devices for optimal use of screen space' }

          ]

        }

      ]

    }

  ],

  ru: [
    {

      version: 'v3.0.1',

      badge: 'improve',

      date: '05.11.2025',

      categories: [

        {

          title: '🌍 Полная Реализация i18n',

          changes: [

            { type: 'fix', text: 'Исправлен перевод placeholder поиска капсулы (теперь использует атрибут data-i18n)' },

            { type: 'new', text: 'Добавлены переводы контекстного меню для всех действий (Воспроизвести, Пауза, Добавить в избранное, Копировать URL, Режим редактирования)' },

            { type: 'fix', text: 'Исправлены переводы календаря статистики (месяцы и дни недели теперь переводятся корректно)' },

            { type: 'fix', text: 'Исправлен перевод placeholder в статистике (Поиск по трекам...)' },

            { type: 'new', text: 'Добавлен селектор языка в панель changelog (кнопки EN/RU/UK)' },

            { type: 'improve', text: 'Язык контента changelog теперь независим от языка интерфейса' },

            { type: 'fix', text: 'Исправлено закрытие changelog при выборе языка (добавлен stopPropagation)' }

          ]

        },

        {

          title: '🎨 Исправления Переводов',

          changes: [

            { type: 'fix', text: 'Переведены все кнопки жанров ("Все жанры" теперь переводится правильно)' },

            { type: 'fix', text: 'Переведены сообщения плеера (Загрузка информации, В эфире, Выберите станцию)' },

            { type: 'fix', text: 'Исправлен station-grid.js для использования переводов фильтра жанров' },

            { type: 'new', text: 'Изменен язык приложения по умолчанию с русского на английский' },

            { type: 'improve', text: 'Улучшена логика updateTexts() для раздельной обработки placeholder' }

          ]

        },

        {

          title: '🔧 Технические Улучшения',

          changes: [

            { type: 'improve', text: 'Полностью переписан changelog-panel.js с динамической структурой данных' },

            { type: 'improve', text: 'Добавлен импорт getCurrentLanguage() для определения языка changelog' },

            { type: 'new', text: 'Добавлен ключ localStorage changelog_lang для постоянного выбора языка' },

            { type: 'improve', text: 'Разделена обработка data-i18n и data-i18n-placeholder в stats-view' }

          ]

        }

      ]

    },


    {

      version: 'v3.0.0',

      badge: 'majorRelease',

      date: '04.11.2025',

      categories: [

        {

          title: '✨ Капсула Поиска: Flip Анимация',

          changes: [

            { type: 'new', text: 'Представлен компонент поиска-капсулы с плавной 3D анимацией переворота (rotateY 180°)' },

            { type: 'new', text: 'Добавлены методы flip() и flipBack() с JavaScript логикой для событий mouseenter/mouseleave' },

            { type: 'fix', text: 'Исправлено дрожание капсулы при перевороте: добавлен display: inline-block к .capsule-scene для стабильности размера' },

            { type: 'fix', text: 'Устранены конфликты transform: эффекты hover (translateY) теперь применяются только когда капсула не перевернута' },

            { type: 'fix', text: 'Исправлена опечатка в CSS: capsule-clear.visible → .capsule-clear.visible' },

            { type: 'improve', text: 'Капсула теперь переворачивается при наведении, возвращается при уходе мыши, остается перевернутой при активации и закрывается при клике вне или Escape' }

          ]

        },

        {

          title: '🌍 Полная Интернационализация (i18n)',

          changes: [

            { type: 'new', text: 'Полная система перевода для английского, русского и украинского языков' },

            { type: 'new', text: 'Переведены все элементы UI: боковая навигация, панель настроек, вид статистики и список изменений' },

            { type: 'new', text: 'Расширен i18n.js более чем 150+ ключами перевода, охватывающими все опции настроек, элементы управления визуализацией и метки статистики' },

            { type: 'improve', text: 'Реализованы атрибуты data-i18n по всему HTML для автоматического обновления переводов' }

          ]

        },

        {

          title: '🎨 Улучшения UI/UX',

          changes: [

            { type: 'improve', text: 'Улучшена панель списка изменений с лучшей мобильной адаптивностью и удобным для касаний UI' },

            { type: 'improve', text: 'Улучшены бейджи версий с градиентной стилизацией и лучшей визуальной иерархией' },

            { type: 'improve', text: 'Усовершенствованы эффекты наведения на элементы изменений с плавными переходами фона' }

          ]

        },

        {

          title: '🔧 Технические Улучшения',

          changes: [

            { type: 'improve', text: 'Оптимизированы CSS анимации с cubic-bezier тайминг для масляно-плавных переходов' },

            { type: 'improve', text: 'Удалены избыточные CSS правила и очищены конфликтующие селекторы' },

            { type: 'new', text: 'Добавлен transform-style: preserve-3d для правильного рендеринга 3D анимации' }

          ]

        },

        {

          title: '📱 Мобильные Улучшения',

          changes: [

            { type: 'improve', text: 'Улучшен мобильный макет списка изменений с адаптивными отступами и размерами шрифтов' },

            { type: 'improve', text: 'Улучшены сенсорные цели для лучшего мобильного взаимодействия' },

            { type: 'improve', text: 'Панели во всю ширину на мобильных устройствах для оптимального использования пространства экрана' }

          ]

        }

      ]

    }

  ],

  uk: [

    {
  version: 'v3.0.1',

      badge: 'improve',

      date: '05.11.2025',

      categories: [

        {

          title: '🌍 Повна Реалізація i18n',

          changes: [

            { type: 'fix', text: 'Виправлено переклад placeholder пошуку капсули (тепер використовує атрибут data-i18n)' },

            { type: 'new', text: 'Додано переклади контекстного меню для всіх дій (Відтворити, Пауза, Додати до обраного, Копіювати URL, Режим редагування)' },

            { type: 'fix', text: 'Виправлено переклади календаря статистики (місяці та дні тижня тепер перекладаються коректно)' },

            { type: 'fix', text: 'Виправлено переклад placeholder в статистиці (Пошук по трекам...)' },

            { type: 'new', text: 'Додано селектор мови до панелі changelog (кнопки EN/RU/UK)' },

            { type: 'improve', text: 'Мова контенту changelog тепер незалежна від мови інтерфейсу' },

            { type: 'fix', text: 'Виправлено закриття changelog при виборі мови (додано stopPropagation)' }

          ]

        },

        {

          title: '🎨 Виправлення Перекладів',

          changes: [

            { type: 'fix', text: 'Перекладено всі кнопки жанрів ("Усі жанри" тепер перекладається правильно)' },

            { type: 'fix', text: 'Перекладено повідомлення плеєра (Завантаження інформації, В ефірі, Оберіть станцію)' },

            { type: 'fix', text: 'Виправлено station-grid.js для використання перекладів фільтра жанрів' },

            { type: 'new', text: 'Змінено мову додатку за замовчуванням з російської на англійську' },

            { type: 'improve', text: 'Покращено логіку updateTexts() для окремої обробки placeholder' }

          ]

        },

        {

          title: '🔧 Технічні Покращення',

          changes: [

            { type: 'improve', text: 'Повністю переписано changelog-panel.js з динамічною структурою даних' },

            { type: 'improve', text: 'Додано імпорт getCurrentLanguage() для визначення мови changelog' },

            { type: 'new', text: 'Додано ключ localStorage changelog_lang для постійного вибору мови' },

            { type: 'improve', text: 'Розділено обробку data-i18n та data-i18n-placeholder в stats-view' }

          ]

        }

      ]

    },
       {
      version: 'v3.0.0',

      badge: 'majorRelease',

      date: '04.11.2025',

      categories: [

        {

          title: '✨ Капсула Пошуку: Flip Анімація',

          changes: [

            { type: 'new', text: 'Представлено компонент пошуку-капсули з плавною 3D анімацією перевороту (rotateY 180°)' },

            { type: 'new', text: 'Додано методи flip() та flipBack() з JavaScript логікою для подій mouseenter/mouseleave' },

            { type: 'fix', text: 'Виправлено тремтіння капсули при перевороті: додано display: inline-block до .capsule-scene для стабільності розміру' },

            { type: 'fix', text: 'Усунуто конфлікти transform: ефекти hover (translateY) тепер застосовуються лише коли капсула не перевернута' },

            { type: 'fix', text: 'Виправлено друкарську помилку в CSS: capsule-clear.visible → .capsule-clear.visible' },

            { type: 'improve', text: 'Капсула тепер перевертається при наведенні, повертається при виході миші, залишається перевернутою при активації та закривається при кліку поза нею або Escape' }

          ]

        },

        {

          title: '🌍 Повна Інтернаціоналізація (i18n)',

          changes: [

            { type: 'new', text: 'Повна система перекладу для англійської, російської та української мов' },

            { type: 'new', text: 'Перекладено всі елементи UI: бокова навігація, панель налаштувань, вигляд статистики та список змін' },

            { type: 'new', text: 'Розширено i18n.js понад 150+ ключами перекладу, що охоплюють всі опції налаштувань, елементи управління візуалізацією та мітки статистики' },

            { type: 'improve', text: 'Реалізовано атрибути data-i18n по всьому HTML для автоматичного оновлення перекладів' }

          ]

        },

        {

          title: '🎨 Покращення UI/UX',

          changes: [

            { type: 'improve', text: 'Покращено панель списку змін з кращою мобільною адаптивністю та зручним для дотиків UI' },

            { type: 'improve', text: 'Покращено бейджі версій з градієнтною стилізацією та кращою візуальною ієрархією' },

            { type: 'improve', text: 'Удосконалено ефекти наведення на елементи змін з плавними переходами фону' }

          ]

        },

        {

          title: '🔧 Технічні Покращення',

          changes: [

            { type: 'improve', text: 'Оптимізовано CSS анімації з cubic-bezier таймінгом для масляно-плавних переходів' },

            { type: 'improve', text: 'Видалено зайві CSS правила та очищено конфліктуючі селектори' },

            { type: 'new', text: 'Додано transform-style: preserve-3d для правильного рендерингу 3D анімації' }

          ]

        },

        {

          title: '📱 Мобільні Покращення',

          changes: [

            { type: 'improve', text: 'Покращено мобільний макет списку змін з адаптивними відступами та розмірами шрифтів' },

            { type: 'improve', text: 'Покращено сенсорні цілі для кращої мобільної взаємодії' },

            { type: 'improve', text: 'Панелі на всю ширину на мобільних пристроях для оптимального використання простору екрану' }

          ]

        }

      ]

    }

  ]

};



const iconSvgs = {

  new: '<svg class="change-icon new" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>',

  fix: '<svg class="change-icon fix" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>',

  improve: '<svg class="change-icon improve" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>'

};



export class ChangelogPanel extends HTMLElement {

  constructor() {

    super();

    this.attachShadow({ mode: 'open' });

    // Get saved changelog language or default to current UI language

    this.changelogLang = localStorage.getItem('changelog_lang') || getCurrentLanguage();

  }



  connectedCallback() {

    this.render();

    this.setupEventListeners();



    // Listen for language changes - update title and badge, but keep content language

    document.addEventListener('language-change', () => {

      this.render();

    });

  }



  setupEventListeners() {

    const closeBtn = this.shadowRoot.getElementById('close-btn');

    if (closeBtn) {

      closeBtn.addEventListener('click', () => this.close());

    }
    const langBtns = this.shadowRoot.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
 btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.changelogLang = btn.dataset.lang;
        localStorage.setItem('changelog_lang', this.changelogLang);
        this.render();
      });
    });
    this.addEventListener('click', (e) => {
      if (e.target === this && e.composedPath()[0] === this) {
        this.close();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.classList.contains('open')) {
        this.close();
      }
    });
  }



  render() {

    const data = changelogData[this.changelogLang] || changelogData['en'];



    const changelogHtml = data.map(version => `

      <div class="version-block">

        <div class="version-header">

          <span class="version-number">${version.version}</span>

          <span class="version-badge">${t(`changelog.${version.badge}`)}</span>

          <span class="version-date">${version.date}</span>

        </div>

 

        ${version.categories.map(category => `

          <div class="category-title">${category.title}</div>

          <ul class="changes-list">

            ${category.changes.map(change => `

              <li class="change-item">

                ${iconSvgs[change.type]}

                <span class="change-text">${change.text}</span>

              </li>

            `).join('')}

          </ul>

        `).join('')}

      </div>

    `).join('');



    this.shadowRoot.innerHTML = `

      ${styles}

      <div class="panel">

        <div class="panel-header">

          <h2 class="panel-title">${t('changelog.title')}</h2>

          <div class="header-controls">

            <div class="lang-selector">

              <button class="lang-btn ${this.changelogLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>

              <button class="lang-btn ${this.changelogLang === 'ru' ? 'active' : ''}" data-lang="ru">RU</button>

              <button class="lang-btn ${this.changelogLang === 'uk' ? 'active' : ''}" data-lang="uk">UK</button>

            </div>

            <button class="close-btn" id="close-btn">

              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

                <path d="M18 6L6 18M6 6l12 12"></path>

              </svg>

            </button>

          </div>

        </div>

 

        <div class="changelog-content">

          ${changelogHtml}

        </div>

      </div>

    `;



    // Re-setup event listeners after render

    this.setupEventListeners();

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