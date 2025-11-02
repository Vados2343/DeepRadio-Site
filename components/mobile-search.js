import { store } from '../core/store.js';

class MobileSearch {
  constructor() {
    this.mobileSearchBtn = document.getElementById('mobile-search');
    this.searchMorphing = document.getElementById('search-morphing');
    this.morphSearch = document.getElementById('morph-search');
    this.morphClose = document.getElementById('morph-close');
    this.logoWrapper = document.querySelector('.logo-wrapper');
    this.isActive = false;
    this.isAnimating = false;

    this.init();
  }

  init() {
    if (!this.mobileSearchBtn || !this.searchMorphing) {
      console.warn('[MobileSearch] Required elements not found');
      return;
    }

    this.setupEventListeners();
    this.updateVisibility();

    window.addEventListener('resize', () => {
      this.updateVisibility();
      if (window.innerWidth > 768 && this.isActive) {
        this.close();
      }
    });
  }

  setupEventListeners() {
    this.mobileSearchBtn.addEventListener('click', () => this.toggle());

    if (this.morphClose) {
      this.morphClose.addEventListener('click', () => this.close());
    }

    this.searchMorphing.addEventListener('click', (e) => {
      if (e.target === this.searchMorphing) {
        this.close();
      }
    });

    if (this.morphSearch) {
      this.morphSearch.addEventListener('input', (e) => {
        store.setFilter(e.target.value);
        this.updateCloseButton(e.target.value);
      });

      this.morphSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.close();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          store.setFilter(e.target.value);
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isAnimating) return;

    if (this.isActive) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isActive || this.isAnimating) return;

    this.isAnimating = true;
    this.isActive = true;

    if (this.logoWrapper) {
      this.logoWrapper.style.transformOrigin = 'center';
      this.logoWrapper.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      this.logoWrapper.style.transform = 'rotateY(180deg)';
    }

    setTimeout(() => {
      this.searchMorphing.classList.add('active');

      setTimeout(() => {
        if (this.morphSearch) {
          this.morphSearch.focus();
        }
        this.isAnimating = false;

        if (this.morphSearch && this.morphSearch.value) {
          this.updateCloseButton(this.morphSearch.value);
        }
      }, 100);
    }, 300);

    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.isActive || this.isAnimating) return;

    this.isAnimating = true;
    this.isActive = false;

    this.searchMorphing.classList.remove('active');

    if (this.morphSearch) {
      this.morphSearch.value = '';
      store.setFilter('');
    }

    if (this.morphClose) {
      this.morphClose.style.display = 'none';
    }

    if (this.logoWrapper) {
      setTimeout(() => {
        this.logoWrapper.style.transform = 'rotateY(0deg)';

        setTimeout(() => {
          this.logoWrapper.style.transition = '';
          this.isAnimating = false;
        }, 600);
      }, 300);
    } else {
      setTimeout(() => {
        this.isAnimating = false;
      }, 600);
    }

    document.body.style.overflow = '';
  }

  updateCloseButton(value) {
    if (this.morphClose) {
      this.morphClose.style.display = value ? 'flex' : 'none';
    }
  }

  updateVisibility() {
    const isMobile = window.innerWidth <= 768;

    if (this.mobileSearchBtn) {
      this.mobileSearchBtn.style.display = isMobile ? 'flex' : 'none';
    }

    if (!isMobile && this.isActive) {
      this.close();
    }
  }

  destroy() {
    if (this.isActive) {
      this.close();
    }
  }
}

export default MobileSearch;

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mobileSearch = new MobileSearch();
  });
}