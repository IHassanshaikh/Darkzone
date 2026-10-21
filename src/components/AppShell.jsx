'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AuthGuard, { ROLE_HOMEPAGES } from './AuthGuard';
import SwitchRoleModal from './SwitchRoleModal';
import LoginView from '../views/LoginView';
import GlobalEmergencyPopup from './GlobalEmergencyPopup';

export default function AppShell({ children }) {
  const { user, role, isAuthChecked } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  // If already authenticated and on /login page, redirect to role home
  useEffect(() => {
    if (isAuthChecked && user && pathname === '/login') {
      const dest = ROLE_HOMEPAGES[role] || '/';
      router.replace(dest);
    }
  }, [isAuthChecked, user, role, pathname, router]);

  // 1. If on /mobile route, render the citizen mobile application directly immediately
  if (pathname === '/mobile') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
        <GlobalEmergencyPopup />
        {children}
      </main>
    );
  }

  // 2. Initial hydration check
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full theme-accent-bg animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Initializing ReliefOS Clearance...
          </span>
        </div>
      </div>
    );
  }

  // 3. If unauthenticated, the 1st screen presented MUST be the Login screen!
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <GlobalEmergencyPopup />
        <LoginView targetRestrictedRoute={pathname !== '/' && pathname !== '/login' ? pathname : null} />
      </main>
    );
  }

  // 4. Authenticated user explicitly on /login route: show LoginView while useEffect redirects to home
  if (pathname === '/login') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <GlobalEmergencyPopup />
        <LoginView />
      </main>
    );
  }

  // 3. Authenticated: Render Full Command Center Shell with Navbar, Sidebar, Page Guard & Role Switcher
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      <GlobalEmergencyPopup />
      <Navbar />
      <div className="flex-1 flex flex-row">
        <Sidebar />
        <main className="flex-1 overflow-y-auto max-h-[calc(100vh-61px)]">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </div>
      <SwitchRoleModal />
    </div>
  );
}
