import { store } from '../core/store.js';



class MobileSearch {

  constructor() {

    this.mobileSearchBtn = document.getElementById('mobile-search');

    this.desktopSearchInput = document.querySelector('.search-input');

    this.init();

  }



  init() {

    if (!this.mobileSearchBtn) {

      console.warn('[MobileSearch] Mobile search button not found');

      return;

    }



    this.setupEventListeners();

  }



  setupEventListeners() {

    // Mobile search button - focus on desktop search

    this.mobileSearchBtn.addEventListener('click', () => {

      if (this.desktopSearchInput) {

        this.desktopSearchInput.focus();

        this.desktopSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

      }

    });

  }

}



export default MobileSearch;



if (typeof window !== 'undefined') {

  document.addEventListener('DOMContentLoaded', () => {

    window.mobileSearch = new MobileSearch();

  });

}