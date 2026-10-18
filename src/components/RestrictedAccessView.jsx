'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function RestrictedAccessView({ routePath, requiredRoles = ['admin'] }) {
  const { role, setPendingTargetRole, setIsAuthModalOpen, changeThemeAccent } = useApp();

  const primaryRequiredRole = requiredRoles[0] || 'admin';
  const roleNames = {
    admin: 'Admin',
    camp_manager: 'Camp Manager',
    volunteer: 'Volunteer'
  };

  const handleSwitchClick = () => {
    const accentMap = { admin: 'red', camp_manager: 'amber', volunteer: 'emerald' };
    changeThemeAccent(accentMap[primaryRequiredRole] || 'red');
    if (setPendingTargetRole) setPendingTargetRole(primaryRequiredRole);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 space-y-4">
        
        <div className="w-12 h-12 mx-auto rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            This page requires <strong>{roleNames[primaryRequiredRole]}</strong> clearance. You are currently logged in as <strong>{roleNames[role] || role}</strong>.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={handleSwitchClick}
            className="w-full py-2 px-3 rounded-lg theme-accent-bg font-bold text-xs shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
          >
            <span>Switch to {roleNames[primaryRequiredRole]} & Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <Link
            href={role === 'camp_manager' ? '/camp-manager' : role === 'volunteer' ? '/volunteer' : '/'}
            className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to My Dashboard</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
