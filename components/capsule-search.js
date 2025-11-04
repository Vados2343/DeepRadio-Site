import { store } from '../core/store.js';

class CapsuleSearch {
  constructor() {
    this.capsule = document.getElementById('capsule');
    this.searchInput = document.getElementById('capsule-search');
    this.clearBtn = document.getElementById('capsule-clear');
    this.isActive = false;
    this.searchDebounce = null;
    this.init();
  }

  init() {
    if (!this.capsule || !this.searchInput || !this.clearBtn) return;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.capsule.addEventListener('click', (e) => {
      if (e.target === this.searchInput || e.target === this.clearBtn) return;
      if (!this.isActive) this.activate();
    });

    this.searchInput.addEventListener('focus', () => {
      if (!this.isActive) this.activate();
    });

    this.searchInput.addEventListener('input', (e) => {
      this.handleSearchWithDebounce(e.target.value);
      this.toggleClearButton(e.target.value);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.deactivate();
      }
    });

    this.clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearSearch();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) this.deactivate();
    });
  }

  activate() {
    this.capsule.classList.add('active');
    this.isActive = true;
    setTimeout(() => this.searchInput.focus(), 200);
  }

  deactivate() {
    this.capsule.classList.remove('active');
    this.isActive = false;
    this.searchInput.value = '';
    this.handleSearch('');
    this.toggleClearButton('');
  }

  handleSearchWithDebounce(query) {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.handleSearch(query), 300);
  }

  handleSearch(query) {
    store.setFilter(query.trim());
  }

  clearSearch() {
    this.searchInput.value = '';
    this.handleSearch('');
    this.toggleClearButton('');
    this.searchInput.focus();
  }

  toggleClearButton(value) {
    if (this.clearBtn) {
      if (value && value.trim()) {
        this.clearBtn.classList.add('visible');
      } else {
        this.clearBtn.classList.remove('visible');
      }
    }
  }

  destroy() {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.capsuleSearch = new CapsuleSearch();
  });
} else {
  window.capsuleSearch = new CapsuleSearch();
}

export default CapsuleSearch;
