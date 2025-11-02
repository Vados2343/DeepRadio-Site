import { store } from '../core/store.js';

class HeaderSearch {
  constructor() {
    this.searchInput = document.querySelector('.search-input');
    this.searchClear = document.querySelector('.search-clear');
    this.searchDebounce = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateVisibility();

    window.addEventListener('resize', () => {
      this.updateVisibility();
    });
  }

  setupEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.handleSearchWithDebounce(e.target.value);
        this.toggleClearButton(e.target.value);
      });

      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clearSearch();
        } else if (e.key === 'Enter') {
          this.handleSearch(e.target.value);
        }
      });
    }

    if (this.searchClear) {
      this.searchClear.addEventListener('click', () => {
        this.clearSearch();
      });
    }
  }

  handleSearchWithDebounce(query) {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }

    this.searchDebounce = setTimeout(() => {
      this.handleSearch(query);
    }, 300);
  }

  handleSearch(query) {
    const trimmedQuery = query.trim();
    store.setFilter(trimmedQuery);
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.toggleClearButton('');
      this.searchInput.focus();
    }

    this.handleSearch('');
  }

  toggleClearButton(value) {
    if (this.searchClear) {
      this.searchClear.style.display = value ? 'flex' : 'none';
    }
  }

  updateVisibility() {
    const isMobile = window.innerWidth <= 768;

    if (this.searchInput) {
      this.searchInput.style.display = isMobile ? 'none' : '';
    }
  }

  destroy() {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.headerSearch = new HeaderSearch();
  });
} else {
  window.headerSearch = new HeaderSearch();
}

export default HeaderSearch;