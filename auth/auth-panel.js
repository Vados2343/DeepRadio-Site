import { authManager } from './auth-manager.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      font-family: var(--font-main, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    :host([open]) {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      z-index: 1;
    }

    .visualizer {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
    }

    .auth-container {
      position: relative;
      z-index: 2;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
      border: 1px solid rgba(8, 247, 254, 0.3);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(8, 247, 254, 0.2);
      animation: slideUp 0.4s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .close-btn {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #fff;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: rotate(90deg);
    }

    .logo {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1rem;
      background: linear-gradient(135deg, #08f7fe, #f15bb5);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      box-shadow: 0 10px 30px rgba(8, 247, 254, 0.3);
    }

    .logo-text {
      font-size: 1.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, #08f7fe, #f15bb5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #fff;
      text-align: center;
      margin: 0 0 1rem 0;
    }

    .auth-subtitle {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      margin: 0 0 2rem 0;
      line-height: 1.5;
    }

    .google-btn {
      width: 100%;
      background: #fff;
      color: #000;
      border: none;
      border-radius: 12px;
      padding: 1rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .google-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
    }

    .google-btn:active {
      transform: translateY(0);
    }

    .google-icon {
      width: 24px;
      height: 24px;
    }

    .features {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .feature-icon {
      width: 20px;
      height: 20px;
      color: #08f7fe;
      flex-shrink: 0;
    }

    .privacy-notice {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      line-height: 1.4;
    }

    @media (max-width: 600px) {
      .auth-container {
        padding: 2rem 1.5rem;
        max-width: 95%;
      }

      .logo-icon {
        width: 60px;
        height: 60px;
        font-size: 2rem;
      }

      .logo-text {
        font-size: 1.5rem;
      }

      .auth-title {
        font-size: 1.25rem;
      }
    }
  </style>

  <div class="overlay"></div>
  <canvas class="visualizer"></canvas>

  <div class="auth-container">
    <button class="close-btn" id="close-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>

    <div class="logo">
      <div class="logo-icon">🎵</div>
      <h1 class="logo-text">DeepRadio</h1>
    </div>

    <h2 class="auth-title">Войдите, чтобы продолжить</h2>
    <p class="auth-subtitle">
      Сохраняйте избранное, отслеживайте статистику и синхронизируйте настройки между устройствами
    </p>

    <button class="google-btn" id="google-btn">
      <svg class="google-icon" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Продолжить с Google
    </button>

    <div class="features">
      <div class="feature">
        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>Сохраняйте любимые станции</span>
      </div>
      <div class="feature">
        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
        <span>Отслеживайте статистику прослушивания</span>
      </div>
      <div class="feature">
        <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
          <path d="M8.5 8.5v.01"/>
          <path d="M16 15.5v.01"/>
          <path d="M12 12v.01"/>
        </svg>
        <span>Синхронизация на всех устройствах</span>
      </div>
    </div>

    <p class="privacy-notice">
      Мы используем Google OAuth для безопасной авторизации.<br>
      Ваши данные защищены и не передаются третьим лицам.
    </p>
  </div>
`;

export class AuthPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.visualizerAnimationId = null;
  }

  connectedCallback() {
    this.setupEventListeners();
    this.setupVisualizer();
  }

  disconnectedCallback() {
    if (this.visualizerAnimationId) {
      cancelAnimationFrame(this.visualizerAnimationId);
    }
  }

  setupEventListeners() {
    const googleBtn = this.shadowRoot.getElementById('google-btn');
    const closeBtn = this.shadowRoot.getElementById('close-btn');
    const overlay = this.shadowRoot.querySelector('.overlay');

    googleBtn?.addEventListener('click', () => this.signIn());
    closeBtn?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) {
        this.close();
      }
    });
  }

  setupVisualizer() {
    const canvas = this.shadowRoot.querySelector('.visualizer');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? 'rgba(8, 247, 254, 0.5)' : 'rgba(241, 91, 181, 0.5)'
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(8, 247, 254, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      this.visualizerAnimationId = requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
