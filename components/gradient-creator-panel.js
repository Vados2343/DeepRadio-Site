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
      background: var(--surface);
    }

    .title {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent1), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
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
      padding: 0;
    }

    .close-btn:hover {
      background: var(--surface-hover);
      color: var(--accent1);
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

    .content::-webkit-scrollbar-thumb:hover {
      background: var(--accent1);
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-primary);
      margin-bottom: 1rem;
      display: block;
    }

    .preview-section {
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      text-align: center;
      border: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }

    .gradient-preview {
      width: 100%;
      height: 150px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, #08f7fe, #f15bb5, #ffea00);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      margin-bottom: 1rem;
      transition: all 0.3s ease;
    }

    .gradient-direction-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .direction-btn {
      padding: 0.75rem 1rem;
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .direction-btn:hover {
      border-color: var(--accent1);
      background: var(--surface-hover);
    }

    .direction-btn.active {
      border-color: var(--accent1);
      background: linear-gradient(135deg, var(--accent1), var(--accent2));
      color: #000;
    }

    .color-picker-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .color-picker-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .color-picker-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .color-input-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .color-input-wrapper input[type="color"] {
      width: 50px;
      height: 40px;
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      flex-shrink: 0;
      transition: var(--transition);
    }

    .color-input-wrapper input[type="color"]:hover {
      border-color: var(--accent1);
      transform: scale(1.05);
    }

    .color-input-wrapper input[type="text"] {
      flex: 1;
      padding: 0.625rem 0.75rem;
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      transition: var(--transition);
    }

    .color-input-wrapper input[type="text"]:focus {
      outline: none;
      border-color: var(--accent1);
      box-shadow: 0 0 0 3px rgba(8, 247, 254, 0.2);
    }

    .color-input-wrapper input[type="text"]::placeholder {
      color: var(--text-muted);
    }

    .remove-color-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: var(--accent2);
      color: #000;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 1.5rem;
      font-weight: bold;
      line-height: 1;
      transition: var(--transition);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .remove-color-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(241, 91, 181, 0.4);
    }

    .add-color-btn {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background: var(--surface);
      border: 2px dashed var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .add-color-btn:hover {
      border-color: var(--accent1);
      background: var(--surface-hover);
      color: var(--accent1);
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
      background-size: 100% 100%;
    }

    .preset-btn:hover {
      border-color: var(--accent1);
      transform: scale(1.05);
    }

    .preset-btn.active {
      border-color: var(--accent1);
      box-shadow: 0 0 0 3px rgba(8, 247, 254, 0.3);
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .btn {
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: var(--transition);
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
      border: 2px solid var(--border);
      color: var(--text-primary);
    }

    .btn-secondary:hover {
      background: var(--surface-hover);
      border-color: var(--accent1);
      color: var(--accent1);
    }

    @media (max-width: 600px) {
      .panel {
        width: 95%;
        max-height: 90vh;
      }

      .content {
        padding: 1rem;
      }

      .panel-header {
        padding: 1rem;
      }

      .title {
        font-size: 1.25rem;
      }

      .color-picker-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .gradient-direction-group {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        grid-template-columns: 1fr;
      }
    }
  </style>

  <div class="overlay" id="overlay"></div>
  <div class="panel" id="panel">
    <div class="panel-header">
      <h2 class="title">🎨 Gradient Creator</h2>
      <button class="close-btn" id="close-btn" title="Close (Esc)">
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
        <label class="section-title">Gradient Direction</label>
        <div class="gradient-direction-group" id="direction-group">
          <button class="direction-btn active" data-direction="135deg" title="Diagonal (↘)">↘ Diagonal</button>
          <button class="direction-btn" data-direction="180deg" title="Vertical (↓)">↓ Vertical</button>
          <button class="direction-btn" data-direction="90deg" title="Horizontal (→)">→ Horizontal</button>
          <button class="direction-btn" data-direction="45deg" title="Diagonal (↗)">↗ Diagonal</button>
        </div>
      </div>

      <div class="section">
        <label class="section-title">Colors</label>
        <div class="color-picker-grid" id="color-picker-grid"></div>
        <button class="add-color-btn" id="add-color-btn">+ Add Color (Max 6)</button>
      </div>

      <div class="section">
        <label class="section-title">Presets</label>
        <div class="preset-grid" id="preset-grid"></div>
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
    this.directionGroup = this.shadowRoot.getElementById('direction-group');
    this.presetGrid = this.shadowRoot.getElementById('preset-grid');
    this.resetBtn = this.shadowRoot.getElementById('reset-btn');
    this.applyBtn = this.shadowRoot.getElementById('apply-btn');

    this.isOpen = false;
    this.colors = ['#08f7fe', '#f15bb5', '#ffea00'];
    this.direction = '135deg';

    this.presets = [
      { name: 'Cyan Pink Yellow', colors: ['#08f7fe', '#f15bb5', '#ffea00'] },
      { name: 'Purple Magenta Cyan', colors: ['#a855f7', '#ec4899', '#06b6d4'] },
      { name: 'Orange Amber Yellow', colors: ['#f97316', '#fb923c', '#fdba74'] },
      { name: 'Teal Cyan Sky', colors: ['#14b8a6', '#06b6d4', '#22d3ee'] },
      { name: 'Green Magenta Cyan', colors: ['#00ff88', '#ff00ff', '#00ffff'] },
      { name: 'Blue Purple Cyan', colors: ['#3b82f6', '#8b5cf6', '#06b6d4'] }
    ];
  }

  connectedCallback() {
    this.setupEventListeners();
    this.loadSavedGradient();
    this.renderPresets();
    this.renderColorPickers();
  }

  setupEventListeners() {
    this.overlay.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) {
        this.close();
      }
    });

    this.directionGroup.addEventListener('click', (e) => {
      if (e.target.classList.contains('direction-btn')) {
        this.shadowRoot.querySelectorAll('.direction-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
        this.direction = e.target.dataset.direction;
        this.updatePreview();
      }
    });

    this.addColorBtn.addEventListener('click', () => this.addColor());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.applyBtn.addEventListener('click', () => this.applyGradient());
  }

  renderColorPickers() {
    this.colorPickerGrid.innerHTML = this.colors.map((color, index) => `
      <div class="color-picker-item" data-color-index="${index}">
        <label class="color-picker-label">Color ${index + 1}</label>
        <div class="color-input-wrapper">
          <input type="color" class="color-picker" value="${color}" data-index="${index}">
          <input type="text" class="color-text" value="${color}" maxlength="7" data-index="${index}" placeholder="#000000">
          <button class="remove-color-btn" data-index="${index}" style="display: ${this.colors.length <= 1 ? 'none' : 'flex'};">×</button>
        </div>
      </div>
    `).join('');

    this.colorPickerGrid.querySelectorAll('.color-picker').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        const value = e.target.value.toUpperCase();
        this.colors[index] = value;
        this.shadowRoot.querySelector(`.color-text[data-index="${index}"]`).value = value;
        this.updatePreview();
      });
    });

    this.colorPickerGrid.querySelectorAll('.color-text').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        let value = e.target.value.toUpperCase();

        if (!value.startsWith('#')) {
          value = '#' + value;
        }

        if (/^#[0-9A-F]{6}$/.test(value)) {
          this.colors[index] = value;
          this.shadowRoot.querySelector(`.color-picker[data-index="${index}"]`).value = value;
          this.updatePreview();
        }
      });
    });

    this.colorPickerGrid.querySelectorAll('.remove-color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removeColor(index);
      });
    });
  }

  renderPresets() {
    this.presetGrid.innerHTML = this.presets.map((preset, idx) => {
      const gradientStr = `linear-gradient(135deg, ${preset.colors.join(', ')})`;
      return `
        <button class="preset-btn" data-preset-index="${idx}" style="background: ${gradientStr};" title="${preset.name}"></button>
      `;
    }).join('');

    this.presetGrid.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.presetIndex);
        const preset = this.presets[index];
        this.colors = [...preset.colors];
        this.renderColorPickers();
        this.updatePreview();

        this.presetGrid.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  addColor() {
    if (this.colors.length >= 6) {
      showToast('Maximum 6 colors allowed', 'warning');
      return;
    }
    this.colors.push('#ffffff');
    this.renderColorPickers();
    this.updatePreview();
  }

  removeColor(index) {
    if (this.colors.length <= 1) {
      showToast('At least 1 color required', 'warning');
      return;
    }
    this.colors.splice(index, 1);
    this.renderColorPickers();
    this.updatePreview();
  }

  updatePreview() {
    const gradientString = `linear-gradient(${this.direction}, ${this.colors.join(', ')})`;
    this.gradientPreview.style.background = gradientString;
  }

  reset() {
    this.colors = ['#08f7fe', '#f15bb5', '#ffea00'];
    this.direction = '135deg';

    this.shadowRoot.querySelectorAll('.direction-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    this.shadowRoot.querySelector('.direction-btn[data-direction="135deg"]').classList.add('active');

    this.renderColorPickers();
    this.presetGrid.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    this.presetGrid.querySelector('.preset-btn[data-preset-index="0"]').classList.add('active');
    this.updatePreview();

    showToast('Gradient reset to default', 'info');
  }

  applyGradient() {
    const gradient = {
      colors: this.colors,
      direction: this.direction,
      id: `custom-${Date.now()}`,
      timestamp: Date.now()
    };

    store.setStorage('customGradient', gradient);

    const customGradients = store.getStorage('customGradients', []) || [];
    const exists = customGradients.some(g =>
      JSON.stringify(g.colors) === JSON.stringify(gradient.colors) &&
      g.direction === gradient.direction
    );

    if (!exists) {
      customGradients.unshift(gradient);
      if (customGradients.length > 10) {
        customGradients.pop();
      }
      store.setStorage('customGradients', customGradients);
    }

    const accentGradient = `linear-gradient(135deg, ${this.colors.join(', ')})`;
    document.documentElement.style.setProperty('--accent-gradient', accentGradient);

    if (this.colors[0]) document.documentElement.style.setProperty('--accent1', this.colors[0]);
    if (this.colors[1]) document.documentElement.style.setProperty('--accent2', this.colors[1]);
    if (this.colors[2]) document.documentElement.style.setProperty('--accent3', this.colors[2]);

    document.documentElement.dataset.accent = 'custom';
    store.setStorage('accent', 'custom');

    document.dispatchEvent(new CustomEvent('accent-changed', {
      detail: 'custom'
    }));

    document.dispatchEvent(new CustomEvent('custom-gradients-updated'));

    showToast('🎨 Custom gradient applied!', 'success');
    this.close();
  }

  loadSavedGradient() {
    const saved = store.getStorage('customGradient');
    if (saved && saved.colors && Array.isArray(saved.colors)) {
      this.colors = saved.colors;
      this.direction = saved.direction || '135deg';

      this.shadowRoot.querySelectorAll('.direction-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.direction === this.direction);
      });
    }
  }

  open() {
    if (this.isOpen) return;
    this.setAttribute('open', '');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';

    this.loadSavedGradient();
    this.renderColorPickers();
    this.updatePreview();
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