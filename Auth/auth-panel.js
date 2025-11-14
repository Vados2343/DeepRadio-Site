import { authManager } from './auth-manager.js';
import { t } from '../utils/i18n.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99999;
      font-family: var(--font-main, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }
    :host([open]) {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: dr-auth-fade-in .3s ease;
    }
    @keyframes dr-auth-fade-in {
      from { opacity: 0 }
      to { opacity: 1 }
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 10% 0%, rgba(8,247,254,.18), transparent 55%),
        radial-gradient(circle at 90% 100%, rgba(241,91,181,.18), transparent 55%),
        radial-gradient(circle at 50% 50%, rgba(15,23,42,.9), rgba(15,23,42,.95));
      backdrop-filter: blur(26px) saturate(180%);
      z-index: 1;
    }
    .grain {
      position: absolute;
      inset: 0;
      z-index: 2;
      mix-blend-mode: soft-light;
      opacity: .07;
      pointer-events: none;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>');
    }
    .shell {
      position: relative;
      z-index: 3;
      width: 94%;
      max-width: 880px;
      padding: 2px;
      border-radius: 32px;
      background:
        linear-gradient(135deg, rgba(8,247,254,.85), rgba(241,91,181,.9), rgba(8,247,254,.7));
      box-shadow:
        0 0 40px rgba(8,247,254,.4),
        0 0 80px rgba(241,91,181,.35);
      animation: dr-auth-shell-up .35s ease;
    }
    @keyframes dr-auth-shell-up {
      from { opacity: 0; transform: translateY(40px) scale(.98) }
      to { opacity: 1; transform: translateY(0) scale(1) }
    }
    .panel {
      border-radius: 30px;
      background: radial-gradient(circle at 0% 0%, rgba(8,247,254,.14), transparent 50%),
                  radial-gradient(circle at 100% 100%, rgba(241,91,181,.18), transparent 55%),
                  rgba(15,23,42,.96);
      backdrop-filter: blur(26px) saturate(200%);
      padding: 2.2rem 2.4rem;
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      gap: 2.4rem;
      position: relative;
      overflow: hidden;
    }
    .orb {
      position: absolute;
      border-radius: 999px;
      filter: blur(24px);
      opacity: .55;
      mix-blend-mode: screen;
      pointer-events: none;
    }
    .orb--a { width: 220px; height: 220px; top: -80px; left: -40px; background: radial-gradient(circle, rgba(8,247,254,.9), transparent 60%) }
    .orb--b { width: 260px; height: 260px; bottom: -120px; right: -60px; background: radial-gradient(circle, rgba(241,91,181,.9), transparent 65%) }
    .close {
      position: absolute;
      top: 1.3rem;
      right: 1.3rem;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: rgba(15,23,42,.9);
      border: 1px solid rgba(255,255,255,.16);
      color: #e5e7eb;
      cursor: pointer;
      transition: .25s ease;
      z-index: 1;
    }
    .close:hover {
      background: rgba(15,23,42,1);
      transform: translateY(-1px) rotate(90deg);
      box-shadow: 0 0 18px rgba(255,255,255,.25);
    }
    .col-left {
      display: flex;
      flex-direction: column;
      gap: 1.7rem;
      min-width: 0;
    }
    .logo-block {
      display: flex;
      align-items: center;
      gap: 1.1rem;
    }
    .logo-icon {
      width: 72px;
      height: 72px;
      border-radius: 24px;
      background:
        radial-gradient(circle at 20% 0%, #ffffff, transparent 55%),
        linear-gradient(135deg, #08f7fe, #f15bb5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.4rem;
      box-shadow:
        0 12px 24px rgba(0,0,0,.65),
        0 0 36px rgba(8,247,254,.4);
      flex-shrink: 0;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      gap: .25rem;
    }
    .brand-name {
      font-size: 1.9rem;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #f9fafb;
    }
    .brand-tagline {
      font-size: .9rem;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: rgba(148,163,184,.9);
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: .45rem;
      padding: .28rem .9rem;
      border-radius: 999px;
      background: rgba(15,23,42,.85);
      border: 1px solid rgba(148,163,184,.5);
      font-size: .8rem;
      color: rgba(226,232,240,.9);
    }
    .pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: radial-gradient(circle, #22c55e, #166534);
      box-shadow: 0 0 10px rgba(34,197,94,.9);
    }
    .title {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 600;
      color: #f9fafb;
    }
    .subtitle {
      margin: .4rem 0 0 0;
      font-size: .98rem;
      line-height: 1.6;
      color: rgba(209,213,219,.92);
    }
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: .9rem .9rem;
      margin-top: 1.4rem;
    }
    .benefit {
      display: flex;
      gap: .7rem;
      align-items: flex-start;
      color: rgba(226,232,240,.96);
      font-size: .86rem;
    }
    .benefit-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: #08f7fe;
      stroke-width: 2;
    }
    .benefit-label {
      white-space: normal;
    }
    .avatars-row {
      display: flex;
      align-items: center;
      gap: .6rem;
      margin-top: 1.6rem;
    }
    .avatars {
      display: flex;
    }
    .avatar {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      border: 2px solid rgba(15,23,42,.95);
      background: linear-gradient(135deg, #08f7fe, #f15bb5);
      box-shadow: 0 0 16px rgba(8,247,254,.6);
    }
    .avatar:nth-child(2) { margin-left: -10px; background: linear-gradient(135deg, #f97316, #22c55e) }
    .avatar:nth-child(3) { margin-left: -10px; background: linear-gradient(135deg, #6366f1, #ec4899) }
    .avatar-more {
      margin-left: -10px;
      width: 26px;
      height: 26px;
      border-radius: 999px;
      border: 2px solid rgba(15,23,42,.95);
      background: rgba(15,23,42,.95);
      color: rgba(148,163,184,.9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: .7rem;
    }
    .avatars-text {
      font-size: .8rem;
      color: rgba(148,163,184,.95);
    }
    .col-right {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1.5rem;
      min-width: 0;
    }
    .card {
      border-radius: 22px;
      padding: 1.5rem 1.6rem;
      background: radial-gradient(circle at 0 0, rgba(8,247,254,.15), transparent 55%),
                  rgba(15,23,42,.96);
      border: 1px solid rgba(148,163,184,.5);
      box-shadow: 0 18px 40px rgba(15,23,42,.9);
    }
    .google-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .8rem;
      border-radius: 14px;
      border: none;
      padding: 1rem 1.4rem;
      background: #fff;
      color: #020617;
      font-size: 1.02rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(15,23,42,.6);
      transition: .2s ease;
    }
    .google-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(15,23,42,.9);
    }
    .google-btn:active {
      transform: translateY(0);
      box-shadow: 0 8px 18px rgba(15,23,42,.8);
    }
    .google-icon {
      width: 22px;
      height: 22px;
    }
    .divider {
      margin: 1.2rem 0 1.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .8rem;
      font-size: .78rem;
      text-transform: uppercase;
      letter-spacing: .18em;
      color: rgba(148,163,184,.9);
    }
    .divider-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(148,163,184,.7), transparent);
    }
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: .7rem;
      font-size: .86rem;
      color: rgba(209,213,219,.95);
    }
    .feature-row {
      display: flex;
      align-items: center;
      gap: .5rem;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: rgba(148,163,184,.9);
    }
    .notice {
      margin-top: 1.4rem;
      font-size: .76rem;
      line-height: 1.5;
      color: rgba(148,163,184,.95);
      text-align: left;
    }
    @media (max-width: 768px) {
      .panel {
        grid-template-columns: minmax(0,1fr);
        padding: 1.9rem 1.6rem 1.9rem;
        gap: 1.8rem;
      }
      .shell {
        max-width: 95%;
      }
      .logo-icon {
        width: 64px;
        height: 64px;
        font-size: 2rem;
      }
      .brand-name {
        font-size: 1.5rem;
      }
      .col-left {
        order: 2;
      }
      .col-right {
        order: 1;
      }
      .benefits-grid {
        grid-template-columns: minmax(0,1fr);
      }
      .close {
        top: 1rem;
        right: 1rem;
      }
    }
  </style>

  <div class="backdrop"></div>
  <div class="grain"></div>

  <div class="shell">
    <div class="panel">
      <div class="orb orb--a"></div>
      <div class="orb orb--b"></div>

      <button class="close" id="dr-auth-close">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </button>

      <div class="col-left">
        <div class="logo-block">
          <div class="logo-icon">🎧</div>
          <div class="brand-text">
            <div class="brand-name">DEEP&nbsp;RADIO</div>
            <div class="brand-tagline" data-i18n="settings.signInPrompt"></div>
          </div>
        </div>

        <div class="pill">
          <span class="pill-dot"></span>
          <span data-i18n="settings.signInDesc"></span>
        </div>

        <div>
          <h2 class="title" data-i18n="settings.authPanelTitle"></h2>
          <p class="subtitle" data-i18n="settings.authPanelSubtitle"></p>
        </div>

        <div class="benefits-grid">
          <div class="benefit">
            <svg class="benefit-icon" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor"/>
            </svg>
            <span class="benefit-label" data-i18n="settings.authPanelFeatureFavorites"></span>
          </div>
          <div class="benefit">
            <svg class="benefit-icon" viewBox="0 0 24 24" fill="none">
              <path d="M3 3v18h18" stroke="currentColor"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor"/>
            </svg>
            <span class="benefit-label" data-i18n="settings.authPanelFeatureStats"></span>
          </div>
          <div class="benefit">
            <svg class="benefit-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" stroke="currentColor"/>
              <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01" stroke="currentColor"/>
            </svg>
            <span class="benefit-label" data-i18n="settings.authPanelFeatureSync"></span>
          </div>
          <div class="benefit">
            <svg class="benefit-icon" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor"/>
              <path d="M7 8h10M7 12h6M7 16h4" stroke="currentColor"/>
            </svg>
            <span class="benefit-label" data-i18n="settings.authPanelFeatureStats"></span>
          </div>
        </div>

        <div class="avatars-row">
          <div class="avatars">
            <div class="avatar"></div>
            <div class="avatar"></div>
            <div class="avatar"></div>
            <div class="avatar-more">+∞</div>
          </div>
          <div class="avatars-text" data-i18n="settings.authPanelSubtitle"></div>
        </div>
      </div>

      <div class="col-right">
        <div class="card">
          <button id="dr-auth-google" class="google-btn">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span data-i18n="settings.authPanelContinueGoogle"></span>
          </button>

          <div class="divider">
            <div class="divider-line"></div>
            <span>Deep sync</span>
            <div class="divider-line"></div>
          </div>

          <div class="feature-list">
            <div class="feature-row">
              <div class="dot"></div>
              <span data-i18n="settings.authPanelFeatureFavorites"></span>
            </div>
            <div class="feature-row">
              <div class="dot"></div>
              <span data-i18n="settings.authPanelFeatureStats"></span>
            </div>
            <div class="feature-row">
              <div class="dot"></div>
              <span data-i18n="settings.authPanelFeatureSync"></span>
            </div>
          </div>

          <p class="notice" data-i18n="settings.authPanelNotice"></p>
        </div>
      </div>
    </div>
  </div>
`;

export class AuthPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleLangChange = this.handleLangChange.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.getElementById('dr-auth-google').addEventListener('click', () => this.signIn());
    this.shadowRoot.getElementById('dr-auth-close').addEventListener('click', () => this.close());
    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.close());
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('language-change', this.handleLangChange);
    this.updateTexts();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('language-change', this.handleLangChange);
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.hasAttribute('open')) this.close();
  }

  handleLangChange() {
    this.updateTexts();
  }

  updateTexts() {
    this.shadowRoot.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }

  signIn() {
    authManager.startGoogleAuth();
  }
}

customElements.define('auth-panel', AuthPanel);
