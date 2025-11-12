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

  }

 

  :host([open]) .overlay {

    background: rgba(0, 0, 0, 0.7);

    backdrop-filter: blur(8px);

    -webkit-backdrop-filter: blur(8px);

    opacity: 1;

  }

 

  .panel {

    position: absolute;

    top: 50%;

    left: 50%;

    transform: translate(-50%, -50%) scale(0.9);

    width: 90%;

    max-width: 600px;

    max-height: 85vh;

    background: var(--surface);

    border-radius: var(--radius-lg);

    border: 1px solid var(--border);

    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

    opacity: 0;

    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

    overflow: hidden;

    display: flex;

    flex-direction: column;

  }

 

  :host([open]) .panel {

    opacity: 1;

    transform: translate(-50%, -50%) scale(1);

  }

 

  .panel-header {

    padding: 1.5rem;

    border-bottom: 1px solid var(--border);

    display: flex;

    align-items: center;

    justify-content: space-between;

    background: var(--bg-gradient-start);

  }

 

  .title {

    font-size: 1.5rem;

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

 

  .content {

    padding: 1.5rem;

    overflow-y: auto;

    flex: 1;

  }

 

  .content::-webkit-scrollbar {

    width: 8px;

  }

 

  .content::-webkit-scrollbar-track {

    background: transparent;

  }

 

  .content::-webkit-scrollbar-thumb {

    background: var(--border);

    border-radius: 3px;

  }

 

  .section {

    margin-bottom: 2rem;

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

 

  .preview-section {

    background: var(--bg-gradient-start);

    border-radius: var(--radius);

    padding: 2rem;

    text-align: center;

    border: 1px solid var(--border);

    margin-bottom: 1.5rem;

  }

 

  .gradient-preview {

    width: 100%;

    height: 150px;

    border-radius: var(--radius);

    background: linear-gradient(135deg, var(--preview-color1, #08f7fe), var(--preview-color2, #f15bb5), var(--preview-color3, #ffea00));

    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

    margin-bottom: 1rem;

    transition: all 0.3s ease;

  }

 

  .color-picker-grid {

    display: grid;

    grid-template-columns: 1fr 1fr 1fr;

    gap: 1rem;

  }

 

  .color-picker-item {

    display: flex;

    flex-direction: column;

    gap: 0.5rem;

  }

 

  .color-picker-label {

    font-size: 0.875rem;

    font-weight: 600;

    color: var(--text-secondary);

  }

 

  .color-input-wrapper {

    display: flex;

    gap: 0.5rem;

    align-items: center;

  }

 

  input[type="color"] {

    width: 60px;

    height: 40px;

    border: 1px solid var(--border);

    border-radius: var(--radius-sm);

    cursor: pointer;

    background: var(--surface);

    transition: var(--transition);

  }

 

  input[type="color"]:hover {

    border-color: var(--accent1);

  }

 

  input[type="text"] {

    flex: 1;

    padding: 0.5rem 0.75rem;

    background: var(--bg-gradient-start);

    border: 1px solid var(--border);

    border-radius: var(--radius-sm);

    color: var(--text-primary);

    font-size: 0.875rem;

    font-family: 'Courier New', monospace;

    transition: var(--transition);

  }

 

  input[type="text"]:focus {

    outline: none;

    border-color: var(--accent1);

    box-shadow: 0 0 0 3px rgba(8, 247, 254, 0.1);

  }

 

  .action-buttons {

    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 1rem;

    margin-top: 1.5rem;

  }

 

  .btn {

    padding: 0.75rem 1.5rem;

    border: none;

    border-radius: var(--radius);

    font-weight: 600;

    cursor: pointer;

    transition: var(--transition);

    font-size: 1rem;

  }

 

  .btn-primary {

    background: linear-gradient(135deg, var(--accent1), var(--accent2));

    color: #000;

  }

 

  .btn-primary:hover {

    transform: translateY(-2px);

    box-shadow: 0 4px 12px rgba(8, 247, 254, 0.4);

  }

 

  .btn-secondary {

    background: var(--surface);

    border: 1px solid var(--border);

    color: var(--text-primary);

  }

 

  .btn-secondary:hover {

    background: var(--surface-hover);

    border-color: var(--accent1);

  }

 

  .preset-grid {

    display: grid;

    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));

    gap: 0.75rem;

  }

 

  .preset-btn {

    aspect-ratio: 3/2;

    border: 2px solid var(--border);

    border-radius: var(--radius-sm);

    cursor: pointer;

    transition: var(--transition);

    position: relative;

    overflow: hidden;

  }

 

  .preset-btn:hover {

    border-color: var(--accent1);

    transform: scale(1.05);

  }

 

  .preset-btn.active {

    border-color: var(--accent1);

    box-shadow: 0 0 0 3px rgba(8, 247, 254, 0.2);

  }

</style>

 

<div class="overlay" id="overlay"></div>

<div class="panel" id="panel">

  <div class="panel-header">

    <h2 class="title">🎨 Gradient Creator</h2>

    <button class="close-btn" id="close-btn">

      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">

        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>

      </svg>

    </button>

  </div>

 

  <div class="content">

    <div class="preview-section">

      <div class="gradient-preview" id="gradient-preview"></div>

    </div>

 

    <div class="section">

      <h3 class="section-title">Colors</h3>

      <div class="color-picker-grid">

        <div class="color-picker-item">

          <div class="color-picker-label">Accent 1</div>

          <div class="color-input-wrapper">

            <input type="color" id="color1" value="#08f7fe">

            <input type="text" id="color1-text" value="#08f7fe" maxlength="7">

          </div>

        </div>

        <div class="color-picker-item">

          <div class="color-picker-label">Accent 2</div>

          <div class="color-input-wrapper">

            <input type="color" id="color2" value="#f15bb5">

            <input type="text" id="color2-text" value="#f15bb5" maxlength="7">

          </div>

        </div>

        <div class="color-picker-item">

          <div class="color-picker-label">Accent 3</div>

          <div class="color-input-wrapper">

            <input type="color" id="color3" value="#ffea00">

            <input type="text" id="color3-text" value="#ffea00" maxlength="7">

          </div>

        </div>

      </div>

    </div>

 

    <div class="section">

      <h3 class="section-title">Presets</h3>

      <div class="preset-grid">

        <button class="preset-btn" data-colors="#08f7fe,#f15bb5,#ffea00" style="background: linear-gradient(135deg, #08f7fe, #f15bb5, #ffea00)"></button>

        <button class="preset-btn" data-colors="#a855f7,#ec4899,#8b5cf6" style="background: linear-gradient(135deg, #a855f7, #ec4899, #8b5cf6)"></button>

        <button class="preset-btn" data-colors="#f97316,#fb923c,#fdba74" style="background: linear-gradient(135deg, #f97316, #fb923c, #fdba74)"></button>

        <button class="preset-btn" data-colors="#14b8a6,#06b6d4,#22d3ee" style="background: linear-gradient(135deg, #14b8a6, #06b6d4, #22d3ee)"></button>

        <button class="preset-btn" data-colors="#00ff88,#ff00ff,#00ffff" style="background: linear-gradient(135deg, #00ff88, #ff00ff, #00ffff)"></button>

        <button class="preset-btn" data-colors="#3b82f6,#8b5cf6,#06b6d4" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)"></button>

      </div>

    </div>

 

    <div class="action-buttons">

      <button class="btn btn-secondary" id="reset-btn">Reset</button>

      <button class="btn btn-primary" id="apply-btn">Apply Gradient</button>

    </div>

  </div>

</div>

`;

 

export class GradientCreatorPanel extends HTMLElement {

  constructor() {

    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.appendChild(template.content.cloneNode(true));

 

    this.overlay = this.shadowRoot.getElementById('overlay');

    this.closeBtn = this.shadowRoot.getElementById('close-btn');

    this.panel = this.shadowRoot.getElementById('panel');

    this.gradientPreview = this.shadowRoot.getElementById('gradient-preview');

 

    this.color1 = this.shadowRoot.getElementById('color1');

    this.color2 = this.shadowRoot.getElementById('color2');

    this.color3 = this.shadowRoot.getElementById('color3');

    this.color1Text = this.shadowRoot.getElementById('color1-text');

    this.color2Text = this.shadowRoot.getElementById('color2-text');

    this.color3Text = this.shadowRoot.getElementById('color3-text');

 

    this.resetBtn = this.shadowRoot.getElementById('reset-btn');

    this.applyBtn = this.shadowRoot.getElementById('apply-btn');

 

    this.isOpen = false;

    this.currentColors = {

      color1: '#08f7fe',

      color2: '#f15bb5',

      color3: '#ffea00'

    };

  }

 

  connectedCallback() {

    this.setupEventListeners();

    this.loadSavedGradient();

  }

 

  setupEventListeners() {

    this.overlay.addEventListener('click', () => this.close());

    this.closeBtn.addEventListener('click', () => this.close());

 

    document.addEventListener('keydown', (e) => {

      if (e.key === 'Escape' && this.hasAttribute('open')) {

        this.close();

      }

    });

 

    // Color picker sync

    [

      { picker: this.color1, text: this.color1Text, key: 'color1' },

      { picker: this.color2, text: this.color2Text, key: 'color2' },

      { picker: this.color3, text: this.color3Text, key: 'color3' }

    ].forEach(({ picker, text, key }) => {

      picker.addEventListener('input', (e) => {

        text.value = e.target.value;

        this.currentColors[key] = e.target.value;

        this.updatePreview();

      });

 

      text.addEventListener('input', (e) => {

        const value = e.target.value;

        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {

          picker.value = value;

          this.currentColors[key] = value;

          this.updatePreview();

        }

      });

    });

 

    // Preset buttons

    this.shadowRoot.querySelectorAll('.preset-btn').forEach(btn => {

      btn.addEventListener('click', () => {

        const colors = btn.dataset.colors.split(',');

        this.setColors(colors[0], colors[1], colors[2]);

        this.shadowRoot.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

        btn.classList.add('active');

      });

    });

 

    // Action buttons

    this.resetBtn.addEventListener('click', () => this.reset());

    this.applyBtn.addEventListener('click', () => this.applyGradient());

  }

 

  setColors(c1, c2, c3) {

    this.color1.value = c1;

    this.color2.value = c2;

    this.color3.value = c3;

    this.color1Text.value = c1;

    this.color2Text.value = c2;

    this.color3Text.value = c3;

    this.currentColors = { color1: c1, color2: c2, color3: c3 };

    this.updatePreview();

  }

 

  updatePreview() {

    const { color1, color2, color3 } = this.currentColors;

    this.gradientPreview.style.background = `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`;

    this.panel.style.setProperty('--preview-color1', color1);

    this.panel.style.setProperty('--preview-color2', color2);

    this.panel.style.setProperty('--preview-color3', color3);

  }

 

  reset() {

    this.setColors('#08f7fe', '#f15bb5', '#ffea00');

    showToast('Gradient reset to default', 'info');

  }

 

  applyGradient() {

    const { color1, color2, color3 } = this.currentColors;

 

    // Save to localStorage

    store.setStorage('customGradient', { color1, color2, color3 });
    document.documentElement.style.setProperty('--accent1', color1);
    document.documentElement.style.setProperty('--accent2', color2);
    document.documentElement.style.setProperty('--accent3', color3);
    document.documentElement.dataset.accent = 'custom';
    document.dispatchEvent(new CustomEvent('accent-changed', { detail: 'custom' }));
    showToast('🎨 Custom gradient applied!', 'success');
    this.close();

  }

 

  loadSavedGradient() {

    const saved = store.getStorage('customGradient');

    if (saved && saved.color1 && saved.color2 && saved.color3) {

      this.setColors(saved.color1, saved.color2, saved.color3);

    }

  }

 

  open() {

    if (this.isOpen) return;

    this.setAttribute('open', '');

    this.isOpen = true;

    document.body.style.overflow = 'hidden';

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

 

customElements.define('gradient-creator-panel', GradientCreatorPanel);