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
      transition: var(--transition);
    }
    .version-block:hover {
      border-color: var(--accent1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
    .version-badge.critical {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
    }
    .version-badge.fix {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #000;
    }
    .version-badge.firstRelease {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: #fff;
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
      transform: translateX(4px);
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
      .lang-selector {
        gap: 0.25rem;
      }
      .lang-btn {
        padding: 0.35rem 0.6rem;
        font-size: 0.8rem;
      }
    }
  </style>
`;

// Changelog data with full translations for en, ru, uk, it
const changelogData = {
  en: [
      {
  version: 'v3.1.3',
  badge: 'Bug Fixes',
  date: '2025-11-12',

  categories: [
    {
      title: '🐛 Critical Bug Fixes',
      changes: [
        { type: 'fix', text: 'Fixed favorites index — now adds to the beginning (index 1) instead of the end' },
        { type: 'fix', text: 'Fixed floating player boundaries — now stays within window with 20px margin' },
        { type: 'fix', text: 'Fixed drag mode toggling — player no longer jumps when enabled/disabled' },
        { type: 'fix', text: 'Fixed default header layout — logo now truly centered' },
        { type: 'fix', text: 'Fixed accent color buttons — now wrap and stay inside the form area' },
        { type: 'fix', text: 'Added Configure button lock with warning when island mode is inactive' }
      ]
    },
    {
      title: '🎨 UI/UX Improvements',
      changes: [
        { type: 'new', text: 'Added 5 header themes: glass, neon, dark, minimal (plus existing light/oled)' },
        { type: 'new', text: 'Header themes now adapt to form colors (white, neon dark, black, glass)' },
        { type: 'improve', text: 'Improved mobile responsiveness of floating player (max width 90vw)' },
        { type: 'improve', text: 'Improved floating player positioning logic to prevent off-screen overflow' }
      ]
    },
    {
      title: '🌍 Translation Updates',
      changes: [
        { type: 'new', text: 'Added islandModeRequired message translation (UA/EN)' },
        { type: 'improve', text: 'Updated all interface strings for better consistency' }
      ]
    },
    {
      title: '🔧 Technical Enhancements',
      changes: [
        { type: 'improve', text: 'Refactored enableFloating() to use restorePosition() instead of fixed coordinates' },
        { type: 'improve', text: 'Improved updatePosition() with margin constraints' },
        { type: 'improve', text: 'Enhanced handleResize() to keep player inside window on resize' },
        { type: 'new', text: 'Added flex-wrap to accent-colors container for better layout' }
      ]
    }
  ]
},

          {
            version: 'v3.1.2',
            badge: 'fix',
            date: '06.11.2025',
            categories: [

        {

          title: '🐛 Bug Fixes',

          changes: [

            { type: 'fix', text: 'Fixed i18n translations for floating player appearance settings' },

            { type: 'fix', text: 'Fixed floating player position reset - now always appears at bottom-center on page reload' },

            { type: 'fix', text: 'Fixed equalizer bars toggle - now properly shows/hides animated bars during playback' },

            { type: 'fix', text: 'Fixed cover visualization toggle - station icon pulsing effect now respects toggle setting' },

            { type: 'fix', text: 'Fixed accent color switching bug - can now switch colors after applying custom gradient' },

            { type: 'fix', text: 'Fixed favorites display order - favorites now display in correct order (newest first)' }

          ]

        },

        {

          title: '✨ New Features',

          changes: [

            { type: 'new', text: 'Added settings button visibility toggle - can now hide/show settings button in floating player' },

            { type: 'new', text: 'Custom gradient now saved as selectable accent color option with ✨ icon' },

            { type: 'new', text: 'Equalizer bars visualization - 4 animated bars that pulse during playback' }

          ]

        },

        {

          title: '🎨 UI Improvements',

          changes: [

            { type: 'improve', text: 'Moved volume slider style setting from bottom to Behavior section for better organization' },

            { type: 'improve', text: 'Custom gradient button now properly integrates with accent color picker' },

            { type: 'improve', text: 'Floating player settings now include separate toggle for settings button visibility' }

          ]

        }

      ]

    },
    {
     version: 'v3.1.1',
  badge: 'update',
  date: '06.11.2025',
  categories: [
    {
      title: '🎨 Appearance & Customization',
      changes: [
        { type: 'new', text: 'Settings button now visible by default in floating player mode' },
        { type: 'new', text: 'Volume slider style customization - choose between accent color or transparent style' },
        { type: 'new', text: 'Expanded accent color palette with 8 new themes: Purple, Orange, Teal, Pink, Sunset, Ocean, Forest, and Neon' },
        { type: 'improve', text: 'Settings gear button properly positioned as rightmost element before volume control' },
        { type: 'new', text: 'Added new Appearance section in floating player settings panel' },
        { type: 'new', text: 'Custom Gradient Creator - interactive tool for creating personalized color gradients with live preview' }
      ]
    },
    {
      title: '🎵 Audio Visualization',
      changes: [
        { type: 'new', text: 'Station icon now pulses with accent color glow during playback' },
        { type: 'new', text: 'Smooth animation with expanding glow effect synchronized to playing state' },
        { type: 'improve', text: 'Enhanced visual feedback - icon scales slightly and displays colored shadow when audio is playing' }
      ]
    },
    {
      title: '🐛 Bug Fixes',
      changes: [
        { type: 'fix', text: 'Fixed Support button - now properly opens email client with support@deepradio.cloud' },
        { type: 'fix', text: 'Fixed Feedback button - uses support@deepradio.cloud with toast confirmation' },
        { type: 'fix', text: 'Fixed Create Playlist button - now creates playlists with proper storage and navigation update' },
        { type: 'fix', text: 'Fixed favorites ordering - newly added favorites now appear at position #1 (top of list)' },
        { type: 'fix', text: 'Fixed missing CSS custom properties - added --radius-xs and --preview-color variables' }
      ]
    },
    {
      title: '🌈 New Color Themes',
      changes: [
        { type: 'new', text: 'Purple: violet and purple shades for a royal look' },
        { type: 'new', text: 'Orange: warm orange gradient for energetic vibes' },
        { type: 'new', text: 'Teal: cyan-teal gradient for calm ocean feels' },
        { type: 'new', text: 'Pink: pink and rose shades for soft elegance' },
        { type: 'new', text: 'Sunset: orange to pink gradient for warm evenings' },
        { type: 'new', text: 'Ocean: blue to cyan gradient for deep waters' },
        { type: 'new', text: 'Forest: deep to bright green for nature lovers' },
        { type: 'new', text: 'Neon: bright cyberpunk colors (green/magenta/cyan) for futuristic style' }
      ]
    },
    {
      title: '🛠️ Gradient Creator Features',
      changes: [
        { type: 'new', text: 'Interactive color picker with 3 accent colors (accent1, accent2, accent3)' },
        { type: 'new', text: 'Live gradient preview with smooth animations' },
        { type: 'new', text: '6 built-in preset gradients for quick selection' },
        { type: 'new', text: 'Color input sync between picker and hex text fields' },
        { type: 'new', text: 'Custom gradients persist across sessions via localStorage' },
        { type: 'new', text: 'One-click apply to update entire app theme instantly' },
        { type: 'new', text: 'Beautiful modal design with blur backdrop and smooth transitions' }
      ]
    }
  ]
},
       {

      version: 'v3.0.2',
      badge: 'majorRelease',
      date: '05.11.2025',
      categories: [
        {
          title: '🏝️ Powerful Floating Player System',
          changes: [
            { type: 'new', text: 'Created dedicated floating-player-panel.js component with comprehensive customization options' },
            { type: 'new', text: 'Added toggle to enable/disable floating mode independently from player styles' },
            { type: 'new', text: 'Implemented opt-in dragging system to reduce resource consumption (no longer always active!)' },
            { type: 'new', text: 'Added 9 position presets: top-left, top, top-right, left, center, right, bottom-left, bottom, bottom-right' },
            { type: 'new', text: 'Element visibility controls: toggle icon, station name, track info, volume, play button, step buttons' },
            { type: 'new', text: 'Marquee/scrolling text option for long track names' },
            { type: 'fix', text: 'Fixed "chin" spacing issue - bottom padding now removed when floating mode is active' },
            { type: 'improve', text: 'Removed "island" style from player styles dropdown - now accessed via dedicated panel' }
          ]
        },

        {
          title: '⚡ Performance Optimizations',
          changes: [
            { type: 'improve', text: 'Drag event listeners only attach when dragging is explicitly enabled' },
            { type: 'new', text: 'Added setupDragListeners() and removeDragListeners() methods for proper cleanup' },
            { type: 'improve', text: 'Settings applied on-demand rather than continuously checking' },
            { type: 'improve', text: 'Optimized floating-player-manager.js to support conditional feature activation' }
          ]
        },
        {
          title: '🐛 Critical Bug Fixes',
          changes: [
            { type: 'fix', text: 'Bug #1: Fixed station-grid.js "Ничего не найдено" - now uses i18n translation' },
            { type: 'fix', text: 'Bug #2: Fixed main.js display mode cycling - "Вид: Обложки" now translates correctly' },
            { type: 'fix', text: 'Bug #3: Added missing changelog versions (v2.0.2, v2.0.1, v2.0.0, v1.0.0) with full translations' },
            { type: 'fix', text: 'Bug #4: Fixed stats functionality - now properly records listening sessions, tracks, and genres' },
            { type: 'fix', text: 'Bug #5: Verified player-bar.js translations - all messages already using i18n correctly' },
            { type: 'fix', text: 'Bug #6: Fixed stats recording - added tracks[], genres[], time, and timestamp fields' }
          ]
        },
        {
          title: '🌍 i18n Enhancements',
          changes: [
            { type: 'new', text: 'Added complete translations for floating player in Russian, English, and Ukrainian' },
            { type: 'new', text: 'Added display.viewPrefix and display.viewModes section to i18n.js' },
            { type: 'new', text: 'Added messages.changeFiltersOrSearch translation key' },
            { type: 'new', text: 'Added floatingPlayer.* translations for all settings panel elements' },
            { type: 'fix', text: 'Fixed i18n loading timing in floating-player-panel.js with setTimeout' }
          ]
        },
        {
          title: '📊 Statistics System Improvements',
          changes: [
            { type: 'new', text: 'Added tracks array to session data - now records all played songs with timestamps' },
            { type: 'new', text: 'Added genres recording to session data from station tags' },
            { type: 'new', text: 'Added time and timestamp fields to session objects' },
            { type: 'improve', text: 'Enhanced endListeningSession() to aggregate genre statistics' },
            { type: 'improve', text: 'Stats now track both individual tracks and overall genre listening time' }
          ]
        },
        {
          title: '🗑️ Code Cleanup',
          changes: [
            { type: 'fix', text: 'Removed unused header-manager.js component' },
            { type: 'fix', text: 'Cleaned up header-manager imports from main.js' },
            { type: 'improve', text: 'Removed obsolete this.headerManager variable from constructor' }
          ]
        },
        {
          title: '🎨 UI/UX Improvements',
          changes: [
            { type: 'new', text: 'Added "Configure" button in settings panel for floating player' },
            { type: 'new', text: 'Beautiful floating player panel with smooth animations and modern design' },
            { type: 'improve', text: 'Settings panel now organized with dedicated floating player section' },
            { type: 'improve', text: 'Real-time settings preview and application' },
            { type: 'improve', text: 'All floating player settings persist in localStorage' }
          ]
        },
        {
          title: '🔧 Technical Architecture',
          changes: [
            { type: 'new', text: 'Created floating-player-panel.js with Shadow DOM architecture' },
            { type: 'new', text: 'Added floating-player-change custom event for settings synchronization' },
            { type: 'new', text: 'Implemented data-show-* attributes system for element visibility control' },
            { type: 'improve', text: 'Enhanced floating-player-manager.js with settings-driven behavior' },
            { type: 'improve', text: 'Added proper cleanup in disableFloating() method' }
          ]
        }
      ]
    },
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
            { type: 'new', text: 'Added language selector to changelog panel (EN/RU/UK/IT buttons)' },
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
            { type: 'new', text: 'Complete translation system for English, Russian, Ukrainian, and Italian languages' },
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
    },
    {
      version: 'v2.0.2',
      badge: 'critical',
      date: '02.11.2025',
      categories: [
        {
          title: '🚨 Critical Mobile Fixes',
          changes: [
            { type: 'fix', text: 'Fixed critical issue with sidebar overlapping content on mobile devices' },
            { type: 'fix', text: 'Properly configured content padding from fixed header and player on mobile' },
            { type: 'improve', text: 'Optimized z-index layers for correct UI element stacking' },
            { type: 'fix', text: 'Fixed syntax in header-manager.js (template literal)' },
            { type: 'improve', text: 'Unified sidebar styles for mobile and desktop versions' }
          ]
        },
        {
          title: '📱 Mobile Improvements',
          changes: [
            { type: 'new', text: 'Content now properly positioned under header and above player' },
            { type: 'new', text: 'Sidebar no longer overlaps main content' },
            { type: 'improve', text: 'Improved content scrolling on mobile devices' }
          ]
        },
        {
          title: '🎨 CSS Optimization',
          changes: [
            { type: 'improve', text: 'Removed duplicate CSS selectors for sidebar' },
            { type: 'improve', text: 'Properly configured media queries for different resolutions' },
            { type: 'new', text: 'Added CSS variables for correct height calculations on mobile' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.1',
      badge: 'fix',
      date: '02.11.2025',
      categories: [
        {
          title: '🔧 Architecture Fixes',
          changes: [
            { type: 'fix', text: 'Eliminated duplicate mobile search functionality between header-search.js and mobile-search.js' },
            { type: 'improve', text: 'header-search.js now handles desktop search only' },
            { type: 'improve', text: 'mobile-search.js fully responsible for mobile search and animation' }
          ]
        },
        {
          title: '✨ Code Improvements',
          changes: [
            { type: 'improve', text: 'Improved animation state handling in mobile-search.js' },
            { type: 'improve', text: 'Added protection against double animation calls' },
            { type: 'improve', text: 'Optimized core.css, removed duplicate rules' }
          ]
        },
        {
          title: '📦 Component Structure',
          changes: [
            { type: 'new', text: 'Complete component analysis performed, no unnecessary files found' },
            { type: 'new', text: 'All 14 components working within their responsibilities' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.0',
      badge: 'critical',
      date: '02.11.2025',
      categories: [
        {
          title: '✅ Metadata and Track Display',
          changes: [
            { type: 'fix', text: 'Fixed display of song names and artists' },
            { type: 'improve', text: 'Improved metadata synchronization between store and player-bar' },
            { type: 'new', text: 'Added forced track-update emission on state changes' }
          ]
        }
      ]
    },
    {
      version: 'v1.0.0',
      badge: 'firstRelease',
      date: '18.07.2025',
      categories: [
        {
          title: '🎉 First  Release',
          changes: [
            { type: 'new', text: 'Updated station grid' },
            { type: 'new', text: 'Favorites, Recent, and Playlists' },
            { type: 'new', text: 'Player Bar with controls and visualization' },
            { type: 'new', text: 'Episodes modal window' }
          ]
        }
      ]
    }
  ],
  ru: [
       {
  version: 'v3.1.3',
  badge: 'Исправления ошибок',
  date: '12.11.2025',

  categories: [
    {
      title: '🐛 Критические исправления ошибок',
      changes: [
        { type: 'fix', text: 'Исправлен индекс избранных станций — теперь добавляет в начало списка (индекс 1) вместо конца' },
        { type: 'fix', text: 'Исправлены границы плавающего плеера — теперь он остаётся в пределах окна с отступом 20px' },
        { type: 'fix', text: 'Исправлено переключение режима перетаскивания — плеер больше не прыгает при включении/выключении' },
        { type: 'fix', text: 'Исправлен стандартный макет заголовка — логотип теперь действительно по центру' },
        { type: 'fix', text: 'Исправлены кнопки акцентных цветов — теперь они переносятся и остаются в пределах формы' },
        { type: 'fix', text: 'Добавлено блокирование кнопки Configure с предупреждением, если режим островка не активен' }
      ]
    },
    {
      title: '🎨 Улучшения UI/UX',
      changes: [
        { type: 'new', text: 'Добавлено 5 тем заголовка: glass, neon, dark, minimal (плюс существующие light/oled)' },
        { type: 'new', text: 'Темы заголовка теперь адаптируются к цветам формы (белая, неон дарк, чёрная, стекло)' },
        { type: 'improve', text: 'Улучшена мобильная адаптивность плавающего плеера (макс ширина 90vw)' },
        { type: 'improve', text: 'Улучшена логика позиционирования плавающего плеера для предотвращения выхода за экран' }
      ]
    },
    {
      title: '🌍 Обновление переводов',
      changes: [
        { type: 'new', text: 'Добавлен перевод сообщения islandModeRequired (UA/EN)' },
        { type: 'improve', text: 'Обновлены все строки интерфейса для лучшей согласованности' }
      ]
    },
    {
      title: '🔧 Технические улучшения',
      changes: [
        { type: 'improve', text: 'Рефакторинг enableFloating() для использования restorePosition() вместо фиксированных координат' },
        { type: 'improve', text: 'Улучшено updatePosition() с ограничениями отступов' },
        { type: 'improve', text: 'Улучшено handleResize() для удержания плеера в пределах при изменении размера окна' },
        { type: 'new', text: 'Добавлен flex-wrap для контейнера accent-colors для лучшего макета' }
      ]
    }
  ]
},

      {
  version: 'v3.1.2',
  badge: 'fix',
  date: '06.11.2025',
  categories: [
    {
      title: '🐛 Исправления ошибок',
      changes: [
        { type: 'fix', text: 'Исправлены переводы i18n для настроек внешнего вида плавающего плеера' },
        { type: 'fix', text: 'Исправлено сбрасывание позиции плавающего плеера — теперь он всегда появляется внизу по центру после перезагрузки страницы' },
        { type: 'fix', text: 'Исправлено переключение визуализации эквалайзера — теперь анимация корректно включается и выключается во время воспроизведения' },
        { type: 'fix', text: 'Исправлено поведение визуализации обложки — эффект пульсации иконки станции теперь учитывает настройки переключателя' },
        { type: 'fix', text: 'Исправлена ошибка переключения акцентных цветов — теперь можно менять цвета после применения пользовательского градиента' },
        { type: 'fix', text: 'Исправлен порядок отображения избранных — новые станции теперь появляются первыми в списке' }
      ]
    },
    {
      title: '✨ Новые функции',
      changes: [
        { type: 'new', text: 'Добавлено переключение видимости кнопки настроек — теперь можно скрыть или показать кнопку настроек в плавающем плеере' },
        { type: 'new', text: 'Пользовательский градиент теперь сохраняется как вариант акцентного цвета с иконкой ✨' },
        { type: 'new', text: 'Добавлена визуализация эквалайзера — 4 анимированные полосы, пульсирующие во время воспроизведения' }
      ]
    },
    {
      title: '🎨 Улучшения интерфейса',
      changes: [
        { type: 'improve', text: 'Настройка стиля ползунка громкости перемещена в раздел "Поведение" для лучшей структуры' },
        { type: 'improve', text: 'Кнопка пользовательского градиента теперь корректно интегрируется с выбором акцентного цвета' },
        { type: 'improve', text: 'В настройки плавающего плеера добавлен отдельный переключатель для кнопки настроек' }
      ]
    }
  ]
},

     {
  version: 'v3.1.1',
  badge: 'обновление',
  date: '06.11.2025',
  categories: [
    {
      title: '🎨 Внешний вид и кастомизация',
      changes: [
        { type: 'new', text: 'Кнопка настроек теперь отображается по умолчанию в режиме плавающего плеера' },
        { type: 'new', text: 'Настройка стиля ползунка громкости — выбор между акцентным цветом и прозрачным стилем' },
        { type: 'new', text: 'Расширена палитра акцентных цветов — добавлено 8 новых тем: Фиолетовая, Оранжевая, Бирюзовая, Розовая, Закат, Океан, Лес и Неон' },
        { type: 'improve', text: 'Кнопка шестерёнки теперь корректно позиционирована справа перед регулятором громкости' },
        { type: 'new', text: 'Добавлен новый раздел “Внешний вид” в панели настроек плавающего плеера' },
        { type: 'new', text: 'Создан инструмент “Генератор градиентов” — интерактивный редактор с живым предпросмотром пользовательских цветов' }
      ]
    },
    {
      title: '🎵 Аудиовизуализация',
      changes: [
        { type: 'new', text: 'Иконка станции теперь пульсирует акцентным свечением во время воспроизведения' },
        { type: 'new', text: 'Добавлена плавная анимация расширяющегося свечения, синхронизированная с проигрыванием' },
        { type: 'improve', text: 'Улучшена визуальная обратная связь — иконка немного увеличивается и отображает цветную тень при воспроизведении' }
      ]
    },
    {
      title: '🐛 Исправления ошибок',
      changes: [
        { type: 'fix', text: 'Исправлена кнопка “Поддержка” — теперь корректно открывает почтовый клиент с адресом support@deepradio.cloud' },
        { type: 'fix', text: 'Исправлена кнопка “Обратная связь” — теперь использует support@deepradio.cloud и отображает уведомление' },
        { type: 'fix', text: 'Исправлена кнопка “Создать плейлист” — теперь создаёт плейлисты с правильным сохранением и обновлением навигации' },
        { type: 'fix', text: 'Исправлен порядок избранного — новые станции теперь появляются первыми' },
        { type: 'fix', text: 'Добавлены отсутствующие CSS-переменные --radius-xs и --preview-color' }
      ]
    },
    {
      title: '🌈 Новые цветовые темы',
      changes: [
        { type: 'new', text: 'Фиолетовая: оттенки фиолетового для королевского стиля' },
        { type: 'new', text: 'Оранжевая: тёплый градиент для энергичного настроения' },
        { type: 'new', text: 'Бирюзовая: спокойные морские оттенки' },
        { type: 'new', text: 'Розовая: мягкие розовые тона для нежного дизайна' },
        { type: 'new', text: 'Закат: градиент от оранжевого к розовому для тёплого вечернего настроения' },
        { type: 'new', text: 'Океан: от синего к голубому — вдохновлено глубиной моря' },
        { type: 'new', text: 'Лес: насыщенные зелёные оттенки для любителей природы' },
        { type: 'new', text: 'Неон: яркие неоновые цвета — зелёный, пурпурный и голубой — для футуристического стиля' }
      ]
    },
    {
      title: '🛠️ Возможности генератора градиентов',
      changes: [
        { type: 'new', text: 'Интерактивный выбор трёх акцентных цветов (accent1, accent2, accent3)' },
        { type: 'new', text: 'Живой предпросмотр градиента с плавной анимацией' },
        { type: 'new', text: '6 встроенных пресетов градиентов для быстрого выбора' },
        { type: 'new', text: 'Синхронизация между полем ввода цвета и текстовым HEX-полем' },
        { type: 'new', text: 'Пользовательские градиенты сохраняются между сессиями через localStorage' },
        { type: 'new', text: 'Мгновенное применение темы по нажатию одной кнопки' },
        { type: 'new', text: 'Современный модальный дизайн с размытым фоном и плавными переходами' }
      ]
    }
  ]
},

      {
  version: 'v3.1.0',
  badge: 'stable',
  date: '06.11.2025',
  categories: [
    {
      title: '🎉 Первый стабильный релиз',
      changes: [
        { type: 'new', text: 'Представлена первая стабильная версия — все критические ошибки исправлены, известные баги устранены' },
        { type: 'improve', text: 'Полностью переработан интерфейс и логика плавающего плеера' }
      ]
    },
    {
      title: '🏝️ Улучшения островного плеера',
      changes: [
        { type: 'fix', text: 'Исправлен курсор на плавающем плеере — теперь “перетаскивание” только на пустых областях, а на кнопках показывается указатель' },
        { type: 'fix', text: 'Удалена кнопка “Применить изменения” — все настройки теперь применяются мгновенно' },
        { type: 'new', text: 'Добавлена система уведомлений (toast) с защитой от дубликатов и счётчиком ×2, ×3' },
        { type: 'fix', text: 'Исправлен бегущий текст (marquee) — теперь корректно реагирует на включение/выключение' },
        { type: 'fix', text: 'Исправлены кнопки позиционирования — теперь срабатывают сразу без подтверждения' },
        { type: 'new', text: 'Добавлена иконка ⚙️ настроек прямо в плавающий плеер для быстрого доступа' },
        { type: 'new', text: 'Добавлен интерактивный тур при первом открытии настроек — подсвечиваются разделы “Стиль плеера” и “Плавающий плеер”' }
      ]
    },
    {
      title: '⚙️ Настройки и иконки',
      changes: [
        { type: 'improve', text: 'Иконка настроек заменена на понятную шестерёнку для лучшего UX' },
        { type: 'new', text: 'Кнопка настроек в плавающем плеере теперь открывает отдельную панель' },
        { type: 'new', text: 'Добавлен интерактивный учебник при первом открытии настроек — плавный скролл и подсветка нужных секций' }
      ]
    },
    {
      title: '🎨 Визуальная кастомизация',
      changes: [
        { type: 'new', text: 'Добавлены варианты тем для плавающего плеера (стеклянная, сплошная, градиентная)' },
        { type: 'new', text: 'Добавлена настройка цвета текста для лучшей читаемости' },
        { type: 'new', text: 'Добавлены параметры толщины и размера шрифта в разумных пределах' },
        { type: 'new', text: 'Добавлена регулировка прозрачности/непрозрачности фона плавающего плеера' }
      ]
    },
    {
      title: '🎵 Исправления визуализаторов',
      changes: [
        { type: 'fix', text: 'Исправлена визуализация эквалайзера в панели плеера — теперь анимация работает корректно во время воспроизведения' },
        { type: 'fix', text: 'Исправлена визуализация поверх иконки станции — теперь эффект корректно активируется и синхронизируется со звуком' }
      ]
    },
    {
      title: '💖 Избранное и плейлисты',
      changes: [
        { type: 'fix', text: 'Исправлен порядок избранных — новые станции теперь появляются первыми (#1)' },
        { type: 'fix', text: 'Во вкладке “Избранное” теперь отображаются только добавленные станции в порядке добавления' },
        { type: 'fix', text: 'Исправлена кнопка “Создать плейлист” в бургер-меню' }
      ]
    },
    {
      title: '🔗 Поддержка и обратная связь',
      changes: [
        { type: 'fix', text: 'Исправлена кнопка “Поддержка” — теперь открывает письмо на support@deepradio.cloud' },
        { type: 'new', text: 'Добавлено уведомление “Спасибо за поддержку!” при нажатии' },
        { type: 'fix', text: 'Исправлена кнопка обратной связи — теперь также использует адрес support@deepradio.cloud' }
      ]
    }
  ]
},

      {
  version: 'v3.0.2',
  badge: 'главное обновление',
  date: '05.11.2025',
  categories: [
    {
      title: '🏝️ Мощная система плавающего плеера',
      changes: [
        { type: 'new', text: 'Создан отдельный компонент floating-player-panel.js с полной системой кастомизации' },
        { type: 'new', text: 'Добавлен переключатель включения/выключения плавающего режима независимо от стиля плеера' },
        { type: 'new', text: 'Реализована система перетаскивания по запросу — не активна постоянно для экономии ресурсов' },
        { type: 'new', text: 'Добавлены 9 предустановленных позиций: сверху-слева, сверху, сверху-справа, слева, по центру, справа, снизу-слева, снизу, снизу-справа' },
        { type: 'new', text: 'Контроль видимости элементов: иконка, название станции, трек, громкость, кнопки воспроизведения и переключения' },
        { type: 'new', text: 'Добавлен режим прокрутки (marquee) для длинных названий треков' },
        { type: 'fix', text: 'Исправлен отступ внизу (“подбородок”) при активном плавающем режиме' },
        { type: 'improve', text: 'Стиль “остров” убран из списка — теперь доступен через отдельную панель' }
      ]
    },
    {
      title: '⚡ Оптимизация производительности',
      changes: [
        { type: 'improve', text: 'Слушатели событий перетаскивания активируются только при включённом режиме перетаскивания' },
        { type: 'new', text: 'Добавлены методы setupDragListeners() и removeDragListeners() для корректного удаления событий' },
        { type: 'improve', text: 'Настройки применяются по требованию, без постоянных проверок' },
        { type: 'improve', text: 'Оптимизирован floating-player-manager.js — теперь функции активируются условно' }
      ]
    },
    {
      title: '🐛 Критические исправления',
      changes: [
        { type: 'fix', text: 'Исправлено: station-grid.js — “Ничего не найдено” теперь использует i18n-перевод' },
        { type: 'fix', text: 'Исправлено: main.js — переключение вида “Вид: Обложки” теперь корректно переводится' },
        { type: 'fix', text: 'Добавлены недостающие версии changelog (v2.0.2, v2.0.1, v2.0.0, v1.0.0) с полными переводами' },
        { type: 'fix', text: 'Исправлена система статистики — теперь корректно записывает сессии, треки и жанры' },
        { type: 'fix', text: 'Проверены переводы player-bar.js — все строки корректно используют i18n' },
        { type: 'fix', text: 'Исправлена запись статистики — добавлены поля tracks[], genres[], time и timestamp' }
      ]
    },
    {
      title: '🌍 Улучшения переводов (i18n)',
      changes: [
        { type: 'new', text: 'Добавлены полные переводы плавающего плеера на русский, английский и украинский языки' },
        { type: 'new', text: 'Добавлены ключи display.viewPrefix и display.viewModes в i18n.js' },
        { type: 'new', text: 'Добавлен ключ перевода messages.changeFiltersOrSearch' },
        { type: 'new', text: 'Добавлены переводы floatingPlayer.* для всех элементов панели настроек' },
        { type: 'fix', text: 'Исправлен момент загрузки i18n в floating-player-panel.js (через setTimeout)' }
      ]
    },
    {
      title: '📊 Улучшения системы статистики',
      changes: [
        { type: 'new', text: 'Добавлен массив tracks в данные сессий — теперь сохраняются все треки с метками времени' },
        { type: 'new', text: 'Добавлена запись жанров из тегов станции' },
        { type: 'new', text: 'Добавлены поля времени и отметки времени (timestamp) в объекты сессий' },
        { type: 'improve', text: 'Функция endListeningSession() теперь агрегирует статистику по жанрам' },
        { type: 'improve', text: 'Статистика теперь отслеживает как отдельные треки, так и общее время по жанрам' }
      ]
    },
    {
      title: '🗑️ Очистка кода',
      changes: [
        { type: 'fix', text: 'Удалён неиспользуемый компонент header-manager.js' },
        { type: 'fix', text: 'Удалены импорты header-manager из main.js' },
        { type: 'improve', text: 'Удалена устаревшая переменная this.headerManager из конструктора' }
      ]
    },
    {
      title: '🎨 Улучшения интерфейса и UX',
      changes: [
        { type: 'new', text: 'Добавлена кнопка “Настроить” в панели настроек для плавающего плеера' },
        { type: 'new', text: 'Создана красивая панель плавающего плеера с плавными анимациями и современным дизайном' },
        { type: 'improve', text: 'Панель настроек теперь содержит отдельный раздел для плавающего плеера' },
        { type: 'improve', text: 'Реализовано применение настроек в реальном времени' },
        { type: 'improve', text: 'Все настройки плавающего плеера сохраняются в localStorage' }
      ]
    },
    {
      title: '🔧 Техническая архитектура',
      changes: [
        { type: 'new', text: 'Создан компонент floating-player-panel.js с архитектурой Shadow DOM' },
        { type: 'new', text: 'Добавлено событие floating-player-change для синхронизации настроек' },
        { type: 'new', text: 'Реализована система data-show-* атрибутов для управления видимостью элементов' },
        { type: 'improve', text: 'Улучшен floating-player-manager.js — теперь поведение зависит от настроек' },
        { type: 'improve', text: 'Добавлена корректная очистка в методе disableFloating()' }
      ]
    }
  ]
},

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
            { type: 'new', text: 'Добавлен селектор языка в панель changelog (кнопки EN/RU/UK/IT)' },
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
            { type: 'new', text: 'Полная система перевода для английского, русского, украинского и итальянского языков' },
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
    },
    {
      version: 'v2.0.2',
      badge: 'critical',
      date: '02.11.2025',
      categories: [
        {
          title: '🚨 Критические Исправления для Мобильных',
          changes: [
            { type: 'fix', text: 'Исправлена критическая проблема с наложением sidebar на контент на мобильных устройствах' },
            { type: 'fix', text: 'Правильно настроены отступы контента от фиксированного header и player на мобильных' },
            { type: 'improve', text: 'Оптимизированы слои z-index для правильной стековки UI элементов' },
            { type: 'fix', text: 'Исправлен синтаксис в header-manager.js (template literal)' },
            { type: 'improve', text: 'Унифицированы стили sidebar для мобильной и десктопной версий' }
          ]
        },
        {
          title: '📱 Улучшения для Мобильных',
          changes: [
            { type: 'new', text: 'Контент теперь правильно позиционируется под header и над player' },
            { type: 'new', text: 'Sidebar больше не перекрывает основной контент' },
            { type: 'improve', text: 'Улучшена прокрутка контента на мобильных устройствах' }
          ]
        },
        {
          title: '🎨 Оптимизация CSS',
          changes: [
            { type: 'improve', text: 'Удалены дублирующиеся CSS селекторы для sidebar' },
            { type: 'improve', text: 'Правильно настроены media queries для разных разрешений' },
            { type: 'new', text: 'Добавлены CSS переменные для правильных расчетов высоты на мобильных' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.1',
      badge: 'fix',
      date: '02.11.2025',
      categories: [
        {
          title: '🔧 Исправления Архитектуры',
          changes: [
            { type: 'fix', text: 'Устранена дублирующаяся функциональность мобильного поиска между header-search.js и mobile-search.js' },
            { type: 'improve', text: 'header-search.js теперь обрабатывает только десктопный поиск' },
            { type: 'improve', text: 'mobile-search.js полностью отвечает за мобильный поиск и анимацию' }
          ]
        },
        {
          title: '✨ Улучшения Кода',
          changes: [
            { type: 'improve', text: 'Улучшена обработка состояния анимации в mobile-search.js' },
            { type: 'improve', text: 'Добавлена защита от двойных вызовов анимации' },
            { type: 'improve', text: 'Оптимизирован core.css, удалены дублирующиеся правила' }
          ]
        },
        {
          title: '📦 Структура Компонентов',
          changes: [
            { type: 'new', text: 'Выполнен полный анализ компонентов, лишних файлов не обнаружено' },
            { type: 'new', text: 'Все 14 компонентов работают в рамках своих обязанностей' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.0',
      badge: 'critical',
      date: '02.11.2025',
      categories: [
        {
          title: '✅ Метаданные и Отображение Треков',
          changes: [
            { type: 'fix', text: 'Исправлено отображение названий песен и исполнителей' },
            { type: 'improve', text: 'Улучшена синхронизация метаданных между store и player-bar' },
            { type: 'new', text: 'Добавлена принудительная эмиссия track-update при изменении состояния' }
          ]
        }
      ]
    },
    {
      version: 'v1.0.0',
      badge: 'firstRelease',
      date: '18.07.2025',
      categories: [
        {
          title: '🎉 Первый Релиз',
          changes: [
            { type: 'new', text: 'Обновленная сетка станций' },
            { type: 'new', text: 'Избранное, Недавние и Плейлисты' },
            { type: 'new', text: 'Панель плеера с управлением и визуализацией' },
            { type: 'new', text: 'Модальное окно эпизодов' }
          ]
        }
      ]
    }
  ],
  uk: [
      {
  version: 'v3.1.3',
  badge: 'Виправлення помилок',
  date: '12.11.2025',

  categories: [
    {
      title: '🐛 Критичні виправлення помилок',
      changes: [
        { type: 'fix', text: 'Виправлено індекс обраних станцій — тепер додає на початок списку (індекс 1) замість кінця' },
        { type: 'fix', text: 'Виправлено межі плаваючого плеєра — тепер залишається в межах вікна з відступом 20px' },
        { type: 'fix', text: 'Виправлено перемикання режиму перетягування — плеєр більше не стрибає при увімкненні/вимкненні' },
        { type: 'fix', text: 'Виправлено стандартний макет заголовка — логотип тепер справді по центру' },
        { type: 'fix', text: 'Виправлено кнопки акцентних кольорів — тепер переносяться і залишаються в межах форми' },
        { type: 'fix', text: 'Додано блокування кнопки Configure з попередженням коли режим островка не активний' }
      ]
    },
    {
      title: '🎨 Покращення UI/UX',
      changes: [
        { type: 'new', text: 'Додано 5 тем заголовка: glass, neon, dark, minimal (плюс існуючі light/oled)' },
        { type: 'new', text: 'Теми заголовка тепер адаптуються до кольорів форми (біла, неон дарк, чорна, скло)' },
        { type: 'improve', text: 'Покращено мобільну адаптивність плаваючого плеєра (макс 90vw ширина)' },
        { type: 'improve', text: 'Покращено логіку позиціонування плаваючого плеєра для запобігання виходу за екран' }
      ]
    },
    {
      title: '🌍 Оновлення перекладів',
      changes: [
        { type: 'new', text: 'Додано переклад повідомлення islandModeRequired (UA/EN)' },
        { type: 'improve', text: 'Оновлено всі рядки інтерфейсу для кращої послідовності' }
      ]
    },
    {
      title: '🔧 Технічні покращення',
      changes: [
        { type: 'improve', text: 'Рефакторинг enableFloating() для використання restorePosition() замість фіксованих координат' },
        { type: 'improve', text: 'Покращено updatePosition() з обмеженнями відступів' },
        { type: 'improve', text: 'Покращено handleResize() для утримання плеєра в межах при зміні розміру вікна' },
        { type: 'new', text: 'Додано flex-wrap до контейнера accent-colors для кращого макета' }
      ]
    }
  ]
},
{
  version: 'v3.1.2',
  badge: 'fix',
  date: '06.11.2025',
  categories: [
    {
      title: '🐛 Виправлення помилок',
      changes: [
        { type: 'fix', text: 'Виправлено переклади i18n для налаштувань зовнішнього вигляду плаваючого плеєра' },
        { type: 'fix', text: 'Виправлено скидання позиції плаваючого плеєра — тепер він завжди з’являється знизу по центру після перезавантаження сторінки' },
        { type: 'fix', text: 'Виправлено перемикання візуалізації еквалайзера — тепер анімація коректно вмикається та вимикається під час відтворення' },
        { type: 'fix', text: 'Виправлено пульсацію іконки станції — тепер ефект реагує на стан перемикача' },
        { type: 'fix', text: 'Виправлено зміну акцентних кольорів — тепер можна обирати нові кольори після застосування власного градієнта' },
        { type: 'fix', text: 'Виправлено порядок відображення улюблених станцій — нові станції тепер зверху списку' }
      ]
    },
    {
      title: '✨ Нові функції',
      changes: [
        { type: 'new', text: 'Додано перемикач видимості кнопки налаштувань — тепер можна приховувати або показувати її у плаваючому плеєрі' },
        { type: 'new', text: 'Власний градієнт тепер зберігається як варіант акцентного кольору з іконкою ✨' },
        { type: 'new', text: 'Додано візуалізацію еквалайзера — 4 анімовані смуги, що пульсують під час відтворення' }
      ]
    },
    {
      title: '🎨 Покращення інтерфейсу',
      changes: [
        { type: 'improve', text: 'Налаштування стилю повзунка гучності перенесено в розділ "Поведінка" для кращої логіки' },
        { type: 'improve', text: 'Кнопка власного градієнта тепер повністю сумісна з вибором акцентного кольору' },
        { type: 'improve', text: 'У налаштування плаваючого плеєра додано окремий перемикач видимості кнопки налаштувань' }
      ]
    }
  ]
},

      {
  version: 'v3.1.1',
  badge: 'оновлення',
  date: '06.11.2025',
  categories: [
    {
      title: '🎨 Зовнішній вигляд та налаштування',
      changes: [
        { type: 'new', text: 'Кнопка налаштувань тепер відображається за замовчуванням у плаваючому плеєрі' },
        { type: 'new', text: 'Можливість змінювати стиль повзунка гучності — акцентний або прозорий' },
        { type: 'new', text: 'Розширено палітру акцентних кольорів — додано 8 нових тем: Фіолетова, Помаранчева, Бірюзова, Рожева, Захід, Океан, Ліс і Неон' },
        { type: 'improve', text: 'Кнопка шестерні тепер правильно розташована перед регулятором гучності' },
        { type: 'new', text: 'Додано розділ “Зовнішній вигляд” у налаштуваннях плаваючого плеєра' },
        { type: 'new', text: 'Додано “Генератор градієнтів” — інтерактивний інструмент для створення власних кольорових схем із живим переглядом' }
      ]
    },
    {
      title: '🎵 Аудіовізуалізація',
      changes: [
        { type: 'new', text: 'Іконка станції тепер пульсує акцентним сяйвом під час відтворення' },
        { type: 'new', text: 'Плавна анімація розширення сяйва, синхронізована з програванням' },
        { type: 'improve', text: 'Покращено візуальний відгук — іконка злегка збільшується та має кольорову тінь під час відтворення' }
      ]
    },
    {
      title: '🐛 Виправлення помилок',
      changes: [
        { type: 'fix', text: 'Виправлено кнопку “Підтримка” — тепер відкриває поштовий клієнт з адресою support@deepradio.cloud' },
        { type: 'fix', text: 'Виправлено кнопку “Зворотний зв’язок” — тепер використовує support@deepradio.cloud і показує сповіщення' },
        { type: 'fix', text: 'Виправлено кнопку “Створити плейлист” — тепер плейлисти створюються правильно з оновленням списку' },
        { type: 'fix', text: 'Виправлено порядок улюблених — нові станції тепер відображаються першими' },
        { type: 'fix', text: 'Додано відсутні змінні CSS: --radius-xs та --preview-color' }
      ]
    },
    {
      title: '🌈 Нові кольорові теми',
      changes: [
        { type: 'new', text: 'Фіолетова: благородні відтінки фіолетового' },
        { type: 'new', text: 'Помаранчева: теплий градієнт для енергії' },
        { type: 'new', text: 'Бірюзова: відтінки моря для спокою' },
        { type: 'new', text: 'Рожева: ніжні рожеві кольори для гармонії' },
        { type: 'new', text: 'Захід: перехід від помаранчевого до рожевого' },
        { type: 'new', text: 'Океан: сині та бірюзові тони для глибини' },
        { type: 'new', text: 'Ліс: насичені зелені відтінки природи' },
        { type: 'new', text: 'Неон: яскраві неонові кольори — зелений, пурпуровий, блакитний' }
      ]
    },
    {
      title: '🛠️ Можливості генератора градієнтів',
      changes: [
        { type: 'new', text: 'Інтерактивний вибір трьох акцентних кольорів (accent1, accent2, accent3)' },
        { type: 'new', text: 'Живий перегляд градієнтів із плавними анімаціями' },
        { type: 'new', text: '6 вбудованих пресетів для швидкого вибору' },
        { type: 'new', text: 'Синхронізація між піпеткою та текстовими HEX-полями' },
        { type: 'new', text: 'Збереження власних градієнтів через localStorage' },
        { type: 'new', text: 'Миттєве застосування теми одним натисканням' },
        { type: 'new', text: 'Сучасний модальний дизайн з розмитим фоном і плавними переходами' }
      ]
    }
  ]
},

      {
  version: 'v3.1.0',
  badge: 'stable',
  date: '06.11.2025',
  categories: [
    {
      title: '🎉 Перший стабільний реліз',
      changes: [
        { type: 'new', text: 'Представлено першу стабільну версію — усі критичні помилки виправлено, відомі баги усунено' },
        { type: 'improve', text: 'Повністю оновлено інтерфейс і логіку плаваючого плеєра' }
      ]
    },
    {
      title: '🏝️ Покращення островного плеєра',
      changes: [
        { type: 'fix', text: 'Виправлено курсор у плаваючому плеєрі — тепер “перетягування” працює лише на порожніх ділянках, а на кнопках показується вказівник' },
        { type: 'fix', text: 'Видалено кнопку “Застосувати зміни” — усі налаштування тепер застосовуються миттєво' },
        { type: 'new', text: 'Додано систему сповіщень (toast) із захистом від дублікатів і лічильником ×2, ×3' },
        { type: 'fix', text: 'Виправлено бігучий текст (marquee) — тепер правильно реагує на перемикач увімкнення/вимкнення' },
        { type: 'fix', text: 'Виправлено кнопки позиціювання — тепер спрацьовують одразу без підтвердження' },
        { type: 'new', text: 'Додано іконку ⚙️ налаштувань безпосередньо у плаваючий плеєр для швидкого доступу' },
        { type: 'new', text: 'Додано інтерактивний тур при першому відкритті налаштувань — підсвічуються розділи “Стиль плеєра” та “Плаваючий плеєр”' }
      ]
    },
    {
      title: '⚙️ Налаштування та іконки',
      changes: [
        { type: 'improve', text: 'Іконку налаштувань замінено на зрозумілу шестерню для кращого UX' },
        { type: 'new', text: 'Кнопка налаштувань у плаваючому плеєрі тепер відкриває окрему панель' },
        { type: 'new', text: 'Додано інтерактивний навчальний режим при першому вході в налаштування — плавне прокручування та підсвітка потрібних секцій' }
      ]
    },
    {
      title: '🎨 Візуальна кастомізація',
      changes: [
        { type: 'new', text: 'Додано варіанти тем для плаваючого плеєра (скляна, суцільна, градієнтна)' },
        { type: 'new', text: 'Додано налаштування кольору тексту для кращої читабельності' },
        { type: 'new', text: 'Додано параметри товщини та розміру шрифту в розумних межах' },
        { type: 'new', text: 'Додано регулювання прозорості/непрозорості фону плаваючого плеєра' }
      ]
    },
    {
      title: '🎵 Виправлення візуалізаторів',
      changes: [
        { type: 'fix', text: 'Виправлено візуалізацію еквалайзера в панелі плеєра — тепер анімація працює коректно під час відтворення' },
        { type: 'fix', text: 'Виправлено візуалізацію поверх іконки станції — тепер ефект правильно активується та синхронізується зі звуком' }
      ]
    },
    {
      title: '💖 Улюблене та плейлисти',
      changes: [
        { type: 'fix', text: 'Виправлено порядок улюблених — нові станції тепер з’являються першими (#1)' },
        { type: 'fix', text: 'У вкладці “Улюблене” тепер показуються лише додані станції у порядку додавання' },
        { type: 'fix', text: 'Виправлено кнопку “Створити плейлист” у бургер-меню' }
      ]
    },
    {
      title: '🔗 Підтримка та зворотний зв’язок',
      changes: [
        { type: 'fix', text: 'Виправлено кнопку “Підтримка” — тепер відкриває лист на support@deepradio.cloud' },
        { type: 'new', text: 'Додано сповіщення “Дякуємо за підтримку!” після натискання' },
        { type: 'fix', text: 'Виправлено кнопку зворотного зв’язку — тепер також використовує адресу support@deepradio.cloud' }
      ]
    }
  ]
},

      {
  version: 'v3.0.2',
  badge: 'головне оновлення',
  date: '05.11.2025',
  categories: [
    {
      title: '🏝️ Потужна система плаваючого плеєра',
      changes: [
        { type: 'new', text: 'Створено окремий компонент floating-player-panel.js із повною системою налаштувань' },
        { type: 'new', text: 'Додано перемикач увімкнення/вимкнення плаваючого режиму незалежно від стилю плеєра' },
        { type: 'new', text: 'Реалізовано систему перетягування за запитом — не активна постійно для економії ресурсів' },
        { type: 'new', text: 'Додано 9 позицій: зверху-зліва, зверху, зверху-справа, зліва, по центру, справа, знизу-зліва, знизу, знизу-справа' },
        { type: 'new', text: 'Контроль видимості елементів: іконка, назва станції, трек, гучність, кнопки відтворення та перемикання' },
        { type: 'new', text: 'Додано режим прокрутки (marquee) для довгих назв треків' },
        { type: 'fix', text: 'Виправлено нижній відступ (“підборіддя”) у плаваючому режимі' },
        { type: 'improve', text: 'Стиль “острів” видалено зі списку — тепер доступний через окрему панель' }
      ]
    },
    {
      title: '⚡ Оптимізація продуктивності',
      changes: [
        { type: 'improve', text: 'Слухачі подій перетягування активуються лише коли режим увімкнено' },
        { type: 'new', text: 'Додано методи setupDragListeners() і removeDragListeners() для коректного очищення подій' },
        { type: 'improve', text: 'Налаштування застосовуються за потреби, без постійних перевірок' },
        { type: 'improve', text: 'Оптимізовано floating-player-manager.js — функції активуються умовно' }
      ]
    },
    {
      title: '🐛 Критичні виправлення',
      changes: [
        { type: 'fix', text: 'Виправлено station-grid.js — “Нічого не знайдено” тепер перекладається через i18n' },
        { type: 'fix', text: 'Виправлено main.js — перемикання виду “Вид: Обкладинки” тепер перекладається правильно' },
        { type: 'fix', text: 'Додано відсутні версії changelog (v2.0.2, v2.0.1, v2.0.0, v1.0.0) з перекладами' },
        { type: 'fix', text: 'Виправлено роботу статистики — тепер правильно записує сесії, треки та жанри' },
        { type: 'fix', text: 'Перевірено переклади player-bar.js — усі рядки використовують i18n' },
        { type: 'fix', text: 'Виправлено запис статистики — додано поля tracks[], genres[], time і timestamp' }
      ]
    },
    {
      title: '🌍 Покращення перекладів (i18n)',
      changes: [
        { type: 'new', text: 'Додано повні переклади плаваючого плеєра українською, англійською та російською' },
        { type: 'new', text: 'Додано ключі display.viewPrefix і display.viewModes до i18n.js' },
        { type: 'new', text: 'Додано ключ messages.changeFiltersOrSearch' },
        { type: 'new', text: 'Додано переклади floatingPlayer.* для всіх елементів панелі налаштувань' },
        { type: 'fix', text: 'Виправлено момент завантаження i18n у floating-player-panel.js (через setTimeout)' }
      ]
    },
    {
      title: '📊 Покращення системи статистики',
      changes: [
        { type: 'new', text: 'Додано масив tracks — тепер зберігаються всі треки з часовими мітками' },
        { type: 'new', text: 'Додано запис жанрів зі станційних тегів' },
        { type: 'new', text: 'Додано поля часу та timestamp до об’єктів сесій' },
        { type: 'improve', text: 'Функція endListeningSession() тепер агрегує статистику за жанрами' },
        { type: 'improve', text: 'Статистика тепер відстежує як окремі треки, так і загальний час за жанрами' }
      ]
    },
    {
      title: '🗑️ Очищення коду',
      changes: [
        { type: 'fix', text: 'Видалено невикористаний компонент header-manager.js' },
        { type: 'fix', text: 'Видалено імпорти header-manager з main.js' },
        { type: 'improve', text: 'Видалено застарілу змінну this.headerManager з конструктора' }
      ]
    },
    {
      title: '🎨 Поліпшення інтерфейсу та UX',
      changes: [
        { type: 'new', text: 'Додано кнопку “Налаштувати” у панелі налаштувань плаваючого плеєра' },
        { type: 'new', text: 'Створено красиву панель плаваючого плеєра з плавними анімаціями та сучасним дизайном' },
        { type: 'improve', text: 'Панель налаштувань тепер має окремий розділ для плаваючого плеєра' },
        { type: 'improve', text: 'Реалізовано застосування налаштувань у реальному часі' },
        { type: 'improve', text: 'Усі налаштування плаваючого плеєра зберігаються в localStorage' }
      ]
    },
    {
      title: '🔧 Технічна архітектура',
      changes: [
        { type: 'new', text: 'Створено компонент floating-player-panel.js із архітектурою Shadow DOM' },
        { type: 'new', text: 'Додано подію floating-player-change для синхронізації налаштувань' },
        { type: 'new', text: 'Реалізовано систему data-show-* атрибутів для контролю видимості елементів' },
        { type: 'improve', text: 'Поліпшено floating-player-manager.js — тепер поведінка залежить від налаштувань' },
        { type: 'improve', text: 'Додано коректне очищення у методі disableFloating()' }
      ]
    }
  ]
},
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
            { type: 'new', text: 'Додано селектор мови до панелі changelog (кнопки EN/RU/UK/IT)' },
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
            { type: 'new', text: 'Повна система перекладу для англійської, російської, української та італійської мов' },
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
    },
    {
      version: 'v2.0.2',
      badge: 'critical',
      date: '02.11.2025',
      categories: [
        {
          title: '🚨 Критичні Виправлення для Мобільних',
          changes: [
            { type: 'fix', text: 'Виправлено критичну проблему з накладенням sidebar на контент на мобільних пристроях' },
            { type: 'fix', text: 'Правильно налаштовано відступи контенту від фіксованого header та player на мобільних' },
            { type: 'improve', text: 'Оптимізовано шари z-index для правильного стекування UI елементів' },
            { type: 'fix', text: 'Виправлено синтаксис в header-manager.js (template literal)' },
            { type: 'improve', text: 'Уніфіковано стилі sidebar для мобільної та десктопної версій' }
          ]
        },
        {
          title: '📱 Покращення для Мобільних',
          changes: [
            { type: 'new', text: 'Контент тепер правильно позиціонується під header і над player' },
            { type: 'new', text: 'Sidebar більше не перекриває основний контент' },
            { type: 'improve', text: 'Покращено прокрутку контенту на мобільних пристроях' }
          ]
        },
        {
          title: '🎨 Оптимізація CSS',
          changes: [
            { type: 'improve', text: 'Видалено дублюючі CSS селектори для sidebar' },
            { type: 'improve', text: 'Правильно налаштовано media queries для різних роздільних здатностей' },
            { type: 'new', text: 'Додано CSS змінні для правильних розрахунків висоти на мобільних' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.1',
      badge: 'fix',
      date: '02.11.2025',
      categories: [
        {
          title: '🔧 Виправлення Архітектури',
          changes: [
            { type: 'fix', text: 'Усунено дублюючу функціональність мобільного пошуку між header-search.js та mobile-search.js' },
            { type: 'improve', text: 'header-search.js тепер обробляє лише десктопний пошук' },
            { type: 'improve', text: 'mobile-search.js повністю відповідає за мобільний пошук та анімацію' }
          ]
        },
        {
          title: '✨ Покращення Коду',
          changes: [
            { type: 'improve', text: 'Покращено обробку стану анімації в mobile-search.js' },
            { type: 'improve', text: 'Додано захист від подвійних викликів анімації' },
            { type: 'improve', text: 'Оптимізовано core.css, видалено дублюючі правила' }
          ]
        },
        {
          title: '📦 Структура Компонентів',
          changes: [
            { type: 'new', text: 'Виконано повний аналіз компонентів, зайвих файлів не виявлено' },
            { type: 'new', text: 'Усі 14 компонентів працюють у межах своїх обов\'язків' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.0',
      badge: 'critical',
      date: '02.11.2025',
      categories: [
        {
          title: '✅ Метадані та Відображення Треків',
          changes: [
            { type: 'fix', text: 'Виправлено відображення назв пісень та виконавців' },
            { type: 'improve', text: 'Покращено синхронізацію метаданих між store та player-bar' },
            { type: 'new', text: 'Додано примусову емісію track-update при зміні стану' }
          ]
        }
      ]
    },
    {
      version: 'v1.0.0',
      badge: 'firstRelease',
      date: '18.07.2025',
      categories: [
        {
          title: '🎉 Перший Реліз',
          changes: [
            { type: 'new', text: 'Оновлена сітка станцій' },
            { type: 'new', text: 'Обране, Нещодавні та Плейлисти' },
            { type: 'new', text: 'Панель плеєра з управлінням та візуалізацією' },
            { type: 'new', text: 'Модальне вікно епізодів' }
          ]
        }
      ]
    }
  ],
  it: [
      {
  version: 'v3.1.3',
  badge: 'Correzioni di bug',
  date: '12.11.2025',

  categories: [
    {
      title: '🐛 Correzioni critiche di errori',
      changes: [
        { type: 'fix', text: 'Corretto l’indice delle stazioni preferite — ora aggiunge all’inizio (indice 1) invece che alla fine' },
        { type: 'fix', text: 'Corretti i limiti del lettore mobile — ora rimane all’interno della finestra con margine di 20px' },
        { type: 'fix', text: 'Corretto il cambio modalità trascinamento — il lettore non salta più all’attivazione/disattivazione' },
        { type: 'fix', text: 'Corretto il layout predefinito dell’intestazione — il logo ora è davvero centrato' },
        { type: 'fix', text: 'Corretti i pulsanti dei colori accentati — ora si dispongono correttamente all’interno del modulo' },
        { type: 'fix', text: 'Aggiunto il blocco del pulsante Configure con avviso quando la modalità Isola non è attiva' }
      ]
    },
    {
      title: '🎨 Miglioramenti UI/UX',
      changes: [
        { type: 'new', text: 'Aggiunti 5 temi per l’intestazione: glass, neon, dark, minimal (più i già esistenti light/oled)' },
        { type: 'new', text: 'I temi dell’intestazione ora si adattano ai colori del modulo (bianco, neon scuro, nero, vetro)' },
        { type: 'improve', text: 'Migliorata la reattività mobile del lettore mobile (larghezza max 90vw)' },
        { type: 'improve', text: 'Migliorata la logica di posizionamento per evitare che esca dallo schermo' }
      ]
    },
    {
      title: '🌍 Aggiornamenti delle traduzioni',
      changes: [
        { type: 'new', text: 'Aggiunta traduzione per il messaggio islandModeRequired (UA/EN)' },
        { type: 'improve', text: 'Aggiornate tutte le stringhe dell’interfaccia per maggiore coerenza' }
      ]
    },
    {
      title: '🔧 Miglioramenti tecnici',
      changes: [
        { type: 'improve', text: 'Refactoring di enableFloating() per usare restorePosition() invece delle coordinate fisse' },
        { type: 'improve', text: 'Migliorato updatePosition() con limiti di margine' },
        { type: 'improve', text: 'Migliorato handleResize() per mantenere il lettore entro i limiti della finestra durante il ridimensionamento' },
        { type: 'new', text: 'Aggiunto flex-wrap al contenitore accent-colors per un layout migliore' }
      ]
    }
  ]
},
       {
  version: 'v3.1.2',
  badge: 'fix',
  date: '06.11.2025',
  categories: [
    {
      title: '🐛 Correzioni di bug',
      changes: [
        { type: 'fix', text: 'Corrette le traduzioni i18n per le impostazioni dell’aspetto del lettore fluttuante' },
        { type: 'fix', text: 'Risolto il problema del reset della posizione del lettore fluttuante — ora appare sempre in basso al centro dopo il ricaricamento della pagina' },
        { type: 'fix', text: 'Risolto il bug della visualizzazione dell’equalizzatore — ora le barre animate si mostrano e si nascondono correttamente durante la riproduzione' },
        { type: 'fix', text: 'Corretto il comportamento dell’effetto pulsante dell’icona della stazione — ora rispetta l’impostazione del toggle' },
        { type: 'fix', text: 'Risolto il bug nel cambio dei colori accentati — ora è possibile cambiare colore dopo aver applicato un gradiente personalizzato' },
        { type: 'fix', text: 'Corretto l’ordine di visualizzazione dei preferiti — ora i più recenti appaiono per primi nella lista' }
      ]
    },
    {
      title: '✨ Nuove funzionalità',
      changes: [
        { type: 'new', text: 'Aggiunto il toggle di visibilità per il pulsante delle impostazioni — ora è possibile mostrarlo o nasconderlo nel lettore fluttuante' },
        { type: 'new', text: 'Il gradiente personalizzato viene ora salvato come opzione di colore accentato con l’icona ✨' },
        { type: 'new', text: 'Aggiunta visualizzazione dell’equalizzatore — 4 barre animate che pulsano durante la riproduzione' }
      ]
    },
    {
      title: '🎨 Miglioramenti dell’interfaccia utente',
      changes: [
        { type: 'improve', text: 'L’impostazione dello stile del cursore del volume è stata spostata nella sezione "Comportamento" per una migliore organizzazione' },
        { type: 'improve', text: 'Il pulsante del gradiente personalizzato ora si integra correttamente con il selettore del colore accentato' },
        { type: 'improve', text: 'Le impostazioni del lettore fluttuante ora includono un toggle separato per la visibilità del pulsante delle impostazioni' }
      ]
    }
  ]
},
      {
  version: 'v3.1.1',
  badge: 'aggiornamento',
  date: '06.11.2025',
  categories: [

    {
      title: '🎨 Aspetto e personalizzazione',
      changes: [
        { type: 'new', text: 'Il pulsante delle impostazioni è ora visibile per impostazione predefinita nella modalità lettore fluttuante' },
        { type: 'new', text: 'Personalizzazione dello stile del cursore del volume — scegli tra colore accentato o stile trasparente' },
        { type: 'new', text: 'Ampliata la palette dei colori accentati con 8 nuovi temi: Viola, Arancione, Turchese, Rosa, Tramonto, Oceano, Foresta e Neon' },
        { type: 'improve', text: 'L’icona dell’ingranaggio è ora correttamente posizionata a destra del controllo del volume' },
        { type: 'new', text: 'Aggiunta una nuova sezione “Aspetto” nel pannello delle impostazioni del lettore fluttuante' },
        { type: 'new', text: 'Creatore di gradiente personalizzato — strumento interattivo per creare sfumature di colore con anteprima dal vivo' }
      ]
    },
    {
      title: '🎵 Visualizzazione audio',
      changes: [
        { type: 'new', text: 'L’icona della stazione ora pulsa con un bagliore color accento durante la riproduzione' },
        { type: 'new', text: 'Animazione fluida con effetto luminoso sincronizzato con la musica' },
        { type: 'improve', text: 'Feedback visivo migliorato — l’icona si ingrandisce leggermente e mostra un’ombra colorata durante la riproduzione' }
      ]
    },
    {
      title: '🐛 Correzioni di bug',
      changes: [
        { type: 'fix', text: 'Corretto il pulsante “Supporto” — ora apre correttamente il client e-mail con support@deepradio.cloud' },
        { type: 'fix', text: 'Corretto il pulsante “Feedback” — ora utilizza support@deepradio.cloud con notifica di conferma' },
        { type: 'fix', text: 'Corretto il pulsante “Crea Playlist” — ora salva e aggiorna correttamente le playlist' },
        { type: 'fix', text: 'Corretto l’ordine dei preferiti — le nuove stazioni ora appaiono in cima all’elenco' },
        { type: 'fix', text: 'Aggiunte le variabili CSS mancanti: --radius-xs e --preview-color' }
      ]
    },
    {
      title: '🌈 Nuovi temi colore',
      changes: [
        { type: 'new', text: 'Viola: tonalità viola per uno stile regale' },
        { type: 'new', text: 'Arancione: gradiente caldo per un tocco energico' },
        { type: 'new', text: 'Turchese: tonalità marine per un effetto rilassante' },
        { type: 'new', text: 'Rosa: sfumature delicate per un look elegante' },
        { type: 'new', text: 'Tramonto: gradiente dall’arancione al rosa per un’atmosfera calda' },
        { type: 'new', text: 'Oceano: dal blu al ciano per profondità e calma' },
        { type: 'new', text: 'Foresta: verdi intensi per gli amanti della natura' },
        { type: 'new', text: 'Neon: colori vivaci (verde, magenta, ciano) in stile cyberpunk' }
      ]
    }
  ]
},

      {
  version: 'v3.1.0',
  badge: 'stable',
  date: '06.11.2025',
  categories: [
    {
      title: '🎉 Prima versione stabile',
      changes: [
        { type: 'new', text: 'Presentata la prima versione stabile — tutti i bug critici sono stati corretti e i problemi noti risolti' },
        { type: 'improve', text: 'Interfaccia e logica del lettore fluttuante completamente rinnovate' }
      ]
    },
    {
      title: '🏝️ Miglioramenti al lettore fluttuante (Isola)',
      changes: [
        { type: 'fix', text: 'Corretto il cursore sul lettore fluttuante — ora la modalità di spostamento appare solo nelle aree vuote, mentre sui pulsanti mostra il puntatore' },
        { type: 'fix', text: 'Rimossa la voce “Applica modifiche” — tutte le impostazioni ora si applicano istantaneamente' },
        { type: 'new', text: 'Aggiunto sistema di notifiche (toast) con protezione da duplicati e contatore ×2, ×3' },
        { type: 'fix', text: 'Corretto il testo scorrevole (marquee) — ora rispetta l’interruttore di attivazione/disattivazione' },
        { type: 'fix', text: 'Corretti i pulsanti di posizione — ora funzionano immediatamente senza conferma' },
        { type: 'new', text: 'Aggiunta l’icona ⚙️ delle impostazioni direttamente nel lettore fluttuante per un accesso rapido' },
        { type: 'new', text: 'Aggiunto un tour interattivo al primo accesso alle impostazioni — evidenzia le sezioni “Stile del lettore” e “Lettore fluttuante”' }
      ]
    },
    {
      title: '⚙️ Impostazioni e icone',
      changes: [
        { type: 'improve', text: 'L’icona delle impostazioni è stata sostituita con un’icona a ingranaggio più chiara per una migliore esperienza utente' },
        { type: 'new', text: 'Il pulsante delle impostazioni nel lettore fluttuante ora apre un pannello dedicato' },
        { type: 'new', text: 'Aggiunta una guida interattiva al primo accesso alle impostazioni — scorrimento fluido e evidenziazione delle sezioni principali' }
      ]
    },
    {
      title: '🎨 Personalizzazione visiva',
      changes: [
        { type: 'new', text: 'Aggiunte opzioni di tema per il lettore fluttuante (vetro, solido, gradiente)' },
        { type: 'new', text: 'Aggiunta la personalizzazione del colore del testo per una migliore leggibilità' },
        { type: 'new', text: 'Aggiunti controlli per lo spessore e la dimensione del font entro limiti ragionevoli' },
        { type: 'new', text: 'Aggiunta la regolazione dell’opacità/sfondo trasparente del lettore fluttuante' }
      ]
    },
    {
      title: '🎵 Correzioni dei visualizzatori',
      changes: [
        { type: 'fix', text: 'Corretto il visualizzatore dell’equalizzatore nella barra del lettore — ora l’animazione funziona correttamente durante la riproduzione' },
        { type: 'fix', text: 'Corretto l’effetto di visualizzazione sopra l’icona della stazione — ora si attiva e si sincronizza correttamente con l’audio' }
      ]
    },
    {
      title: '💖 Preferiti e playlist',
      changes: [
        { type: 'fix', text: 'Corretto l’ordine dei preferiti — le nuove stazioni ora appaiono per prime (#1)' },
        { type: 'fix', text: 'Nella scheda “Preferiti” ora vengono mostrate solo le stazioni aggiunte, in ordine di inserimento' },
        { type: 'fix', text: 'Corretto il pulsante “Crea playlist” nel menu burger' }
      ]
    },
    {
      title: '🔗 Supporto e feedback',
      changes: [
        { type: 'fix', text: 'Corretto il pulsante “Supporto” — ora apre una mail a support@deepradio.cloud' },
        { type: 'new', text: 'Aggiunta notifica “Grazie per il tuo supporto!” dopo il clic' },
        { type: 'fix', text: 'Corretto il pulsante di feedback — ora utilizza anch’esso l’indirizzo support@deepradio.cloud' }
      ]
    }
  ]
},

{
  version: 'v3.0.2',
  badge: 'majorRelease',
  date: '05.11.2025',
  categories: [
    {
      title: '🏝️ Sistema potente del lettore fluttuante',
      changes: [
        { type: 'new', text: 'Creato il componente dedicato floating-player-panel.js con opzioni di personalizzazione complete' },
        { type: 'new', text: 'Aggiunto un interruttore per attivare o disattivare la modalità fluttuante in modo indipendente dallo stile del lettore' },
        { type: 'new', text: 'Implementato un sistema di trascinamento opzionale per ridurre il consumo di risorse (non sempre attivo)' },
        { type: 'new', text: 'Aggiunte 9 posizioni predefinite: in alto a sinistra, in alto, in alto a destra, a sinistra, al centro, a destra, in basso a sinistra, in basso, in basso a destra' },
        { type: 'new', text: 'Controllo della visibilità degli elementi: icona, nome stazione, titolo del brano, volume, pulsanti di riproduzione e di salto' },
        { type: 'new', text: 'Aggiunta l’opzione di testo scorrevole (marquee) per i titoli di brani lunghi' },
        { type: 'fix', text: 'Corretto il problema del margine inferiore ("mento") quando la modalità fluttuante è attiva' },
        { type: 'improve', text: 'Lo stile “island” è stato rimosso dall’elenco — ora accessibile tramite pannello dedicato' }
      ]
    },
    {
      title: '⚡ Ottimizzazioni delle prestazioni',
      changes: [
        { type: 'improve', text: 'I listener di trascinamento vengono attivati solo quando la funzione è abilitata' },
        { type: 'new', text: 'Aggiunti i metodi setupDragListeners() e removeDragListeners() per una corretta gestione degli eventi' },
        { type: 'improve', text: 'Le impostazioni vengono applicate su richiesta anziché essere controllate continuamente' },
        { type: 'improve', text: 'Ottimizzato floating-player-manager.js per l’attivazione condizionale delle funzioni' }
      ]
    },
    {
      title: '🐛 Correzioni critiche',
      changes: [
        { type: 'fix', text: 'Bug #1: Corretto station-grid.js — “Niente trovato” ora utilizza la traduzione i18n' },
        { type: 'fix', text: 'Bug #2: Corretto main.js — “Vista: Copertine” ora si traduce correttamente' },
        { type: 'fix', text: 'Bug #3: Aggiunte le versioni mancanti del changelog (v2.0.2, v2.0.1, v2.0.0, v1.0.0) con traduzioni complete' },
        { type: 'fix', text: 'Bug #4: Corretto il sistema di statistiche — ora registra correttamente sessioni, brani e generi' },
        { type: 'fix', text: 'Bug #5: Verificate le traduzioni di player-bar.js — tutte le stringhe usano correttamente i18n' },
        { type: 'fix', text: 'Bug #6: Corretto il salvataggio delle statistiche — aggiunti i campi tracks[], genres[], time e timestamp' }
      ]
    },
    {
      title: '🌍 Miglioramenti dell’internazionalizzazione (i18n)',
      changes: [
        { type: 'new', text: 'Aggiunte traduzioni complete per il lettore fluttuante in russo, inglese e ucraino' },
        { type: 'new', text: 'Aggiunte le chiavi display.viewPrefix e display.viewModes in i18n.js' },
        { type: 'new', text: 'Aggiunta la chiave di traduzione messages.changeFiltersOrSearch' },
        { type: 'new', text: 'Aggiunte le traduzioni floatingPlayer.* per tutti gli elementi del pannello impostazioni' },
        { type: 'fix', text: 'Corretto il tempo di caricamento i18n in floating-player-panel.js (tramite setTimeout)' }
      ]
    },
    {
      title: '📊 Miglioramenti del sistema di statistiche',
      changes: [
        { type: 'new', text: 'Aggiunto l’array tracks ai dati di sessione — ora vengono registrati tutti i brani con timestamp' },
        { type: 'new', text: 'Aggiunta la registrazione dei generi musicali dai tag della stazione' },
        { type: 'new', text: 'Aggiunti i campi time e timestamp negli oggetti delle sessioni' },
        { type: 'improve', text: 'La funzione endListeningSession() ora aggrega le statistiche dei generi' },
        { type: 'improve', text: 'Le statistiche ora tengono traccia sia dei singoli brani che del tempo complessivo per genere' }
      ]
    },
    {
      title: '🗑️ Pulizia del codice',
      changes: [
        { type: 'fix', text: 'Rimosso il componente non utilizzato header-manager.js' },
        { type: 'fix', text: 'Rimossi gli import di header-manager da main.js' },
        { type: 'improve', text: 'Eliminata la variabile obsoleta this.headerManager dal costruttore' }
      ]
    },
    {
      title: '🎨 Miglioramenti UI/UX',
      changes: [
        { type: 'new', text: 'Aggiunto il pulsante “Configura” nel pannello impostazioni del lettore fluttuante' },
        { type: 'new', text: 'Creato un bellissimo pannello del lettore fluttuante con animazioni fluide e design moderno' },
        { type: 'improve', text: 'Il pannello impostazioni ora include una sezione dedicata al lettore fluttuante' },
        { type: 'improve', text: 'Applicazione delle impostazioni in tempo reale' },
        { type: 'improve', text: 'Tutte le impostazioni del lettore fluttuante vengono salvate in localStorage' }
      ]
    },
    {
      title: '🔧 Architettura tecnica',
      changes: [
        { type: 'new', text: 'Creato floating-player-panel.js basato su architettura Shadow DOM' },
        { type: 'new', text: 'Aggiunto l’evento personalizzato floating-player-change per la sincronizzazione delle impostazioni' },
        { type: 'new', text: 'Implementato il sistema di attributi data-show-* per il controllo della visibilità degli elementi' },
        { type: 'improve', text: 'Migliorato floating-player-manager.js con comportamento basato sulle impostazioni' },
        { type: 'improve', text: 'Aggiunta una corretta pulizia nel metodo disableFloating()' }
      ]
    }
  ]
},
    {
      version: 'v3.0.1',
      badge: 'improve',
      date: '05.11.2025',
      categories: [
        {
          title: '🌍 Implementazione Completa i18n',
          changes: [
            { type: 'fix', text: 'Corretto traduzione placeholder ricerca capsula (ora usa attributo data-i18n)' },
            { type: 'new', text: 'Aggiunte traduzioni menu contestuale per tutte le azioni (Play, Pausa, Aggiungi ai Preferiti, Copia URL, Modalità Modifica)' },
            { type: 'fix', text: 'Corrette traduzioni calendario statistiche (mesi e giorni settimana ora traducono correttamente)' },
            { type: 'fix', text: 'Corretto traduzione placeholder vista statistiche (Cerca tracce...)' },
            { type: 'new', text: 'Aggiunto selettore lingua al pannello changelog (pulsanti EN/RU/UK/IT)' },
            { type: 'improve', text: 'Lingua contenuto changelog ora indipendente dalla lingua interfaccia' },
            { type: 'fix', text: 'Corretto chiusura changelog quando si seleziona la lingua (aggiunto stopPropagation)' }
          ]
        },
        {
          title: '🎨 Correzioni Traduzioni',
          changes: [
            { type: 'fix', text: 'Tradotti tutti pulsanti generi ("Tutti i Generi" ora traduce correttamente)' },
            { type: 'fix', text: 'Tradotti messaggi barra player (Caricamento info, In Onda, Seleziona stazione)' },
            { type: 'fix', text: 'Corretto station-grid.js per usare traduzioni filtro generi' },
            { type: 'new', text: 'Cambiata lingua predefinita applicazione da russo a inglese' },
            { type: 'improve', text: 'Migliorata logica updateTexts() per gestire placeholder separatamente' }
          ]
        },
        {
          title: '🔧 Miglioramenti Tecnici',
          changes: [
            { type: 'improve', text: 'Riscritto completamente changelog-panel.js con struttura dati dinamica' },
            { type: 'improve', text: 'Aggiunto import getCurrentLanguage() per rilevamento lingua changelog' },
            { type: 'new', text: 'Aggiunta chiave localStorage changelog_lang per selezione lingua persistente' },
            { type: 'improve', text: 'Separata gestione data-i18n e data-i18n-placeholder in stats-view' }
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
          title: '✨ Ricerca Capsula: Animazione Flip',
          changes: [
            { type: 'new', text: 'Introdotto componente ricerca capsula con animazione flip 3D fluida (rotateY 180°)' },
            { type: 'new', text: 'Aggiunti metodi flip() e flipBack() con logica JavaScript per eventi mouseenter/mouseleave' },
            { type: 'fix', text: 'Corretto tremolio capsula durante flip: aggiunto display: inline-block a .capsule-scene per stabilità dimensioni' },
            { type: 'fix', text: 'Risolti conflitti transform: effetti hover (translateY) ora si applicano solo quando capsula non è capovolta' },
            { type: 'fix', text: 'Corretto errore CSS: capsule-clear.visible → .capsule-clear.visible' },
            { type: 'improve', text: 'Capsula ora si capovolge al passaggio mouse, ritorna all\'uscita, rimane capovolta quando attivata e si chiude al clic esterno o Escape' }
          ]
        },
        {
          title: '🌍 Internazionalizzazione Completa (i18n)',
          changes: [
            { type: 'new', text: 'Sistema traduzione completo per lingue inglese, russo, ucraino e italiano' },
            { type: 'new', text: 'Tradotti tutti elementi UI: navigazione laterale, pannello impostazioni, vista statistiche e changelog' },
            { type: 'new', text: 'Esteso i18n.js con oltre 150+ chiavi traduzione coprendo tutte opzioni impostazioni, controlli visualizzazione e etichette statistiche' },
            { type: 'improve', text: 'Implementati attributi data-i18n in tutto HTML per aggiornamenti traduzioni automatici' }
          ]
        },
        {
          title: '🎨 Miglioramenti UI/UX',
          changes: [
            { type: 'improve', text: 'Migliorato pannello changelog con migliore reattività mobile e UI touch-friendly' },
            { type: 'improve', text: 'Migliorati badge versione con stile gradiente e migliore gerarchia visiva' },
            { type: 'improve', text: 'Raffinati effetti hover elementi modifiche con transizioni sfondo fluide' }
          ]
        },
        {
          title: '🔧 Miglioramenti Tecnici',
          changes: [
            { type: 'improve', text: 'Ottimizzate animazioni CSS con timing cubic-bezier per transizioni ultra-fluide' },
            { type: 'improve', text: 'Rimossi regole CSS ridondanti e puliti selettori in conflitto' },
            { type: 'new', text: 'Aggiunto transform-style: preserve-3d per rendering corretto animazione 3D' }
          ]
        },
        {
          title: '📱 Miglioramenti Mobile',
          changes: [
            { type: 'improve', text: 'Migliorato layout mobile changelog con padding responsive e dimensioni carattere' },
            { type: 'improve', text: 'Migliorati target touch per migliore interazione mobile' },
            { type: 'improve', text: 'Pannelli a larghezza completa su dispositivi mobile per uso ottimale spazio schermo' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.2',
      badge: 'critical',
      date: '02.11.2025',
      categories: [
        {
          title: '🚨 Correzioni Critiche Mobile',
          changes: [
            { type: 'fix', text: 'Corretto problema critico con sidebar sovrapposta a contenuto su dispositivi mobile' },
            { type: 'fix', text: 'Configurato correttamente padding contenuto da header e player fissi su mobile' },
            { type: 'improve', text: 'Ottimizzati livelli z-index per corretto stacking elementi UI' },
            { type: 'fix', text: 'Corretto sintassi in header-manager.js (template literal)' },
            { type: 'improve', text: 'Unificati stili sidebar per versioni mobile e desktop' }
          ]
        },
        {
          title: '📱 Miglioramenti Mobile',
          changes: [
            { type: 'new', text: 'Contenuto ora posizionato correttamente sotto header e sopra player' },
            { type: 'new', text: 'Sidebar non sovrappone più contenuto principale' },
            { type: 'improve', text: 'Migliorato scorrimento contenuto su dispositivi mobile' }
          ]
        },
        {
          title: '🎨 Ottimizzazione CSS',
          changes: [
            { type: 'improve', text: 'Rimossi selettori CSS duplicati per sidebar' },
            { type: 'improve', text: 'Configurate correttamente media query per diverse risoluzioni' },
            { type: 'new', text: 'Aggiunte variabili CSS per calcoli altezza corretti su mobile' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.1',
      badge: 'fix',
      date: '02.11.2025',
      categories: [
        {
          title: '🔧 Correzioni Architettura',
          changes: [
            { type: 'fix', text: 'Eliminata funzionalità ricerca mobile duplicata tra header-search.js e mobile-search.js' },
            { type: 'improve', text: 'header-search.js ora gestisce solo ricerca desktop' },
            { type: 'improve', text: 'mobile-search.js completamente responsabile per ricerca mobile e animazione' }
          ]
        },
        {
          title: '✨ Miglioramenti Codice',
          changes: [
            { type: 'improve', text: 'Migliorata gestione stato animazione in mobile-search.js' },
            { type: 'improve', text: 'Aggiunta protezione contro chiamate animazione doppie' },
            { type: 'improve', text: 'Ottimizzato core.css, rimosse regole duplicate' }
          ]
        },
        {
          title: '📦 Struttura Componenti',
          changes: [
            { type: 'new', text: 'Eseguita analisi componenti completa, nessun file non necessario trovato' },
            { type: 'new', text: 'Tutti 14 componenti funzionano entro loro responsabilità' }
          ]
        }
      ]
    },
    {
      version: 'v2.0.0',
      badge: 'critical',
      date: '02.11.2025',
      categories: [
        {
          title: '✅ Metadati e Visualizzazione Tracce',
          changes: [
            { type: 'fix', text: 'Corretto visualizzazione nomi brani e artisti' },
            { type: 'improve', text: 'Migliorata sincronizzazione metadati tra store e player-bar' },
            { type: 'new', text: 'Aggiunta emissione forzata track-update su cambiamenti stato' }
          ]
        }
      ]
    },
    {
      version: 'v1.0.0',
      badge: 'firstRelease',
      date: '18.07.2025',
      categories: [
        {
          title: '🎉 Primo Rilascio',
          changes: [
            { type: 'new', text: 'Griglia stazioni aggiornata' },
            { type: 'new', text: 'Preferiti, Recenti e Playlist' },
            { type: 'new', text: 'Barra Player con controlli e visualizzazione' },
            { type: 'new', text: 'Finestra modale episodi' }
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
    this.changelogLang = localStorage.getItem('changelog_lang') || getCurrentLanguage();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();

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
          <span class="version-badge ${version.badge}">${t(`changelog.${version.badge}`)}</span>
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
              <button class="lang-btn ${this.changelogLang === 'it' ? 'active' : ''}" data-lang="it">IT</button>
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