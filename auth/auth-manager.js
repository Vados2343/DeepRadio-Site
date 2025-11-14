class AuthManager {
  constructor() {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = {};
    this.init();
  }

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('auth_token');
    const authSuccess = urlParams.get('auth_success');

    if (token && authSuccess) {
      this.token = token;
      localStorage.setItem('auth_token', token);

      window.history.replaceState({}, document.title, window.location.pathname);

      await this.verifyToken();
    } else {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        this.token = savedToken;
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
      const response = await fetch('/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token })
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.isAuthenticated = true;
        this.emit('auth-changed', { authenticated: true, user: this.user });
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      this.clearAuth();
      return false;
    }
  }

  login() {
    const authPanel = document.querySelector('auth-panel');
    if (authPanel) {
      authPanel.open();
    } else {
      window.location.href = '/auth/google';
    }
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
    } catch (error) {
      console.error('Logout request failed:', error);
    }

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
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  showAuthPrompt() {
    const authPanel = document.querySelector('auth-panel');
    if (authPanel) {
      authPanel.open();
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

export const authManager = new AuthManager();
window.authManager = authManager;
