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

    grid-template-columns: 1fr 1fr;

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

    gap: 0.3rem;

    align-items: center;
    position: relative;

  }

  .remove-color-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: var(--accent2);
    color: #000;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: bold;
    line-height: 1;
    transition: var(--transition);
    flex-shrink: 0;
  }

  .remove-color-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(241, 91, 181, 0.4);
  }

  .style-select {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--bg-gradient-start);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 0.95rem;
    cursor: pointer;
    transition: var(--transition);
  }

  .style-select:hover {
    border-color: var(--accent1);
    background: var(--surface-hover);
  }

  .style-select:focus {
    outline: none;
    border-color: var(--accent1);
    box-shadow: 0 0 0 3px rgba(8, 247, 254, 0.1);
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
      <h3 class="section-title">Gradient Direction</h3>
      <select id="gradient-direction" class="style-select">
        <option value="135deg">Diagonal (↘)</option>
        <option value="180deg">Vertical (↓)</option>
        <option value="90deg">Horizontal (→)</option>
        <option value="45deg">Diagonal (↗)</option>
      </select>
    </div>

    <div class="section">

      <h3 class="section-title">Colors</h3>

      <div class="color-picker-grid" id="color-picker-grid">

        <div class="color-picker-item" data-color-index="0">

          <div class="color-picker-label">Color 1</div>

          <div class="color-input-wrapper">

            <input type="color" class="color-picker" value="#08f7fe">

            <input type="text" class="color-text" value="#08f7fe" maxlength="7">
            <button class="remove-color-btn" style="display:none;">×</button>

          </div>

        </div>

        <div class="color-picker-item" data-color-index="1">

          <div class="color-picker-label">Color 2</div>

          <div class="color-input-wrapper">

            <input type="color" class="color-picker" value="#f15bb5">

            <input type="text" class="color-text" value="#f15bb5" maxlength="7">
            <button class="remove-color-btn" style="display:none;">×</button>

          </div>

        </div>

        <div class="color-picker-item" data-color-index="2">

          <div class="color-picker-label">Color 3</div>

          <div class="color-input-wrapper">

            <input type="color" class="color-picker" value="#ffea00">

            <input type="text" class="color-text" value="#ffea00" maxlength="7">
            <button class="remove-color-btn">×</button>

          </div>

        </div>

      </div>
      <button class="btn btn-secondary" id="add-color-btn" style="margin-top: 1rem; width: 100%;">+ Add Color</button>

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
    this.colorPickerGrid = this.shadowRoot.getElementById('color-picker-grid');
    this.addColorBtn = this.shadowRoot.getElementById('add-color-btn');
    this.gradientDirection = this.shadowRoot.getElementById('gradient-direction');



    this.resetBtn = this.shadowRoot.getElementById('reset-btn');

    this.applyBtn = this.shadowRoot.getElementById('apply-btn');



    this.isOpen = false;

    this.colors = ['#08f7fe', '#f15bb5', '#ffea00'];
    this.direction = '135deg';

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

    // Direction selector
    this.gradientDirection.addEventListener('change', (e) => {
      this.direction = e.target.value;
      this.updatePreview();
    });

    // Add color button
    this.addColorBtn.addEventListener('click', () => this.addColor());

    // Setup color pickers
    this.setupColorPickers();

    // Preset buttons

    this.shadowRoot.querySelectorAll('.preset-btn').forEach(btn => {

      btn.addEventListener('click', () => {

        const colors = btn.dataset.colors.split(',');
        this.colors = colors;
        this.renderColorPickers();

        this.shadowRoot.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

        btn.classList.add('active');
        this.updatePreview();

      });

    });



    // Action buttons

    this.resetBtn.addEventListener('click', () => this.reset());

    this.applyBtn.addEventListener('click', () => this.applyGradient());

  }

  setupColorPickers() {
    const items = this.colorPickerGrid.querySelectorAll('.color-picker-item');
    items.forEach((item, index) => {
      const picker = item.querySelector('.color-picker');
      const text = item.querySelector('.color-text');
      const removeBtn = item.querySelector('.remove-color-btn');

      picker.addEventListener('input', (e) => {
        text.value = e.target.value;
        this.colors[index] = e.target.value;
        this.updatePreview();
      });

      text.addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
          picker.value = value;
          this.colors[index] = value;
          this.updatePreview();
        }
      });

      if (removeBtn) {
        removeBtn.addEventListener('click', () => this.removeColor(index));
      }
    });
  }

  addColor() {
    if (this.colors.length >= 6) {
      showToast('Maximum 6 colors allowed', 'warning');
      return;
    }
    this.colors.push('#ffffff');
    this.renderColorPickers();
  }

  removeColor(index) {
    if (this.colors.length <= 1) {
      showToast('At least 1 color required', 'warning');
      return;
    }
    this.colors.splice(index, 1);
    this.renderColorPickers();
  }

  renderColorPickers() {
    this.colorPickerGrid.innerHTML = this.colors.map((color, index) => `
      <div class="color-picker-item" data-color-index="${index}">
        <div class="color-picker-label">Color ${index + 1}</div>
        <div class="color-input-wrapper">
          <input type="color" class="color-picker" value="${color}">
          <input type="text" class="color-text" value="${color}" maxlength="7">
          <button class="remove-color-btn" style="${this.colors.length <= 1 ? 'display:none;' : ''}">×</button>
        </div>
      </div>
    `).join('');
    this.setupColorPickers();
    this.updatePreview();
  }

 

  updatePreview() {
    const gradientString = `linear-gradient(${this.direction}, ${this.colors.join(', ')})`;
    this.gradientPreview.style.background = gradientString;

    // Update CSS variables for first 3 colors (for backwards compatibility)
    if (this.colors[0]) this.panel.style.setProperty('--preview-color1', this.colors[0]);
    if (this.colors[1]) this.panel.style.setProperty('--preview-color2', this.colors[1]);
    if (this.colors[2]) this.panel.style.setProperty('--preview-color3', this.colors[2]);
  }

  reset() {
    this.colors = ['#08f7fe', '#f15bb5', '#ffea00'];
    this.direction = '135deg';
    this.gradientDirection.value = '135deg';
    this.renderColorPickers();
    showToast('Gradient reset to default', 'info');
  }

  applyGradient() {
    // Save to localStorage
    const gradient = {
      colors: this.colors,
      direction: this.direction,
      id: `custom-${Date.now()}`,
      timestamp: Date.now()
    };

    store.setStorage('customGradient', gradient);

    // Add to custom gradients palette
    const customGradients = store.getStorage('customGradients', []);
    // Check if similar gradient already exists
    const exists = customGradients.some(g =>
      JSON.stringify(g.colors) === JSON.stringify(gradient.colors) &&
      g.direction === gradient.direction
    );

    if (!exists) {
      customGradients.push(gradient);
      // Keep only last 10 custom gradients
      if (customGradients.length > 10) {
        customGradients.shift();
      }
      store.setStorage('customGradients', customGradients);

      // Notify settings panel to update
      document.dispatchEvent(new CustomEvent('custom-gradients-updated'));
    }

    // Apply first 3 colors as CSS variables (for backwards compatibility)
    if (this.colors[0]) document.documentElement.style.setProperty('--accent1', this.colors[0]);
    if (this.colors[1]) document.documentElement.style.setProperty('--accent2', this.colors[1]);
    if (this.colors[2]) document.documentElement.style.setProperty('--accent3', this.colors[2]);

    document.documentElement.dataset.accent = 'custom';
    document.dispatchEvent(new CustomEvent('accent-changed', { detail: 'custom' }));
    showToast('🎨 Custom gradient applied and added to palette!', 'success');
    this.close();
  }

  loadSavedGradient() {
    const saved = store.getStorage('customGradient');
    if (saved) {
      if (saved.colors && Array.isArray(saved.colors)) {
        this.colors = saved.colors;
        this.direction = saved.direction || '135deg';
        this.gradientDirection.value = this.direction;
      } else if (saved.color1 && saved.color2 && saved.color3) {
        // Old format compatibility
        this.colors = [saved.color1, saved.color2, saved.color3];
      }
      this.renderColorPickers();
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