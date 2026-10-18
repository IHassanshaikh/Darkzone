'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sun, 
  Moon, 
  Palette, 
  User, 
  LogOut, 
  KeyRound,
  ShieldCheck,
  Tent,
  UserCheck,
  Smartphone
} from 'lucide-react';

const ACCENT_COLORS = {
  red: { label: 'Red (Admin)', dot: 'bg-red-500' },
  amber: { label: 'Amber (Camp)', dot: 'bg-amber-500' },
  emerald: { label: 'Emerald (Vol)', dot: 'bg-emerald-500' },
  blue: { label: 'Blue', dot: 'bg-blue-500' },
  purple: { label: 'Purple', dot: 'bg-purple-500' },
  cyan: { label: 'Cyan', dot: 'bg-cyan-500' }
};

export default function Navbar() {
  const {
    user,
    role,
    setRole,
    quickLogin,
    logout,
    themeAccent,
    changeThemeAccent,
    cycleThemeAccent,
    setIsAuthModalOpen,
    setPendingTargetRole,
    isOnline,
    setIsOnline,
    pendingSyncCount,
    isSyncing,
    syncNow,
    theme,
    toggleTheme
  } = useApp();

  const handleRoleClick = (targetRole, defaultAccent) => {
    // Change theme color dynamically on every click!
    changeThemeAccent(defaultAccent);

    if (role === targetRole) {
      cycleThemeAccent();
    } else {
      // Ask for login when switching role!
      if (setPendingTargetRole) setPendingTargetRole(targetRole);
      setIsAuthModalOpen(true);
    }
  };

  const accentInfo = ACCENT_COLORS[themeAccent] || ACCENT_COLORS.red;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Operational Tag */}
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.webp"
            alt="ReliefOS Logo"
            className="w-8 h-8 rounded-lg object-contain shadow-sm border border-slate-200 dark:border-slate-800"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                ReliefOS
              </span>
            </div>
            <p className="hidden md:block text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              DISASTER RESPONSE COMMAND
            </p>
          </div>
        </Link>

        {/* Center / Right Control Panel */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </button>

          {/* Network Simulator Toggle / Indicator */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            title="Click to toggle Network simulation (Online / Offline)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                : 'bg-rose-50 text-rose-800 border-rose-400 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span className="text-emerald-800 dark:text-emerald-300 text-[11px] font-bold hidden sm:inline">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                <span className="text-rose-800 dark:text-rose-300 text-[11px] font-bold">OFFLINE</span>
              </>
            )}
          </button>

          {/* Pending Sync Badge (only shown when there are pending actions) */}
          {pendingSyncCount > 0 && (
            <button
              onClick={syncNow}
              disabled={isSyncing}
              title="Click to synchronize queued actions to server"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">Sync ({pendingSyncCount})</span>
            </button>
          )}

          {/* Citizen SOS Mobile App Launcher */}
          <Link
            href="/mobile"
            title="Launch User (Affected Person) Mobile Application"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Citizen SOS App</span>
          </Link>

          {/* ROLE SWITCHER BUTTONS (Changes theme color dynamically on every click) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              id="role-admin"
              onClick={() => handleRoleClick('admin', 'red')}
              title="Switch as Rescue Coordinator (Theme: RED)"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                role === 'admin'
                  ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${role === 'admin' ? 'text-white' : 'text-red-500'}`} />
              <span className="hidden md:inline">Admin</span>
              <span className="md:hidden">Adm</span>
            </button>

            <button
              id="role-camp-manager"
              onClick={() => handleRoleClick('camp_manager', 'amber')}
              title="Switch as Camp Manager (Theme: AMBER)"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                role === 'camp_manager'
                  ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-400 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Tent className={`w-3.5 h-3.5 ${role === 'camp_manager' ? 'text-white' : 'text-amber-500'}`} />
              <span className="hidden md:inline">Camp Mgr</span>
              <span className="md:hidden">Camp</span>
            </button>

            <button
              id="role-volunteer"
              onClick={() => handleRoleClick('volunteer', 'emerald')}
              title="Switch as Field Volunteer (Theme: EMERALD)"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                role === 'volunteer'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${role === 'volunteer' ? 'text-white' : 'text-emerald-500'}`} />
              <span className="hidden md:inline">Volunteer</span>
              <span className="md:hidden">Vol</span>
            </button>
          </div>

          {/* User Account / Re-login Modal Trigger */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                title="Click to switch profile or inspect SQL login accounts"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full theme-accent-bg flex items-center justify-center text-white text-[10px] font-bold">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <span className="hidden xl:inline text-[11px] font-semibold max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Switch
                </span>
              </button>

              <button
                onClick={logout}
                title="Sign Out (Returns to 1st Login Screen)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg theme-accent-bg text-white text-xs font-bold shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
