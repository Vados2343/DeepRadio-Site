import { store } from '../core/store.js';

class CapsuleSearch {
  constructor() {
    this.capsule = document.getElementById('capsule');
    this.searchInput = document.getElementById('capsule-search');
    this.isActive = false;
    this.searchDebounce = null;
    this.init();
  }

  init() {
 if (!this.capsule || !this.searchInput) return;
    this.setupEventListeners();
  }
  setupEventListeners() {
    this.capsule.addEventListener('mouseenter', () => {
      if (!this.isActive) this.flip();
    });
    this.capsule.addEventListener('mouseleave', () => {
      if (!this.isActive) this.flipBack();
    });
    this.capsule.addEventListener('click', (e) => {
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
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) this.deactivate();
    });
    document.addEventListener('click', (e) => {
      if (this.isActive && !this.capsule.contains(e.target)) {
        this.deactivate();
      }
    });
  }
   flip() {
    this.capsule.classList.add('flipped');
  }
  flipBack() {
    this.capsule.classList.remove('flipped');
  }
  activate() {
    this.flip();
    this.capsule.classList.add('active');
    this.isActive = true;
    setTimeout(() => this.searchInput.focus(), 200);
  }
deactivate() {
  this.capsule.classList.remove('active');
  this.isActive = false;
  this.searchInput.value = '';
  this.handleSearch('');
}

  handleSearchWithDebounce(query) {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.handleSearch(query), 300);
  }

  handleSearch(query) {
    store.setFilter(query.trim());
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
