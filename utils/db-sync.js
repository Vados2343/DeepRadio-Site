import { authManager } from '../auth/auth-manager.js';

class DatabaseSync {
  constructor() {
    this.syncInterval = null;
    this.isAutoSyncEnabled = true;
  }

  getHeaders() {
    return authManager.getAuthHeaders();
  }

  async syncFavorites(favorites) {
    if (!authManager.isAuthenticated) return false;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionId: authManager.user.sessionId,
          favorites
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to sync favorites:', error);
      return false;
    }
  }

  async loadFavorites() {
    if (!authManager.isAuthenticated) return [];

    try {
      const response = await fetch('/api/favorites', {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.favorites || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  }

  async addFavorite(stationId) {
    if (!authManager.isAuthenticated) return false;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionId: authManager.user.sessionId,
          stationId,
          action: 'add'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return false;
    }
  }

  async removeFavorite(stationId) {
    if (!authManager.isAuthenticated) return false;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionId: authManager.user.sessionId,
          stationId,
          action: 'remove'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      return false;
    }
  }

  async saveSession(session) {
    if (!authManager.isAuthenticated) return false;

    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionId: authManager.user.sessionId,
          stationId: session.stationId,
          stationName: session.stationName,
          track: session.track,
          genres: session.genres,
          duration: session.time,
          timestamp: session.timestamp,
          liked: session.liked
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }

  async loadStats() {
    if (!authManager.isAuthenticated) return null;

    try {
      const response = await fetch('/api/stats', {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.stats || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load stats:', error);
      return [];
    }
  }

  async clearStats() {
    if (!authManager.isAuthenticated) return false;

    try {
      const response = await fetch('/api/stats', {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to clear stats:', error);
      return false;
    }
  }

  async saveGradients(gradients) {
    if (!authManager.isAuthenticated) return false;

    try {
      const response = await fetch('/api/gradients', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionId: authManager.user.sessionId,
          gradients
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to save gradients:', error);
      return false;
    }
  }

  async loadGradients() {
    if (!authManager.isAuthenticated) return [];

    try {
      const response = await fetch('/api/gradients', {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.gradients || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load gradients:', error);
      return [];
    }
  }

  async saveSettings(settings) {
    if (!authManager.isAuthenticated) return false;

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionId: authManager.user.sessionId,
          settings
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  async loadSettings() {
    if (!authManager.isAuthenticated) return null;

    try {
      const response = await fetch('/api/settings', {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.settings;
      }
      return null;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  enableAutoSync(intervalMs = 60000) {
    if (this.syncInterval) return;

    this.isAutoSyncEnabled = true;
    this.syncInterval = setInterval(() => {
      if (authManager.isAuthenticated) {
        this.performAutoSync();
      }
    }, intervalMs);
  }

  disableAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isAutoSyncEnabled = false;
  }

  async performAutoSync() {
    console.log('Performing auto-sync...');
  }
}

export const dbSync = new DatabaseSync();
window.dbSync = dbSync;
