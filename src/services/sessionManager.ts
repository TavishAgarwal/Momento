// ═══════════════════════════════════════════════════════════════
// MOMENTO — Session & Token Security Manager
// Handles anonymous ID rotation and zero-knowledge storage
// ═══════════════════════════════════════════════════════════════

class SessionManager {
  private readonly STORAGE_KEY = 'momento_session';
  private currentSession: { id: string; expiresAt: number; createdAt: number } | null = null;

  constructor() {
    this.initSession();
  }

  private initSession() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          this.currentSession = session;
          return;
        }
      }
      this.rotateSession();
    } catch {
      this.rotateSession();
    }
  }

  rotateSession() {
    // Generate an anonymous ephemeral ID
    const newId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const now = Date.now();
    // 2-hour session lifetime (strict GDPR ephemeral)
    const expiresAt = now + 2 * 60 * 60 * 1000;
    
    this.currentSession = { id: newId, createdAt: now, expiresAt };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentSession));
    
    console.log('[SessionManager] Token rotated. New ID:', newId);
    return this.currentSession;
  }

  getAnonymousId() {
    if (!this.currentSession || this.currentSession.expiresAt <= Date.now()) {
      this.rotateSession();
    }
    return this.currentSession?.id;
  }

  getSessionDetails() {
    let sizeBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        sizeBytes += key.length + (localStorage.getItem(key)?.length || 0);
      }
    }

    return {
      id: this.currentSession?.id,
      expiresAt: this.currentSession?.expiresAt,
      createdAt: this.currentSession?.createdAt,
      localDataSize: (sizeBytes / 1024).toFixed(2) + ' KB',
    };
  }

  clearSessionData() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.rotateSession();
  }
}

export const sessionManager = new SessionManager();
