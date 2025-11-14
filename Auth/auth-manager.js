class AuthManager {
  constructor() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = {};
    this.init();
  }
  async init() {
    const p = new URLSearchParams(window.location.search);
    const token = p.get('auth_token');
    const ok = p.get('auth_success');
    if (token && ok) {
      this.token = token;
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      await this.verifyToken();
    } else {
      const saved = localStorage.getItem('auth_token');
      if (saved) {
        this.token = saved;
        await this.verifyToken();
      }
    }
  }
  async verifyToken() {
    if (!this.token) {
      this.isAuthenticated = false;
      this.emit('auth-changed', { authenticated: false });
      return false;
    }
    try {
      const r = await fetch('/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token })
      });
      if (r.ok) {
        const data = await r.json();
        this.user = data.user;
        this.isAuthenticated = true;
        this.emit('auth-changed', { authenticated: true, user: this.user });
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch {
      this.clearAuth();
      return false;
    }
  }
  login() {
    const panel = document.querySelector('auth-panel');
    if (panel) panel.open();
    else window.location.href = '/auth/google';
  }
  startGoogleAuth() {
    window.location.href = '/auth/google';
  }
  async logout() {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch {}
    this.clearAuth();
    window.location.reload();
  }
  clearAuth() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    localStorage.removeItem('auth_token');
    this.emit('auth-changed', { authenticated: false });
  }
  getAuthHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }
  showAuthPrompt() {
    const panel = document.querySelector('auth-panel');
    if (panel) panel.open();
  }
  on(e, cb) {
    if (!this.listeners[e]) this.listeners[e] = [];
    this.listeners[e].push(cb);
  }
  off(e, cb) {
    if (!this.listeners[e]) return;
    this.listeners[e] = this.listeners[e].filter(x => x !== cb);
  }
  emit(e, d) {
    if (!this.listeners[e]) return;
    this.listeners[e].forEach(cb => cb(d));
  }
}
export const authManager = new AuthManager();
window.authManager = authManager;
