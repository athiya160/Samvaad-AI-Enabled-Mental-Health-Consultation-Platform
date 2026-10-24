// Samvaad Client Authentication & Vault Service
// Does NOT use localStorage as the source of truth for authentication.
// Verifies session token with server-side /api/auth/me endpoint.
// Never exposes secrets or stores plaintext passwords.

const TOKEN_KEY = 'samvaad_session_token';

class AuthClient {
  constructor() {
    this.token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
    this.currentUser = null;
  }

  getToken() {
    return this.token;
  }

  setSession(token, user) {
    this.token = token;
    this.currentUser = user;
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  clearSession() {
    this.token = null;
    this.currentUser = null;
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  // Verifies authentication against the backend (source of truth)
  async checkAuth() {
    if (!this.token) {
      this.currentUser = null;
      return null;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!res.ok) {
        this.clearSession();
        return null;
      }

      const data = await res.json();
      if (data.ok && data.user) {
        this.currentUser = data.user;
        return data.user;
      } else {
        this.clearSession();
        return null;
      }
    } catch (err) {
      console.warn('Backend session verification failed:', err.message);
      return null;
    }
  }

  // Register Private Pseudonymous Account
  async registerPrivate(username, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    this.setSession(data.token, data.user);
    return data;
  }

  // Login to Private Pseudonymous Account
  async loginPrivate(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Login failed');
    }

    this.setSession(data.token, data.user);
    return data;
  }

  // Recover Account using Single-Use Recovery Code
  async recoverAccount(username, recoveryCode, newPassword) {
    const res = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, recoveryCode, newPassword })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Recovery failed');
    }

    this.setSession(data.token, data.user);
    return data;
  }

  // Logout
  async logout() {
    if (this.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
      } catch (e) {}
    }
    this.clearSession();
  }

  // Google OAuth Config Status
  async getGoogleStatus() {
    try {
      const res = await fetch('/api/auth/google/status');
      return await res.json();
    } catch (e) {
      return { ok: false, status: { configured: false } };
    }
  }

  // Google OAuth URL
  async getGoogleAuthUrl() {
    const res = await fetch('/api/auth/google/url');
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Google Sign-In is unavailable.');
    }
    return data.url;
  }

  // Save Reflection to User's Secure Vault (Protected backend endpoint)
  async saveReflection(reflection, conversationSnippet = '', messages = [], language = 'en') {
    if (!this.token) {
      throw new Error('Authentication session is required to save reflections.');
    }

    const res = await fetch('/api/user/reflections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        reflection,
        conversationSnippet,
        messages,
        language
      })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Failed to save reflection to your account vault.');
    }

    return data;
  }

  // Fetch all saved reflections for authenticated user
  async getReflections() {
    if (!this.token) return [];

    const res = await fetch('/api/user/reflections', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Failed to load reflections.');
    }

    return data.reflections || [];
  }

  // Delete specific reflection
  async deleteReflection(id) {
    if (!this.token) throw new Error('Not authenticated');

    const res = await fetch(`/api/user/reflections/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Failed to delete reflection.');
    }

    return data;
  }

  // Delete Account and all data
  async deleteAccount() {
    if (!this.token) throw new Error('Not authenticated');

    const res = await fetch('/api/user/account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'Failed to delete account.');
    }

    this.clearSession();
    return data;
  }
}

export const authClient = new AuthClient();
