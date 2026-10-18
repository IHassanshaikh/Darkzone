'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeQueue, flushOfflineQueue, getPendingQueue } from '../lib/offlineQueue';
import { isUsingMockData, syncQueueAction, checkBackendHealth, fetchActiveNotifications, acknowledgeNotificationAction } from '../lib/api';

const AppContext = createContext(null);

const ROLE_THEME_MAP = {
  admin: 'red',
  camp_manager: 'amber',
  volunteer: 'emerald',
};

const ACCENT_CYCLE = ['red', 'amber', 'emerald', 'blue', 'purple', 'cyan'];

export function AppProvider({ children }) {
  // Authentication & Clearance State
  const [user, setUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [role, setRoleState] = useState('admin');
  
  // Dynamic Theme Color Accent ('red' | 'amber' | 'emerald' | 'blue' | 'purple' | 'cyan')
  const [themeAccent, setThemeAccent] = useState('red');

  // Network & Sync State
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMock, setIsMock] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Light / Dark Theme Mode
  const [theme, setTheme] = useState('light');

  // Switch role / login modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingTargetRole, setPendingTargetRole] = useState(null);

  // Apply accent color to document root
  const applyThemeAccent = useCallback((accent) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-accent', accent);
      root.classList.remove('accent-pulse');
      void root.offsetWidth; // force reflow for animation
      root.classList.add('animate-accent-change');
    }
  }, []);

  // Initialize theme, accent, and saved user session from localStorage
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // 1. Theme (light/dark)
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('reliefos_theme') || 'light' : 'light';
    setTheme(savedTheme);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (savedTheme === 'dark') {
        root.classList.remove('light');
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }

    // 2. Auth user session
    const savedUserJson = typeof window !== 'undefined' ? localStorage.getItem('reliefos_auth_user') : null;
    if (savedUserJson) {
      try {
        const parsed = JSON.parse(savedUserJson);
        setUser(parsed);
        setRoleState(parsed.role || 'admin');
        const roleAccent = parsed.themeAccent || ROLE_THEME_MAP[parsed.role] || 'red';
        setThemeAccent(roleAccent);
        applyThemeAccent(roleAccent);
      } catch (e) {
        console.warn('Failed to parse saved user:', e);
      }
    } else {
      // Default initial accent
      applyThemeAccent('red');
    }

    setIsAuthChecked(true);
  }, [applyThemeAccent]);

  // Dynamic Theme Color Switcher on every click
  const changeThemeAccent = useCallback((newAccent) => {
    setThemeAccent(newAccent);
    applyThemeAccent(newAccent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('reliefos_theme_accent', newAccent);
    }
    showToast(`Theme color updated to ${newAccent.toUpperCase()}`, 'info');
  }, [applyThemeAccent]);

  // Cycle through theme colors on click
  const cycleThemeAccent = useCallback(() => {
    setThemeAccent(prev => {
      const idx = ACCENT_CYCLE.indexOf(prev);
      const next = ACCENT_CYCLE[(idx + 1) % ACCENT_CYCLE.length];
      applyThemeAccent(next);
      if (typeof window !== 'undefined') {
        localStorage.setItem('reliefos_theme_accent', next);
      }
      showToast(`Dynamic Palette Switched: ${next.toUpperCase()}`, 'info');
      return next;
    });
  }, [applyThemeAccent]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('reliefos_theme', next);
      }
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (next === 'dark') {
          root.classList.remove('light');
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
        }
      }
      return next;
    });
  }, []);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Login handler using local SQL backend
  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      const loggedUser = data.user;
      setUser(loggedUser);
      setRoleState(loggedUser.role);

      // On every click/login, dynamically change theme color!
      const nextAccent = loggedUser.themeAccent || ROLE_THEME_MAP[loggedUser.role] || 'red';
      setThemeAccent(nextAccent);
      applyThemeAccent(nextAccent);

      if (typeof window !== 'undefined') {
        localStorage.setItem('reliefos_auth_user', JSON.stringify(loggedUser));
        localStorage.setItem('reliefos_theme_accent', nextAccent);
      }

      showToast(`Welcome back, ${loggedUser.name}! Clearance: ${loggedUser.role.toUpperCase()}`, 'success');
      return loggedUser;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [applyThemeAccent]);

  // Quick 1-click login for hackathon judging demo
  const quickLogin = useCallback(async (targetRole) => {
    const roleAccounts = {
      admin: { email: 'admin@reliefos.org', password: 'admin123', accent: 'red' },
      camp_manager: { email: 'camp@reliefos.org', password: 'camp123', accent: 'amber' },
      volunteer: { email: 'volunteer@reliefos.org', password: 'vol123', accent: 'emerald' },
    };

    const target = roleAccounts[targetRole] || roleAccounts.admin;
    
    // Immediately change theme color on click!
    setThemeAccent(target.accent);
    applyThemeAccent(target.accent);

    try {
      return await login(target.email, target.password);
    } catch {
      // Fallback in case of network issue
      const fallbackUser = {
        id: `usr-${targetRole}-offline`,
        name: targetRole === 'admin' ? 'Commander Sarah Chen' : targetRole === 'camp_manager' ? 'Major Marcus Vance' : 'Alex Rivera',
        email: target.email,
        role: targetRole,
        themeAccent: target.accent,
        organization: 'ReliefOS Local Offline Response'
      };
      setUser(fallbackUser);
      setRoleState(targetRole);
      if (typeof window !== 'undefined') {
        localStorage.setItem('reliefos_auth_user', JSON.stringify(fallbackUser));
      }
      showToast(`Quick Login (Offline Cache): ${fallbackUser.name}`, 'success');
      return fallbackUser;
    }
  }, [login, applyThemeAccent]);

  // Signup handler inserting into local SQLite database
  const signup = useCallback(async (formData) => {
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      const createdUser = data.user;
      setUser(createdUser);
      setRoleState(createdUser.role);

      const nextAccent = createdUser.themeAccent || ROLE_THEME_MAP[createdUser.role] || 'emerald';
      setThemeAccent(nextAccent);
      applyThemeAccent(nextAccent);

      if (typeof window !== 'undefined') {
        localStorage.setItem('reliefos_auth_user', JSON.stringify(createdUser));
        localStorage.setItem('reliefos_theme_accent', nextAccent);
      }

      showToast(`Account registered in local SQL database! Welcome ${createdUser.name}`, 'success');
      return createdUser;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [applyThemeAccent]);

  // Logout handler (clears user, returns to login 1st screen)
  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reliefos_auth_user');
    }
    showToast('Logged out. Please authenticate to access command operations.', 'info');
  }, []);

  // Set role with theme change and clearance check (Asks for login when switching)
  const setRole = useCallback((newRole) => {
    const newAccent = ROLE_THEME_MAP[newRole] || 'blue';
    setThemeAccent(newAccent);
    applyThemeAccent(newAccent);

    if (!user || user.role !== newRole) {
      // Ask for login when switching!
      setPendingTargetRole(newRole);
      setIsAuthModalOpen(true);
    } else {
      setRoleState(newRole);
      showToast(`Active clearance: ${newRole.toUpperCase()}`, 'info');
    }
  }, [user, applyThemeAccent]);

  // Subscribe to offline queue count changes
  useEffect(() => {
    const unsub = subscribeQueue(count => {
      setPendingSyncCount(count);
    });

    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network connection restored. Auto-syncing queue...', 'success');
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Operating in OFFLINE mode. Actions are saved locally to IndexedDB.', 'warning');
    };

    const handleCustomTrigger = () => {
      syncNow();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('reliefos:trigger-sync', handleCustomTrigger);

    checkBackendHealth().then(healthy => {
      setIsMock(!healthy);
    });

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('reliefos:trigger-sync', handleCustomTrigger);
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await flushOfflineQueue(syncQueueAction);
      if (res.processed > 0) {
        showToast(`Successfully synced ${res.processed} pending actions.`, 'success');
      } else if (res.failed > 0) {
        showToast(`Sync failed for ${res.failed} items. Retrying when connection stabilizes.`, 'error');
      }
      setLastSyncTime(new Date().toLocaleTimeString());
      const updatedQueue = await getPendingQueue();
      setPendingSyncCount(updatedQueue.length);
    } catch (err) {
      showToast(`Sync error: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Real-time Emergency Alert Popup State
  const [activeAlert, setActiveAlert] = useState(null);
  const [seenAlertIds, setSeenAlertIds] = useState(new Set());

  const dismissAlert = useCallback(async (alertId) => {
    setActiveAlert(null);
    if (alertId) {
      try {
        await acknowledgeNotificationAction(alertId);
      } catch (e) {
        console.warn('Ack failed:', e);
      }
    }
  }, []);

  // Poll for live emergency alerts every 2.5 seconds across all screens
  useEffect(() => {
    let isSubscribed = true;

    const checkAlerts = async () => {
      try {
        const notifs = await fetchActiveNotifications({ role });
        if (!isSubscribed) return;
        if (notifs && notifs.length > 0) {
          const latest = notifs[0];
          setSeenAlertIds(prev => {
            if (!prev.has(latest.id)) {
              setActiveAlert(latest);
              showToast(`${latest.title}: ${latest.message}`, latest.type === 'sos_message' ? 'error' : 'info');
              const next = new Set(prev);
              next.add(latest.id);
              return next;
            }
            return prev;
          });
        }
      } catch (err) {}
    };

    checkAlerts();

    const handleSync = () => checkAlerts();
    if (typeof window !== 'undefined') {
      window.addEventListener('reliefos_db_sync', handleSync);
      window.addEventListener('storage', handleSync);
    }
    const pollInterval = setInterval(checkAlerts, 1500);

    return () => {
      isSubscribed = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('reliefos_db_sync', handleSync);
        window.removeEventListener('storage', handleSync);
      }
      clearInterval(pollInterval);
    };
  }, [role, user]);

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        setRole,
        isAuthChecked,
        themeAccent,
        changeThemeAccent,
        cycleThemeAccent,
        login,
        quickLogin,
        signup,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        pendingTargetRole,
        setPendingTargetRole,
        isOnline,
        setIsOnline,
        pendingSyncCount,
        isSyncing,
        syncNow,
        isMock,
        lastSyncTime,
        showToast,
        theme,
        setTheme,
        toggleTheme,
        activeAlert,
        dismissAlert,
        setActiveAlert
      }}
    >
      {children}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border text-sm backdrop-blur-md transition-all ${
          toastMessage.type === 'error'
            ? 'bg-red-950/90 text-red-200 border-red-500/50'
            : toastMessage.type === 'warning'
            ? 'bg-amber-950/90 text-amber-200 border-amber-500/50'
            : toastMessage.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            : 'bg-slate-900/90 text-slate-200 border-slate-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            toastMessage.type === 'error' ? 'bg-red-400 animate-ping' : 'bg-emerald-400'
          }`} />
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
