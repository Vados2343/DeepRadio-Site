import { authManager } from '../auth/auth-manager.js';
class DatabaseSync {
  constructor() { this.syncInterval=null; this.isAutoSyncEnabled=true; }
  getHeaders() { return authManager.getAuthHeaders(); }
  async syncFavorites(favorites) {
    if (!authManager.isAuthenticated) return false;
    try {
      const r=await fetch('/api/favorites',{method:'POST',headers:this.getHeaders(),body:JSON.stringify({sessionId:authManager.user.sessionId,favorites})});
      return r.ok;
    } catch { return false; }
  }
  async loadFavorites() {
    if (!authManager.isAuthenticated) return [];
    try {
      const r=await fetch('/api/favorites',{method:'GET',headers:this.getHeaders()});
      if (r.ok) return (await r.json()).favorites||[];
      return [];
    } catch { return []; }
  }
  async addFavorite(stationId) {
    if (!authManager.isAuthenticated) return false;
    try {
      const r=await fetch('/api/favorites',{method:'POST',headers:this.getHeaders(),body:JSON.stringify({sessionId:authManager.user.sessionId,stationId,action:'add'})});
      return r.ok;
    } catch { return false; }
  }
  async removeFavorite(stationId) {
    if (!authManager.isAuthenticated) return false;
    try {
      const r=await fetch('/api/favorites',{method:'POST',headers:this.getHeaders(),body:JSON.stringify({sessionId:authManager.user.sessionId,stationId,action:'remove'})});
      return r.ok;
    } catch { return false; }
  }
  async saveSession(s) {
    if (!authManager.isAuthenticated) return false;
    try {
      const r=await fetch('/api/stats',{method:'POST',headers:this.getHeaders(),body:JSON.stringify({sessionId:authManager.user.sessionId,stationId:s.stationId,stationName:s.stationName,track:s.track,genres:s.genres,duration:s.time,timestamp:s.timestamp,liked:s.liked})});
      return r.ok;
    } catch { return false; }
  }
  async loadStats() {
    if (!authManager.isAuthenticated) return null;
    try {
      const r=await fetch('/api/stats',{method:'GET',headers:this.getHeaders()});
      if (r.ok) return (await r.json()).stats||[];
      return [];
    } catch { return []; }
  }
  async clearStats() {
    if (!authManager.isAuthenticated) return false;
    try {
      const r=await fetch('/api/stats',{method:'DELETE',headers:this.getHeaders()});
      return r.ok;
    } catch { return false; }
  }
  async saveGradients(g) {
    if (!authManager.isAuthenticated) return false;
    try {
      const r=await fetch('/api/gradients',{method:'POST',headers:this.getHeaders(),body:JSON.stringify({sessionId:authManager.user.sessionId,gradients:g})});
      return r.ok;
    } catch { return false; }
  }
  async loadGradients() {
    if (!authManager.isAuthenticated) return [];
    try {
      const r=await fetch('/api/gradients',{method:'GET',headers:this.getHeaders()});
      if (r.ok) return (await r.json()).gradients||[];
      return [];
    } catch { return []; }
  }
  async saveSettings(settings) {
    if (!authManager.isAuthenticated) return false;
    try {
      const r=await fetch('/api/settings',{method:'POST',headers:this.getHeaders(),body:JSON.stringify({sessionId:authManager.user.sessionId,settings})});
      return r.ok;
    } catch { return false; }
  }
  async loadSettings() {
    if (!authManager.isAuthenticated) return null;
    try {
      const r=await fetch('/api/settings',{method:'GET',headers:this.getHeaders()});
      if (r.ok) return (await r.json()).settings;
      return null;
    } catch { return null; }
  }
  enableAutoSync(ms=60000) {
    if (this.syncInterval) return;
    this.isAutoSyncEnabled=true;
    this.syncInterval=setInterval(()=>{ if(authManager.isAuthenticated) this.performAutoSync(); },ms);
  }
  disableAutoSync() {
    if (this.syncInterval) { clearInterval(this.syncInterval); this.syncInterval=null; }
    this.isAutoSyncEnabled=false;
  }
  async performAutoSync() { console.log('Performing auto-sync...'); }
}
export const dbSync=new DatabaseSync();
window.dbSync=dbSync;
