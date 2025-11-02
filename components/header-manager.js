import { store } from '../core/store.js';

class HeaderManager {
  constructor() {
    this.header = document.querySelector('.app-header');
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
  }

  loadSettings() {
    const headerLayout = store.getStorage('headerLayout', 'default');
    const centerElements = store.getStorage('centerElements', false);

    this.applyHeaderLayout(headerLayout);
    this.applyCenterElements(centerElements);
  }

  setupEventListeners() {
    document.addEventListener('settings-change', (e) => {
      const { key, value } = e.detail;

      switch (key) {
        case 'headerLayout':
          this.applyHeaderLayout(value);
          break;
        case 'centerElements':
          this.applyCenterElements(value);
          break;
      }
    });
  }

  applyHeaderLayout(layout) {
    if (!this.header) return;

    this.header.classList.remove('layout-default', 'layout-centered', 'layout-compact', 'layout-spacious');
    this.header.classList.add(`layout-${layout}`);

    document.documentElement.dataset.headerLayout = layout;
  }

  applyCenterElements(enabled) {
    document.body.classList.toggle('center-elements', enabled);
  }
}

export default HeaderManager;

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new HeaderManager();
  });
}