import { store } from '../core/store.js';
import { showToast } from '../utils/toast.js';
import { t, setLanguage } from '../utils/i18n.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
:host {
  display: none;
  position: fixed;
  inset: 0;
  z-index: var(--z-modals, 1000);
  animation: fadeIn 0.3s ease;
}

:host([open]) {
  display: block !important;
  pointer-events: auto;
  visibility: visible;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  opacity: 0;
  pointer-events: none;
}

:host([open]) .overlay {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  opacity: 1;
  pointer-events: auto;
}

.panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: var(--bg-gradient-start);
  border-left: 1px solid var(--border);
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  will-change: transform;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
}

:host([open]) .panel {
  transform: translateX(0);
}

.panel > * {
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
  transition-delay: 0s;
}

:host([open]) .panel > * {
  opacity: 1;
  transform: translateX(0);
  transition-delay: 0.2s;
}

.header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title svg {
  width: 24px;
  height: 24px;
  color: var(--accent1);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.close-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--surface-hover);
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.3s ease;
}

.close-btn:hover::before {
  transform: scale(1);
}

.close-btn:hover {
  color: var(--text-primary);
}

.close-btn svg {
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.close-btn:hover svg {
  transform: rotate(90deg);
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  scroll-behavior: smooth;
}

.content::-webkit-scrollbar {
  width: 6px;
}

.content::-webkit-scrollbar-track {
  background: transparent;
}

.content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
  transition: background 0.2s;
}

.content::-webkit-scrollbar-thumb:hover {
  background: var(--border-hover);
}

.section {
  margin-bottom: 2rem;
  opacity: 0;
  transform: translateY(20px);
  animation: sectionFadeIn 0.4s ease forwards;
}

.section:nth-child(1) { animation-delay: 0.3s; }
.section:nth-child(2) { animation-delay: 0.4s; }
.section:nth-child(3) { animation-delay: 0.5s; }
.section:nth-child(4) { animation-delay: 0.6s; }
.section:nth-child(5) { animation-delay: 0.7s; }
.section:nth-child(6) { animation-delay: 0.8s; }
.section:nth-child(7) { animation-delay: 0.9s; }

@keyframes sectionFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 20px;
  height: 2px;
  background: var(--accent1);
  border-radius: 1px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--border);
  transition: all 0.2s ease;
  position: relative;
}

.setting-row:hover {
  padding-left: 0.5rem;
  background: var(--surface);
  margin: 0 -0.5rem;
  padding-right: 0.5rem;
  border-radius: var(--radius-sm);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  margin-right: 1rem;
}

.setting-label {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
}

.setting-description {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
  line-height: 1.4;
}

.select-wrapper {
  position: relative;
  display: inline-block;
  z-index: 1;
}

.select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  font-family: inherit;
  line-height: 1.4;
}

.select:hover {
  border-color: var(--border-hover);
  background: var(--surface-hover);
}

.select:focus {
  outline: none;
  border-color: var(--accent1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent1) 20%, transparent);
}

.select-wrapper::after {
  content: '';
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--text-muted);
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 1;
}

.select option {
 background: #1a1a1a !important;
  background-color: #1a1a1a !important;
  color: #ffffff !important;
  padding: 0.75rem 1rem;
}

.toggle-container {
  position: relative;
}

.toggle {
  position: relative;
  width: 52px;
  height: 28px;
  background: var(--surface-hover);
  border-radius: 28px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  border: 1px solid var(--border);
}

.toggle:hover {
  border-color: var(--border-hover);
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle input:checked + .toggle-slider {
  transform: translateX(24px);
  background: white;
}

.toggle:has(input:checked) {
  background: var(--accent1);
  border-color: var(--accent1);
}

.accent-colors {
 flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
  max-width: 100%;
}

.accent-btn {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.accent-btn:hover {
  transform: scale(1.1);
}

.accent-btn.active {
  border-color: var(--text-primary);
  transform: scale(1.1);
}

.accent-btn.active::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  animation: checkIn 0.3s ease;
}

@keyframes checkIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.accent-btn[data-accent="default"] {
  background: linear-gradient(135deg, #08f7fe, #f15bb5);
}

.accent-btn[data-accent="blue"] {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.accent-btn[data-accent="green"] {
  background: linear-gradient(135deg, #10b981, #84cc16);
}

.accent-btn[data-accent="red"] {
  background: linear-gradient(135deg, #ef4444, #f97316);
}

.accent-btn[data-accent="gradient"] {
  background: conic-gradient(from 0deg, #08f7fe, #f15bb5, #ffea00, #08f7fe);
}
.floating-player-btn {
  background: var(--accent1);
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem 1rem;
  color: black;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.floating-player-btn:hover {
  background: var(--accent2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent1) 40%, transparent);
}
.floating-player-btn svg {
  width: 16px;
  height: 16px;
}
.visualizer-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.25rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
}

.viz-tab {
  flex: 1;
  padding: 0.5rem;
  background: none;
  border: none;
  border-radius: calc(var(--radius-sm) - 4px);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.viz-tab:hover {
  color: var(--text-primary);
}

.viz-tab.active {
  background: var(--accent1);
  color: #000;
}

.visualizer-modes {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: all 0.3s ease;
}

.visualizer-modes.show {
  max-height: 600px;
  opacity: 1;
  margin-top: 1rem;
}

.viz-mode {
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.viz-mode:hover {
  background: var(--surface-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
  transform: translateX(4px);
}

.viz-mode.active {
  background: var(--accent1);
  color: #000;
  border-color: var(--accent1);
}

.viz-mode-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.add-station-toggle {
  background: var(--accent1);
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.875rem 1.5rem;
  color: black;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.add-station-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent1) 40%, transparent);
}

.add-station-toggle svg {
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.add-station-toggle.active svg {
  transform: rotate(45deg);
}

.add-station-form {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.add-station-form.show {
  max-height: 400px;
  opacity: 1;
  margin-top: 1rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent1) 20%, transparent);
  background: var(--surface-hover);
}

.input::placeholder {
  color: var(--text-muted);
}

.button {
  background: var(--accent1);
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1.5rem;
  color: black;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button:hover {
  background: var(--accent2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent2) 40%, transparent);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.opacity-slider,
.intensity-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: var(--surface-hover);
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb,
.intensity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent1);
  cursor: pointer;
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent1) 60%, transparent);
  transition: all 0.2s ease;
  border: 2px solid white;
}

.opacity-slider::-webkit-slider-thumb:hover,
.intensity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent1) 80%, transparent);
}

.opacity-value,
.intensity-value {
  font-size: 0.9rem;
  color: var(--text-secondary);
  min-width: 45px;
  text-align: center;
  font-weight: 500;
}

.lightning-settings {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.lightning-settings.show {
  opacity: 1;
  max-height: 200px;
}

.lightning-types {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.lightning-type-btn {
  flex: 1;
  padding: 0.5rem;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lightning-type-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.lightning-type-btn.active {
  background: var(--accent1);
  color: #000;
  border-color: var(--accent1);
}

.toast-positions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.toast-position-btn {
  padding: 0.75rem 0.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.toast-position-btn:hover {
  background: var(--surface-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.toast-position-btn.active {
  background: var(--accent1);
  color: #000;
  border-color: var(--accent1);
}

.about {
  text-align: center;
  color: var(--text-secondary);
  line-height: 1.6;
}

.about .logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, var(--accent1), var(--accent2));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--accent1) 30%, transparent);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.about h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, var(--accent1), var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.about p {
  margin-bottom: 1rem;
}

.about .links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.about a {
  color: var(--accent1);
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
}

.about a:hover {
  color: var(--accent2);
  background: var(--surface);
  border-color: var(--border);
}

@media (max-width: 480px) {
  .panel {
    width: 100%;
  }
  
  .toast-positions {
    grid-template-columns: 1fr;
  }
}
</style>

<div class="overlay" id="overlay"></div>
<div class="panel" id="panel">
  <div class="header">
    <h2 class="title">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.47.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
      <span data-i18n="settings.title">Settings</span>
    </h2>
    <button class="close-btn" id="close-btn" aria-label="Close">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>

  <div class="content">
    <div class="section">
      <h3 class="section-title" data-i18n="settings.interface">Interface</h3>
      
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.theme">Theme</div>
          <div class="setting-description" data-i18n="settings.themeDesc">Choose interface color scheme</div>
        </div>
        <div class="select-wrapper">
          <select class="select" id="theme-select">
            <option value="dark">Neon Dark</option>
            <option value="light">Light</option>
            <option value="oled">OLED Black</option>
          </select>
        </div>
      </div>
      
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.language">Language</div>
          <div class="setting-description" data-i18n="settings.languageDesc">Application interface language</div>
        </div>
        <div class="select-wrapper">
          <select class="select" id="lang-select">
            <option value="en">English</option>
            <option value="ru">Русский</option>
            <option value="uk">Українська</option>
          </select>
        </div>
      </div>
      
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.accentColor">Accent Color</div>
          <div class="setting-description" data-i18n="settings.accentColorDesc">Main interface element colors</div>
          <div class="accent-colors">
            <button class="accent-btn active" data-accent="default" title="Default"></button>
            <button class="accent-btn" data-accent="blue" title="Blue"></button>
            <button class="accent-btn" data-accent="green" title="Green"></button>
            <button class="accent-btn" data-accent="red" title="Red"></button>
            <button class="accent-btn" data-accent="gradient" title="Gradient"></button>
            <button class="accent-btn" data-accent="custom" title="Custom Gradient" style="background: linear-gradient(135deg, var(--accent1, #08f7fe), var(--accent2, #f15bb5), var(--accent3, #ffea00));">✨</button>
          </div>
  <button class="floating-player-btn" id="gradient-creator-btn" style="margin-top: 1rem;">
            🎨 Create Custom Gradient
          </button>
        </div>
      </div>
      
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.animations">Animations</div>
          <div class="setting-description" data-i18n="settings.animationsDesc">Visual effects and transitions</div>
        </div>
        <div class="toggle-container">
          <label class="toggle">
            <input type="checkbox" id="animations-toggle" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.compact">Compact Mode</div>
          <div class="setting-description" data-i18n="settings.compactDesc">Reduced spacing and sizes</div>
        </div>
        <div class="toggle-container">
          <label class="toggle">
            <input type="checkbox" id="compact-toggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="section">
      <h3 class="section-title" data-i18n="settings.layout">Element Layout</h3>
      
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.headerLayout">Header Layout</div>
          <div class="setting-description" data-i18n="settings.headerLayoutDesc">Top panel element positioning</div>
        </div>
        <div class="select-wrapper">
          <select class="select" id="header-layout-select">
            <option value="default" data-i18n="settings.headerLayouts.default">Default (logo centered)</option>
            <option value="centered" data-i18n="settings.headerLayouts.centered">Centered</option>
            <option value="compact" data-i18n="settings.headerLayouts.compact">Compact</option>
            <option value="spacious" data-i18n="settings.headerLayouts.spacious">Spacious</option>
          </select>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.playerStyle">Player Style</div>
          <div class="setting-description" data-i18n="settings.playerStyleDesc">Player appearance and functionality</div>
        </div>
        <div class="select-wrapper">
          <select class="select" id="player-style-select">
            <option value="default" data-i18n="settings.playerStyles.default">Default</option>
            <option value="minimal" data-i18n="settings.playerStyles.minimal">Minimal</option>
            <option value="extended" data-i18n="settings.playerStyles.extended">Extended (with likes)</option>
            <option value="compact" data-i18n="settings.playerStyles.compact">Compact</option>
            <option value="modern" data-i18n="settings.playerStyles.modern">Modern</option>
            <option value="classic" data-i18n="settings.playerStyles.classic">Classic</option>
             <option value="island" data-i18n="settings.playerStyles.island">Island (Floating)</option>
         </select>

        </div>

      </div>

 

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.floatingPlayer">Floating Player</div>
          <div class="setting-description" data-i18n="settings.floatingPlayerDesc">Configure draggable floating player mode</div>
        </div>
        <button class="floating-player-btn" id="floating-player-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span data-i18n="settings.configure">Configure</span>
        </button>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.centerElements">Element Alignment</div>
          <div class="setting-description" data-i18n="settings.centerElementsDesc">Center interface elements</div>
        </div>
        <div class="toggle-container">
          <label class="toggle">
            <input type="checkbox" id="center-elements-toggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title" data-i18n="settings.notifications">Notifications</h3>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.toastPosition">Notification Position</div>
          <div class="setting-description" data-i18n="settings.toastPositionDesc">Where to display toasts on screen</div>
          <div class="toast-positions">
            <button class="toast-position-btn" data-position="top-left" data-i18n="settings.toastPositions.topLeft">Top Left</button>
            <button class="toast-position-btn" data-position="top-center" data-i18n="settings.toastPositions.topCenter">Top Center</button>
            <button class="toast-position-btn active" data-position="top-right" data-i18n="settings.toastPositions.topRight">Top Right</button>
            <button class="toast-position-btn" data-position="bottom-left" data-i18n="settings.toastPositions.bottomLeft">Bottom Left</button>
            <button class="toast-position-btn" data-position="bottom-center" data-i18n="settings.toastPositions.bottomCenter">Bottom Center</button>
            <button class="toast-position-btn" data-position="bottom-right" data-i18n="settings.toastPositions.bottomRight">Bottom Right</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title" data-i18n="settings.visualization">Visualization</h3>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.enableVisualizer">Enable Visualizer</div>
          <div class="setting-description" data-i18n="settings.enableVisualizerDesc">Background music animation</div>
        </div>
        <div class="toggle-container">
          <label class="toggle">
            <input type="checkbox" id="visualizer-toggle" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.visualizerClass">Visualization Class</div>
          <div class="setting-description" data-i18n="settings.visualizerClassDesc">Choose visualization type and mode</div>

          <div class="visualizer-tabs">
            <button class="viz-tab active" data-class="geometric" data-i18n="settings.geometric">Geometric</button>
            <button class="viz-tab" data-class="organic" data-i18n="settings.organic">Organic</button>
          </div>
          
          <div class="visualizer-modes show" id="geometric-modes">
            <button class="viz-mode active" data-mode="0"><span data-i18n="settings.visualizerModes.geometric.hexGrid">Hexagonal Grid</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 8L12 2.5L6.5 8L6.5 16L12 21.5L17.5 16V8Z"/></svg></button>
            <button class="viz-mode" data-mode="1"><span data-i18n="settings.visualizerModes.geometric.spiralGalaxy">Spiral Galaxy</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.21 3.41-.6.3-.11.49-.4.49-.72 0-.43-.35-.78-.78-.78-.17 0-.33.06-.46.11-.86.31-1.76.49-2.66.49-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 .9-.18 1.8-.49 2.66-.05.13-.11.29-.11.46 0 .43.35.78.78.78.32 0 .61-.19.72-.49.39-1.07.6-2.22.6-3.41 0-5.52-4.48-10-10-10z"/></svg></button>
            <button class="viz-mode" data-mode="2"><span data-i18n="settings.visualizerModes.geometric.crystalFormations">Crystal Formations</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg></button>
            <button class="viz-mode" data-mode="3"><span data-i18n="settings.visualizerModes.geometric.voronoiCells">Voronoi Cells</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9V7H8v2h8m-3 10.5V14h-2v7.5L6 18l-1 1.5L12 24l7-4.5L18 18l-3 3.5z"/></svg></button>
            <button class="viz-mode" data-mode="4"><span data-i18n="settings.visualizerModes.geometric.neuralNet">Neural Network</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 9c0-1.1-.9-2-2-2h-3.17l-.88-.88A1.98 1.98 0 0013.53 5H10.47c-.55 0-1.07.22-1.45.6L8.12 7H5c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9zm-9 9c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg></button>
            <button class="viz-mode" data-mode="5"><span data-i18n="settings.visualizerModes.geometric.sacredGeometry">Sacred Geometry</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></button>
            <button class="viz-mode" data-mode="6"><span data-i18n="settings.visualizerModes.geometric.pulsingSphere">Pulsing Sphere</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg></button>
            <button class="viz-mode" data-mode="7"><span data-i18n="settings.visualizerModes.geometric.kaleidoscope">Kaleidoscope</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg></button>
          </div>
          
          <div class="visualizer-modes" id="organic-modes">
            <button class="viz-mode" data-mode="0"><span data-i18n="settings.visualizerModes.organic.fluidSim">Fluid Simulation</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg></button>
            <button class="viz-mode" data-mode="1"><span data-i18n="settings.visualizerModes.organic.northernLights">Northern Lights</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg></button>
            <button class="viz-mode" data-mode="2"><span data-i18n="settings.visualizerModes.organic.lavaLamp">Lava Lamp</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 11L16 8l1.5 3h-3m2.7 6H16l1.2-2.4L18.5 17m-13-6L7 8l1.5 3h-3m2.7 6H7l1.3-2.4L9.5 17M12 1l-2 5v11l2 5 2-5V6l-2-5z"/></svg></button>
            <button class="viz-mode" data-mode="3"><span data-i18n="settings.visualizerModes.organic.magneticField">Magnetic Field</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7v2h5v2H4v2h4v2H3v2h5c1.1 0 2-.9 2-2v-1.5c0-.83-.67-1.5-1.5-1.5.83 0 1.5-.67 1.5-1.5V9c0-1.1-.9-2-2-2H3m10 0v10h2v-4h.5l1.5 4h2l-1.5-4c.83 0 1.5-.67 1.5-1.5v-3C19 7.9 18.1 7 17 7h-4m2 2h2v2h-2V9z"/></svg></button>
            <button class="viz-mode" data-mode="4"><span data-i18n="settings.visualizerModes.organic.smokeTrails">Smoke Trails</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z"/></svg></button>
            <button class="viz-mode" data-mode="5"><span data-i18n="settings.visualizerModes.organic.stormLightning">Storm Lightning</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg></button>
            <button class="viz-mode" data-mode="6"><span data-i18n="settings.visualizerModes.organic.oceanDepths">Ocean Depths</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM4 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8-3c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg></button>
            <button class="viz-mode" data-mode="7"><span data-i18n="settings.visualizerModes.organic.cosmicDust">Cosmic Dust</span><svg class="viz-mode-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
          </div>

          <div class="lightning-settings" id="lightning-settings">
            <div class="setting-label" style="margin-bottom: 0.5rem;" data-i18n="settings.lightningType">Lightning Type</div>
            <div class="lightning-types">
              <button class="lightning-type-btn active" data-type="classic" data-i18n="settings.lightningTypes.classic">Classic</button>
              <button class="lightning-type-btn" data-type="plasma" data-i18n="settings.lightningTypes.plasma">Plasma</button>
              <button class="lightning-type-btn" data-type="energy" data-i18n="settings.lightningTypes.energy">Energy</button>
            </div>
            <div class="setting-label" style="margin-bottom: 0.5rem;" data-i18n="settings.lightningIntensity">Lightning Intensity</div>
            <div class="slider-container">
              <input type="range" class="intensity-slider" id="lightning-intensity" min="0.5" max="3" value="1.0" step="0.1">
              <span class="intensity-value" id="lightning-intensity-value">1.0x</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.visualizerBars">Player Bars</div>
          <div class="setting-description" data-i18n="settings.visualizerBarsDesc">Equalizer animation in player</div>
        </div>
        <div class="toggle-container">
          <label class="toggle">
            <input type="checkbox" id="visualizer-bars-toggle" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.iconVisualizer">Cover Visualization</div>
          <div class="setting-description" data-i18n="settings.iconVisualizerDesc">Effect over station icon</div>
        </div>
        <div class="toggle-container">
          <label class="toggle">
            <input type="checkbox" id="icon-visualizer-toggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label" data-i18n="settings.visualizerOpacity">Visualizer Opacity</div>
          <div class="setting-description" data-i18n="settings.visualizerOpacityDesc">Background effect intensity</div>
        </div>
        <div class="slider-container">
          <input type="range" class="opacity-slider" id="viz-opacity" min="5" max="100" value="15" step="1">
          <span class="opacity-value" id="opacity-value">15%</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title" data-i18n="settings.addStation">Add Station</h3>
      <button class="add-station-toggle" id="add-station-toggle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <span data-i18n="settings.addNewStation">Add New Station</span>
      </button>
      <div class="add-station-form" id="add-station-form">
        <div class="form-grid">
          <div class="input-group">
            <label class="input-label" for="station-name" data-i18n="settings.stationName">Name</label>
            <input type="text" class="input" id="station-name" placeholder="My Favorite Station" required>
          </div>
          <div class="input-group">
            <label class="input-label" for="station-url" data-i18n="settings.stationUrl">Stream URL</label>
            <input type="url" class="input" id="station-url" placeholder="https://stream.example.com/radio.mp3" required>
          </div>
          <div class="input-group">
            <label class="input-label" for="station-tags" data-i18n="settings.stationTags">Genres (comma separated)</label>
            <input type="text" class="input" id="station-tags" placeholder="Pop, Dance, EDM">
          </div>
          <button type="submit" class="button" id="add-station-btn" data-i18n="settings.addButton">Add Station</button>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title" data-i18n="settings.about">About</h3>
      <div class="about">
        <div class="logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
        <h3>DeepRadio</h3>
        <p data-i18n="settings.version">Version 3.1.3</p>
        <p data-i18n="settings.description">Modern internet radio with advanced visualization. Over 150 stations of various genres.</p>
        <div class="links">
          <a href="https://github.com/vados2343/deepradio" target="_blank" id="github-link" data-i18n="settings.github">GitHub</a>
          <a href="mailto:support@deepradio.cloud" id="feedback-link" data-i18n="settings.feedback">Feedback</a>
          <a href="mailto:support@deepradio.cloud" id="donate-link" data-i18n="settings.support">Support</a>
        </div>
      </div>
    </div>
  </div>
</div>
`;

export class SettingsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.overlay = this.shadowRoot.getElementById('overlay');
    this.closeBtn = this.shadowRoot.getElementById('close-btn');
    this.panel = this.shadowRoot.getElementById('panel');
    this.themeSelect = this.shadowRoot.getElementById('theme-select');
    this.langSelect = this.shadowRoot.getElementById('lang-select');
    this.animationsToggle = this.shadowRoot.getElementById('animations-toggle');
    this.compactToggle = this.shadowRoot.getElementById('compact-toggle');
    this.addStationToggle = this.shadowRoot.getElementById('add-station-toggle');
    this.addStationForm = this.shadowRoot.getElementById('add-station-form');
    this.addStationBtn = this.shadowRoot.getElementById('add-station-btn');
    this.vizToggle = this.shadowRoot.getElementById('visualizer-toggle');
    this.vizBarsToggle = this.shadowRoot.getElementById('visualizer-bars-toggle');
    this.iconVizToggle = this.shadowRoot.getElementById('icon-visualizer-toggle');
    this.vizOpacity = this.shadowRoot.getElementById('viz-opacity');
    this.opacityValue = this.shadowRoot.getElementById('opacity-value');
    this.headerLayoutSelect = this.shadowRoot.getElementById('header-layout-select');
    this.playerStyleSelect = this.shadowRoot.getElementById('player-style-select');
    this.centerElementsToggle = this.shadowRoot.getElementById('center-elements-toggle');
    this.floatingPlayerBtn = this.shadowRoot.getElementById('floating-player-btn');
    this.lightningSettings = this.shadowRoot.getElementById('lightning-settings');
    this.lightningIntensity = this.shadowRoot.getElementById('lightning-intensity');
    this.lightningIntensityValue = this.shadowRoot.getElementById('lightning-intensity-value');
    this.geometricModes = this.shadowRoot.getElementById('geometric-modes');
    this.organicModes = this.shadowRoot.getElementById('organic-modes');

    this.currentVizClass = 'geometric';
    this.currentVizMode = 0;
    this.isOpen = false;
    this.isFormOpen = false;
  }

  connectedCallback() {
    this.loadSettings();
    this.setupEventListeners();
    this.updateTexts();

    document.addEventListener('language-change', () => {
      this.updateTexts();
    });
  }

  loadSettings() {
    const theme = store.getStorage('theme', 'dark');
    const lang = store.getStorage('lang', 'en');
    const animations = store.getStorage('animations', true);
    const compact = store.getStorage('compact', false);
    const accent = store.getStorage('accent', 'default');
    const vizClass = store.getStorage('visualizerClass', 'geometric');
    const vizMode = store.getStorage('visualizerMode', 0);
    const vizEnabled = store.getStorage('visualizerEnabled', true);
    const vizBars = store.getStorage('visualizerBars', true);
    const iconViz = store.getStorage('iconVisualizer', false);
    const vizOpacity = store.getStorage('vizOpacity', 15);
    const lightningIntensity = store.getStorage('lightningIntensity', 1.0);
    const headerLayout = store.getStorage('headerLayout', 'default');
    const playerStyle = store.getStorage('playerStyle', 'default');
    const centerElements = store.getStorage('centerElements', false);
    const toastPosition = store.getStorage('toastPosition', 'top-right');

    this.themeSelect.value = theme;
    this.langSelect.value = lang;
    this.animationsToggle.checked = animations;
    this.compactToggle.checked = compact;
    this.vizToggle.checked = vizEnabled;
    this.vizBarsToggle.checked = vizBars;
    this.iconVizToggle.checked = iconViz;
    this.vizOpacity.value = vizOpacity;
    this.lightningIntensity.value = lightningIntensity;
    this.currentVizClass = vizClass;
    this.currentVizMode = vizMode;
    this.headerLayoutSelect.value = headerLayout;
    this.playerStyleSelect.value = playerStyle;
    this.centerElementsToggle.checked = centerElements;

    this.updateOpacityDisplay();
    this.updateLightningIntensityDisplay();

    this.shadowRoot.querySelectorAll('.accent-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.accent === accent);
    });
     if (accent === 'custom') {
      const saved = store.getStorage('customGradient');
      if (saved && saved.color1 && saved.color2 && saved.color3) {
        document.documentElement.style.setProperty('--accent1', saved.color1);
        document.documentElement.style.setProperty('--accent2', saved.color2);
        document.documentElement.style.setProperty('--accent3', saved.color3);
      }
    }
 const gradientCreatorBtn = this.shadowRoot.getElementById('gradient-creator-btn');
    if (gradientCreatorBtn) {
      gradientCreatorBtn.addEventListener('click', () => {
        const panel = document.querySelector('gradient-creator-panel');
        if (panel) {
          panel.open();
        }
      });
    }
    this.shadowRoot.querySelectorAll('.viz-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.class === vizClass);
    });

    this.shadowRoot.querySelectorAll('.toast-position-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.position === toastPosition);
    });

    if (vizClass === 'geometric') {
      this.geometricModes.classList.add('show');
      this.organicModes.classList.remove('show');
    } else {
      this.organicModes.classList.add('show');
      this.geometricModes.classList.remove('show');
    }

    const modeContainer = vizClass === 'geometric' ? this.geometricModes : this.organicModes;
    modeContainer.querySelectorAll('.viz-mode').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.mode) === vizMode);
    });

    this.updateLightningSettingsVisibility();
  }

  setupEventListeners() {
    this.overlay.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) {
        this.close();
      }
    });

    this.themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.documentElement.dataset.theme = theme;
      this.shadowRoot.host.dataset.theme = theme;
      store.setStorage('theme', theme);
      showToast(t('messages.themeChanged'), 'success');
    });

    this.langSelect.addEventListener('change', (e) => {
      const lang = e.target.value;
      store.setStorage('lang', lang);
      setLanguage(lang);
      this.updateTexts();
    });

    this.animationsToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      store.setStorage('animations', enabled);
      document.body.classList.toggle('no-animations', !enabled);
    });

    this.compactToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      store.setStorage('compact', enabled);
      document.body.classList.toggle('compact', enabled);
    });

    this.headerLayoutSelect.addEventListener('change', (e) => {
      const layout = e.target.value;
      store.setStorage('headerLayout', layout);
      const header = document.querySelector('.app-header');
      if (header) {
        header.classList.remove('layout-default', 'layout-centered', 'layout-compact', 'layout-spacious');
        header.classList.add(`layout-${layout}`);
        header.setAttribute('data-header-layout', layout);
      }
      document.documentElement.dataset.headerLayout = layout;
      document.dispatchEvent(new CustomEvent('settings-change', {
        detail: { key: 'headerLayout', value: layout }
      }));
      showToast(t('messages.headerLayoutChanged'), 'success');
    });
    this.playerStyleSelect.addEventListener('change', (e) => {
      const style = e.target.value;
      store.setStorage('playerStyle', style);
      const playerBar = document.querySelector('player-bar');
      if (playerBar) {
        playerBar.setAttribute('player-style', style);
      if (style === 'island') {
          console.log('[Island Mode] Activating...', { playerBar });
          store.setStorage('floatingEnabled', true);
          const draggingEnabled = store.getStorage('floatingDraggingEnabled', true);
          const marqueeEnabled = store.getStorage('floatingMarqueeEnabled', true);
          const showIcon = store.getStorage('floatingShowIcon', true);
          const showStationName = store.getStorage('floatingShowStationName', true);
          const showTrackInfo = store.getStorage('floatingShowTrackInfo', true);
          const showVolume = store.getStorage('floatingShowVolume', true);
          const showPlayButton = store.getStorage('floatingShowPlayButton', true);
          const showStepButtons = store.getStorage('floatingShowStepButtons', false);
          const event = new CustomEvent('floating-player-change', {
            detail: {
              enabled: true,
              draggingEnabled,
              marqueeEnabled,
              visibility: {
                showIcon,
                showStationName,
                showTrackInfo,
                showVolume,
                showPlayButton,
                showStepButtons
              }
            }
          });
          console.log('[Island Mode] Dispatching event with settings:', event.detail);
          document.dispatchEvent(event);
          setTimeout(() => {
            console.log('[Island Mode] FloatingPlayerManager:', window.floatingPlayerManager);
            console.log('[Island Mode] PlayerBar classes:', playerBar.className);
            console.log('[Island Mode] PlayerBar styles:', playerBar.style.cssText);
            console.log('[Island Mode] PlayerBar attributes:', {
              'data-show-icon': playerBar.getAttribute('data-show-icon'),
              'data-show-station-name': playerBar.getAttribute('data-show-station-name'),
              'data-show-track-info': playerBar.getAttribute('data-show-track-info'),
              'data-show-volume': playerBar.getAttribute('data-show-volume'),
              'data-show-play-button': playerBar.getAttribute('data-show-play-button'),
              'data-show-step-buttons': playerBar.getAttribute('data-show-step-buttons')
            });
          }, 200);
          showToast(t('messages.islandModeActivated'), 'success');
        } else {
          const wasIsland = store.getStorage('playerStyle') === 'island';
          if (wasIsland) {
            store.setStorage('floatingEnabled', false);
            document.dispatchEvent(new CustomEvent('floating-player-change', {
              detail: { enabled: false }
            }));
          }
          showToast(t('messages.playerStyleChanged'), 'success');
        }
      }
      document.body.dataset.playerStyle = style;
      document.dispatchEvent(new CustomEvent('settings-change', {
        detail: { key: 'playerStyle', value: style }
      }));
    });
    this.floatingPlayerBtn.addEventListener('click', () => {
       const currentStyle = store.getStorage('playerStyle', 'default');
      if (currentStyle !== 'island') {
        showToast(t('messages.islandModeRequired') || 'Please activate Island (Floating) player style first', 'warning');
        return;
      }
      const floatingPanel = document.querySelector('floating-player-panel');
      if (floatingPanel) {
        floatingPanel.open();
      }
    });

    this.centerElementsToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      store.setStorage('centerElements', enabled);
      document.body.classList.toggle('center-elements', enabled);
      showToast(enabled ? t('messages.centeringEnabled') : t('messages.centeringDisabled'), 'success');
    });

    this.vizToggle.addEventListener('change', (e) => {
      store.setStorage('visualizerEnabled', e.target.checked);
      document.dispatchEvent(new CustomEvent('settings-change', {
        detail: { key: 'visualizerEnabled', value: e.target.checked }
      }));
    });

    this.vizBarsToggle.addEventListener('change', (e) => {
      store.setStorage('visualizerBars', e.target.checked);
      document.dispatchEvent(new CustomEvent('settings-change', {
        detail: { key: 'visualizerBars', value: e.target.checked }
      }));
    });

    this.iconVizToggle.addEventListener('change', (e) => {
      store.setStorage('iconVisualizer', e.target.checked);
      document.dispatchEvent(new CustomEvent('settings-change', {
        detail: { key: 'iconVisualizer', value: e.target.checked }
      }));
    });

    this.vizOpacity.addEventListener('input', (e) => {
      const value = e.target.value;
      store.setStorage('vizOpacity', value);
      const canvas = document.getElementById('viz');
      if (canvas) {
        canvas.style.opacity = value / 100;
      }
      this.updateOpacityDisplay();
      this.updateSliderGradient(this.vizOpacity, value, 5, 100);
      document.dispatchEvent(new CustomEvent('settings-change', {
        detail: { key: 'vizOpacity', value: value }
      }));
    });

    this.lightningIntensity.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      store.setStorage('lightningIntensity', value);
      this.updateLightningIntensityDisplay();
      this.updateSliderGradient(this.lightningIntensity, value, 0.5, 3);
      document.dispatchEvent(new CustomEvent('settings-change', {
        detail: { key: 'lightningIntensity', value: value }
      }));
    });

    this.addStationToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleAddStationForm();
    });

    this.addStationBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.addCustomStation();
    });

    this.shadowRoot.querySelectorAll('.accent-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const accent = btn.dataset.accent;
        this.shadowRoot.querySelectorAll('.accent-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
         if (accent !== 'custom') {
          document.documentElement.style.removeProperty('--accent1');
          document.documentElement.style.removeProperty('--accent2');
          document.documentElement.style.removeProperty('--accent3');
        } else {
          const saved = store.getStorage('customGradient');
          if (saved && saved.color1 && saved.color2 && saved.color3) {
            document.documentElement.style.setProperty('--accent1', saved.color1);
            document.documentElement.style.setProperty('--accent2', saved.color2);
            document.documentElement.style.setProperty('--accent3', saved.color3);
          }
        }
        document.documentElement.dataset.accent = accent;
        store.setStorage('accent', accent);
        showToast(t('messages.accentColorChanged'), 'success');
      });
    });

    this.shadowRoot.querySelectorAll('.viz-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const vizClass = tab.dataset.class;
        this.shadowRoot.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentVizClass = vizClass;
        store.setStorage('visualizerClass', vizClass);
        if (vizClass === 'geometric') {
          this.geometricModes.classList.add('show');
          this.organicModes.classList.remove('show');
        } else {
          this.organicModes.classList.add('show');
          this.geometricModes.classList.remove('show');
        }
        this.updateLightningSettingsVisibility();
        document.dispatchEvent(new CustomEvent('visualizer-class-change', {
          detail: vizClass
        }));
      });
    });

    this.shadowRoot.querySelectorAll('.viz-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = parseInt(btn.dataset.mode);
        const container = btn.closest('.visualizer-modes');
        container.querySelectorAll('.viz-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentVizMode = mode;
        store.setStorage('visualizerMode', mode);
        this.updateLightningSettingsVisibility();
        document.dispatchEvent(new CustomEvent('visualizer-mode-change', {
          detail: mode
        }));
        const modeName = btn.querySelector('span').textContent;
        showToast(t('messages.visualizationPrefix') + modeName, 'success');
      });
    });

    this.shadowRoot.querySelectorAll('.lightning-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('.lightning-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        store.setStorage('lightningType', type);
        showToast(t('messages.lightningTypePrefix') + btn.textContent, 'success');
      });
    });

    this.shadowRoot.querySelectorAll('.toast-position-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const position = btn.dataset.position;
        this.shadowRoot.querySelectorAll('.toast-position-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        store.setStorage('toastPosition', position);
        document.dispatchEvent(new CustomEvent('toast-position-change', {
          detail: position
        }));
        showToast(t('messages.toastPositionChanged'), 'success');
      });
    });
      const feedbackLink = this.shadowRoot.getElementById('feedback-link');
    const donateLink = this.shadowRoot.getElementById('donate-link');
    if (feedbackLink) {
      feedbackLink.addEventListener('click', (e) => {
        showToast(t('messages.openingEmailClient'), 'info');
      });
    }
    if (donateLink) {
      donateLink.addEventListener('click', (e) => {
        showToast(t('messages.openingEmailClient'), 'info');
      });
    }
    document.addEventListener('accent-changed', (e) => {
  if (e.detail === 'custom') {
    this.shadowRoot.querySelectorAll('.accent-btn').forEach(b => b.classList.remove('active'));
    const customBtn = this.shadowRoot.querySelector('.accent-btn[data-accent="custom"]');
    if (customBtn) {
      customBtn.classList.add('active');
    }
  }
});
  }


  updateOpacityDisplay() {
    const value = this.vizOpacity.value;
    this.opacityValue.textContent = `${value}%`;
    this.updateSliderGradient(this.vizOpacity, value, 5, 100);
  }

  updateLightningIntensityDisplay() {
    const value = this.lightningIntensity.value;
    this.lightningIntensityValue.textContent = `${parseFloat(value).toFixed(1)}x`;
    this.updateSliderGradient(this.lightningIntensity, value, 0.5, 3);
  }

  updateSliderGradient(slider, value, min, max) {
    const percentage = ((value - min) / (max - min)) * 100;
    const gradient = `linear-gradient(to right, var(--accent1) 0%, var(--accent1) ${percentage}%, var(--surface-hover) ${percentage}%, var(--surface-hover) 100%)`;
    slider.style.background = gradient;
  }

  updateLightningSettingsVisibility() {
    const isOrganic = this.currentVizClass === 'organic';
    const isLightningMode = this.currentVizMode === 5;
    const shouldShow = isOrganic && isLightningMode;

    this.lightningSettings.classList.toggle('show', shouldShow);
  }

  toggleAddStationForm() {
    this.isFormOpen = !this.isFormOpen;
    this.addStationForm.classList.toggle('show', this.isFormOpen);
    this.addStationToggle.classList.toggle('active', this.isFormOpen);

    if (this.isFormOpen) {
      setTimeout(() => {
        this.shadowRoot.getElementById('station-name').focus();
      }, 300);
    }
  }

  updateTexts() {
    this.shadowRoot.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = t(key);

      if (element.tagName === 'INPUT' && element.placeholder) {
        element.placeholder = text;
      } else {
        element.textContent = text;
      }
    });
  }

  addCustomStation() {
    const name = this.shadowRoot.getElementById('station-name').value.trim();
    const url = this.shadowRoot.getElementById('station-url').value.trim();
    const tags = this.shadowRoot.getElementById('station-tags').value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    if (!name || !url) {
      showToast(t('settings.requiredFields'), 'error');
      return;
    }

    const customStations = store.getStorage('customStations', []);
    const newStation = {
      id: 1000 + customStations.length,
      name,
      url,
      tags: tags.length ? tags : ['Custom'],
      icon: 'Icons/custom.png',
      trackInfo: 'unknown',
      custom: true
    };

    customStations.push(newStation);
    store.setStorage('customStations', customStations);
    store.stations.push(newStation);

    showToast(t('messages.stationAdded') + ` "${name}"`, 'success');

    this.shadowRoot.getElementById('station-name').value = '';
    this.shadowRoot.getElementById('station-url').value = '';
    this.shadowRoot.getElementById('station-tags').value = '';

    this.toggleAddStationForm();
    store.emit('stations-update');
  }

  open() {
    if (this.isOpen) return;
    if (window.burgerMenu && window.burgerMenu.isOpen) {
      window.burgerMenu.close();
    }
    this.setAttribute('open', '');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    this.shadowRoot.querySelectorAll('.section').forEach(section => {
      section.style.animation = 'none';
      section.offsetHeight;
      section.style.animation = '';
    });
  }

  close() {
    if (!this.isOpen) return;

    this.removeAttribute('open');
    this.isOpen = false;

    setTimeout(() => {
      document.body.style.overflow = '';
    }, 400);
  }
}

customElements.define('settings-panel', SettingsPanel);