import { store } from '../core/store.js';

import { showToast } from '../utils/toast.js';

import { t } from '../utils/i18n.js';



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

 

.position-grid {

  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 0.5rem;

  margin-top: 1rem;

}

 

.position-btn {

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

 

.position-btn:hover {

  background: var(--surface-hover);

  border-color: var(--border-hover);

  color: var(--text-primary);

}

 

.position-btn.active {

  background: var(--accent1);

  color: #000;

  border-color: var(--accent1);

}

 

.visibility-grid {

  display: grid;

  grid-template-columns: 1fr;

  gap: 0.75rem;

  margin-top: 1rem;

}

 

.visibility-item {

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 0.75rem 1rem;

  background: var(--surface);

  border: 1px solid var(--border);

  border-radius: var(--radius-sm);

  transition: all 0.2s ease;

}

 

.visibility-item:hover {

  border-color: var(--border-hover);

  background: var(--surface-hover);

}

 

.visibility-label {

  font-size: 0.9rem;

  color: var(--text-primary);

  display: flex;

  align-items: center;

  gap: 0.5rem;

}

 

.visibility-label svg {

  width: 20px;

  height: 20px;

  color: var(--accent1);

}

 

.info-box {

  background: var(--surface);

  border: 1px solid var(--border);

  border-radius: var(--radius-sm);

  padding: 1rem;

  margin-top: 1rem;

  display: flex;

  align-items: start;

  gap: 0.75rem;

}

 

.info-box svg {

  width: 20px;

  height: 20px;

  color: var(--accent1);

  flex-shrink: 0;

  margin-top: 2px;

}

 

.info-box-text {

  font-size: 0.85rem;

  color: var(--text-secondary);

  line-height: 1.5;

}

 

.action-button {

  width: 100%;

  padding: 1rem 1.5rem;

  background: var(--accent1);

  border: none;

  border-radius: var(--radius-sm);

  color: #000;

  font-size: 0.95rem;

  font-weight: 600;

  cursor: pointer;

  transition: all 0.3s ease;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 0.5rem;

}

 

.action-button:hover {

  background: var(--accent2);

  transform: translateY(-2px);

  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent1) 40%, transparent);

}

 

.action-button:disabled {

  opacity: 0.5;

  cursor: not-allowed;

  transform: none;

}

 

.action-button svg {

  width: 20px;

  height: 20px;

}

 

.disabled-overlay {

  position: relative;

  opacity: 0.5;

  pointer-events: none;

}

 

@media (max-width: 480px) {

  .panel {

    width: 100%;

  }

}

</style>

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
}

.setting-group .setting-row {
  border-bottom: 1px solid var(--border);
}

.setting-group .setting-row:last-child {
  border-bottom: none;
}

.sub-setting {
  background: rgba(0, 0, 0, 0.2);
  padding-left: 2.5rem !important;
  position: relative;
}

.sub-setting::before {
  content: '';
  position: absolute;
  left: 1.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent1);
  opacity: 0.3;
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 120px;
}

.styled-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, var(--accent1) 0%, var(--accent1) 40%, var(--border) 40%, var(--border) 100%);
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.styled-slider:hover {
  box-shadow: 0 0 8px rgba(8, 247, 254, 0.4);
}

.styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent1);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(8, 247, 254, 0.5);
  transition: all 0.2s ease;
}

.styled-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(8, 247, 254, 0.7);
}

.styled-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent1);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(8, 247, 254, 0.5);
  transition: all 0.2s ease;
}

.styled-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(8, 247, 254, 0.7);
}

.slider-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent1);
  min-width: 45px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}


 

<div class="overlay" id="overlay"></div>

<div class="panel" id="panel">

  <div class="header">

    <h2 class="title">

      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">

        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>

      </svg>

      <span data-i18n="floatingPlayer.title">Floating Player</span>

    </h2>

    <button class="close-btn" id="close-btn" aria-label="Close">

      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

        <path d="M18 6L6 18M6 6l12 12"/>

      </svg>

    </button>

  </div>

 

  <div class="content">

    <div class="section">

      <h3 class="section-title" data-i18n="floatingPlayer.mainSettings">Main Settings</h3>

 

      <div class="setting-row">

        <div class="setting-info">

          <div class="setting-label" data-i18n="floatingPlayer.enableFloating">Enable Floating Mode</div>

          <div class="setting-description" data-i18n="floatingPlayer.enableFloatingDesc">Make the player float above all content</div>

        </div>

        <div class="toggle-container">

          <label class="toggle">

            <input type="checkbox" id="floating-enabled">

            <span class="toggle-slider"></span>

          </label>

        </div>

      </div>

 

      <div id="floating-options" class="disabled-overlay">

        <div class="setting-row">

          <div class="setting-info">

            <div class="setting-label" data-i18n="floatingPlayer.enableDragging">Enable Dragging</div>

            <div class="setting-description" data-i18n="floatingPlayer.enableDraggingDesc">Allow moving the player by dragging (may consume resources)</div>

          </div>

          <div class="toggle-container">

            <label class="toggle">

              <input type="checkbox" id="dragging-enabled">

              <span class="toggle-slider"></span>

            </label>

          </div>

        </div>

        <div class="setting-group">
          <div class="setting-row">

            <div class="setting-info">

              <div class="setting-label" data-i18n="floatingPlayer.enableMarquee">Scrolling Text</div>

              <div class="setting-description" data-i18n="floatingPlayer.enableMarqueeDesc">Auto-scroll long track names</div>

            </div>

            <div class="toggle-container">

              <label class="toggle">

                <input type="checkbox" id="marquee-enabled" checked>

                <span class="toggle-slider"></span>

              </label>

            </div>

          </div>

          <div class="setting-row sub-setting">
            <div class="setting-info">
              <div class="setting-label" data-i18n="floatingPlayer.playerWidth">Player Width</div>
              <div class="setting-description" data-i18n="floatingPlayer.playerWidthDesc">Adjust the width of floating player panel</div>
            </div>
            <div class="slider-control">
              <input type="range" class="styled-slider" id="player-width-slider" min="30" max="90" value="50" step="5">
              <span class="slider-value" id="player-width-value">50%</span>
            </div>
          </div>
        </div>

      </div>

    </div>

 

    <div class="section" id="position-section" style="display: none;">

      <h3 class="section-title" data-i18n="floatingPlayer.position">Position</h3>

 

      <div class="info-box">

        <svg viewBox="0 0 24 24" fill="currentColor">

          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>

        </svg>

        <div class="info-box-text" data-i18n="floatingPlayer.positionHint">Choose initial position for the floating player</div>

      </div>

 

      <div class="position-grid">

        <button class="position-btn" data-position="top-left" data-i18n="floatingPlayer.positions.topLeft">Top Left</button>

        <button class="position-btn" data-position="top" data-i18n="floatingPlayer.positions.top">Top</button>

        <button class="position-btn" data-position="top-right" data-i18n="floatingPlayer.positions.topRight">Top Right</button>

        <button class="position-btn" data-position="left" data-i18n="floatingPlayer.positions.left">Left</button>

        <button class="position-btn active" data-position="center" data-i18n="floatingPlayer.positions.center">Center</button>

        <button class="position-btn" data-position="right" data-i18n="floatingPlayer.positions.right">Right</button>

        <button class="position-btn" data-position="bottom-left" data-i18n="floatingPlayer.positions.bottomLeft">Bottom Left</button>

        <button class="position-btn" data-position="bottom" data-i18n="floatingPlayer.positions.bottom">Bottom</button>

        <button class="position-btn" data-position="bottom-right" data-i18n="floatingPlayer.positions.bottomRight">Bottom Right</button>

      </div>

    </div>

 

    <div class="section" id="visibility-section" style="display: none;">

      <h3 class="section-title" data-i18n="floatingPlayer.visibility">Element Visibility</h3>

 

      <div class="visibility-grid">

        <div class="visibility-item">

          <div class="visibility-label">

            <svg viewBox="0 0 24 24" fill="currentColor">

              <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>

            </svg>

            <span data-i18n="floatingPlayer.showIcon">Station Icon</span>

          </div>

          <div class="toggle-container">

            <label class="toggle">

              <input type="checkbox" id="show-icon" checked>

              <span class="toggle-slider"></span>

            </label>

          </div>

        </div>

 

        <div class="visibility-item">

          <div class="visibility-label">

            <svg viewBox="0 0 24 24" fill="currentColor">

              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>

            </svg>

            <span data-i18n="floatingPlayer.showStationName">Station Name</span>

          </div>

          <div class="toggle-container">

            <label class="toggle">

              <input type="checkbox" id="show-station-name" checked>

              <span class="toggle-slider"></span>

            </label>

          </div>

        </div>

 

        <div class="visibility-item">

          <div class="visibility-label">

            <svg viewBox="0 0 24 24" fill="currentColor">

              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>

            </svg>

            <span data-i18n="floatingPlayer.showTrackInfo">Track Info</span>

          </div>

          <div class="toggle-container">

            <label class="toggle">

              <input type="checkbox" id="show-track-info" checked>

              <span class="toggle-slider"></span>

            </label>

          </div>

        </div>

 

        <div class="visibility-item">

          <div class="visibility-label">

            <svg viewBox="0 0 24 24" fill="currentColor">

              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>

            </svg>

            <span data-i18n="floatingPlayer.showVolume">Volume Control</span>

          </div>

          <div class="toggle-container">

            <label class="toggle">

              <input type="checkbox" id="show-volume" checked>

              <span class="toggle-slider"></span>

            </label>

          </div>

        </div>

 

        <div class="visibility-item">

          <div class="visibility-label">

            <svg viewBox="0 0 24 24" fill="currentColor">

              <path d="M8 5v14l11-7z"/>

            </svg>

            <span data-i18n="floatingPlayer.showPlayButton">Play Button</span>

          </div>

          <div class="toggle-container">

            <label class="toggle">

              <input type="checkbox" id="show-play-button" checked>

              <span class="toggle-slider"></span>

            </label>

          </div>

        </div>

 

        <div class="visibility-item">

          <div class="visibility-label">

            <svg viewBox="0 0 24 24" fill="currentColor">

              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>

            </svg>

            <span data-i18n="floatingPlayer.showStepButtons">Previous/Next Buttons</span>

          </div>

          <div class="toggle-container">

            <label class="toggle">

              <input type="checkbox" id="show-step-buttons">

              <span class="toggle-slider"></span>

            </label>

          </div>

        </div>

      </div>

    </div>

 

    <div class="section">

      <button class="action-button" id="apply-btn">

        <svg viewBox="0 0 24 24" fill="currentColor">

          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>

        </svg>

        <span data-i18n="floatingPlayer.apply">Apply Settings</span>

      </button>

    </div>

  </div>

</div>

`;



export class FloatingPlayerPanel extends HTMLElement {

  constructor() {

    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(template.content.cloneNode(true));



    this.overlay = this.shadowRoot.getElementById('overlay');

    this.closeBtn = this.shadowRoot.getElementById('close-btn');

    this.floatingEnabled = this.shadowRoot.getElementById('floating-enabled');

    this.draggingEnabled = this.shadowRoot.getElementById('dragging-enabled');
    this.playerWidthSlider = this.shadowRoot.getElementById('player-width-slider');
    this.playerWidthValue = this.shadowRoot.getElementById('player-width-value');
    this.marqueeEnabled = this.shadowRoot.getElementById('marquee-enabled');

    this.floatingOptions = this.shadowRoot.getElementById('floating-options');

    this.positionSection = this.shadowRoot.getElementById('position-section');

    this.visibilitySection = this.shadowRoot.getElementById('visibility-section');

    this.applyBtn = this.shadowRoot.getElementById('apply-btn');



    this.showIcon = this.shadowRoot.getElementById('show-icon');

    this.showStationName = this.shadowRoot.getElementById('show-station-name');

    this.showTrackInfo = this.shadowRoot.getElementById('show-track-info');

    this.showVolume = this.shadowRoot.getElementById('show-volume');

    this.showPlayButton = this.shadowRoot.getElementById('show-play-button');

    this.showStepButtons = this.shadowRoot.getElementById('show-step-buttons');



    this.isOpen = false;

  }



 connectedCallback() {
  this.loadSettings();
  this.setupEventListeners();

  setTimeout(() => {
    this.updateTexts();
  }, 100);

  document.addEventListener('language-change', () => {
    this.updateTexts();
  });
}




  loadSettings() {

    const floatingEnabled = store.getStorage('floatingEnabled', false);

    const draggingEnabled = store.getStorage('floatingDraggingEnabled', true);

    const marqueeEnabled = store.getStorage('floatingMarqueeEnabled', true);

    const position = store.getStorage('floatingPosition', 'center');
    const playerWidth = store.getStorage('floatingPlayerWidth', 50);

    const showIcon = store.getStorage('floatingShowIcon', true);

    const showStationName = store.getStorage('floatingShowStationName', true);

    const showTrackInfo = store.getStorage('floatingShowTrackInfo', true);

    const showVolume = store.getStorage('floatingShowVolume', true);

    const showPlayButton = store.getStorage('floatingShowPlayButton', true);

    const showStepButtons = store.getStorage('floatingShowStepButtons', false);



    this.floatingEnabled.checked = floatingEnabled;

    this.draggingEnabled.checked = draggingEnabled;

    this.marqueeEnabled.checked = marqueeEnabled;
    this.playerWidthSlider.value = playerWidth;
    this.playerWidthValue.textContent = `${playerWidth}%`;

    const percent = ((playerWidth - 30) / (90 - 30)) * 100;
    this.playerWidthSlider.style.background = `linear-gradient(to right, var(--accent1) 0%, var(--accent1) ${percent}%, var(--border) ${percent}%, var(--border) 100%)`;



    this.showIcon.checked = showIcon;

    this.showStationName.checked = showStationName;

    this.showTrackInfo.checked = showTrackInfo;

    this.showVolume.checked = showVolume;

    this.showPlayButton.checked = showPlayButton;

    this.showStepButtons.checked = showStepButtons;



    this.updateFloatingOptionsState();



    this.shadowRoot.querySelectorAll('.position-btn').forEach(btn => {

      btn.classList.toggle('active', btn.dataset.position === position);

    });

  }



  setupEventListeners() {

    this.overlay.addEventListener('click', () => this.close());

    this.closeBtn.addEventListener('click', () => this.close());



    document.addEventListener('keydown', (e) => {

      if (e.key === 'Escape' && this.hasAttribute('open')) {

        this.close();

      }

    });



    this.floatingEnabled.addEventListener('change', () => {

      this.updateFloatingOptionsState();

    });



    this.shadowRoot.querySelectorAll('.position-btn').forEach(btn => {

      btn.addEventListener('click', () => {

        this.shadowRoot.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));

        btn.classList.add('active');

        store.setStorage('floatingPosition', btn.dataset.position);

      });

    });

    this.playerWidthSlider.addEventListener('input', (e) => {
      const value = e.target.value;
      const percent = ((value - 30) / (90 - 30)) * 100;

      this.playerWidthValue.textContent = `${value}%`;
      e.target.style.background = `linear-gradient(to right, var(--accent1) 0%, var(--accent1) ${percent}%, var(--border) ${percent}%, var(--border) 100%)`;

      store.setStorage('floatingPlayerWidth', parseInt(value));

      // Apply width change immediately
      document.dispatchEvent(new CustomEvent('floating-player-change', {
        detail: {
          enabled: true,
          width: parseInt(value)
        }
      }));
    });

    this.applyBtn.addEventListener('click', () => {

      this.applySettings();

    });

  }



  updateFloatingOptionsState() {

    const isEnabled = this.floatingEnabled.checked;



    if (isEnabled) {

      this.floatingOptions.classList.remove('disabled-overlay');

      this.positionSection.style.display = 'block';

      this.visibilitySection.style.display = 'block';

    } else {

      this.floatingOptions.classList.add('disabled-overlay');

      this.positionSection.style.display = 'none';

      this.visibilitySection.style.display = 'none';

    }

  }



  applySettings() {

    const floatingEnabled = this.floatingEnabled.checked;

    const draggingEnabled = this.draggingEnabled.checked;

    const marqueeEnabled = this.marqueeEnabled.checked;
    const playerWidth = parseInt(this.playerWidthSlider.value);

    const showIcon = this.showIcon.checked;

    const showStationName = this.showStationName.checked;

    const showTrackInfo = this.showTrackInfo.checked;

    const showVolume = this.showVolume.checked;

    const showPlayButton = this.showPlayButton.checked;

    const showStepButtons = this.showStepButtons.checked;



    // Save all settings

    store.setStorage('floatingEnabled', floatingEnabled);

    store.setStorage('floatingDraggingEnabled', draggingEnabled);

    store.setStorage('floatingMarqueeEnabled', marqueeEnabled);
    store.setStorage('floatingPlayerWidth', playerWidth);

    store.setStorage('floatingShowIcon', showIcon);

    store.setStorage('floatingShowStationName', showStationName);

    store.setStorage('floatingShowTrackInfo', showTrackInfo);

    store.setStorage('floatingShowVolume', showVolume);

    store.setStorage('floatingShowPlayButton', showPlayButton);

    store.setStorage('floatingShowStepButtons', showStepButtons);



    // Dispatch events to update the floating player

    document.dispatchEvent(new CustomEvent('floating-player-change', {

      detail: {

        enabled: floatingEnabled,

        draggingEnabled: draggingEnabled,

        marqueeEnabled: marqueeEnabled,
        width: playerWidth,

        visibility: {

          icon: showIcon,

          stationName: showStationName,

          trackInfo: showTrackInfo,

          volume: showVolume,

          playButton: showPlayButton,

          stepButtons: showStepButtons

        }

      }

    }));



    showToast(t('messages.floatingPlayerUpdated'), 'success');

    this.close();

  }



  updateTexts() {

    this.shadowRoot.querySelectorAll('[data-i18n]').forEach(element => {

      const key = element.getAttribute('data-i18n');

      const text = t(key);

      element.textContent = text;

    });

  }



  open() {
    if (this.isOpen) return;
    this.setAttribute('open', '');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
      setTimeout(() => {

      this.updateTexts();

    }, 50);
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



customElements.define('floating-player-panel', FloatingPlayerPanel);