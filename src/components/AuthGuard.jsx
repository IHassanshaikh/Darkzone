'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import LoginView from '../views/LoginView';
import RestrictedAccessView from './RestrictedAccessView';

// Route clearance access table
const ROUTE_RULES = [
  // Admin only
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/verification', roles: ['admin'] },
  { prefix: '/areas', roles: ['admin'] },
  { prefix: '/triage', roles: ['admin'] },
  { prefix: '/reports', roles: ['admin'] },
  { prefix: '/volunteers', roles: ['admin', 'volunteer'] },

  // Admin and Camp Manager
  { prefix: '/camp-manager', roles: ['admin', 'camp_manager'] },
  { prefix: '/allocation', roles: ['admin', 'camp_manager'] },
  { prefix: '/resources', roles: ['admin', 'camp_manager'] },

  // Admin and Volunteer
  { prefix: '/volunteer', roles: ['admin', 'volunteer'] },

  // Shared routes
  { prefix: '/field-map', roles: ['admin', 'camp_manager', 'volunteer'] },
  { prefix: '/camps', roles: ['admin', 'camp_manager', 'volunteer'] },
  { prefix: '/login', roles: ['admin', 'camp_manager', 'volunteer'] },
];

const ROLE_HOMEPAGES = {
  admin: '/',
  camp_manager: '/camp-manager',
  volunteer: '/volunteer'
};

function getRouteAllowedRoles(pathname) {
  if (!pathname || pathname === '/') {
    // Root dashboard is Rescue Coordinator (Admin) Command Center
    return ['admin'];
  }
  for (const rule of ROUTE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + '/')) {
      return rule.roles;
    }
  }
  return ['admin', 'camp_manager', 'volunteer'];
}

export default function AuthGuard({ children }) {
  const { user, role, isAuthChecked } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  // If on explicit /login page, always render LoginView directly
  if (pathname === '/login') {
    return <LoginView />;
  }

  // Citizen Mobile App is public for affected people in disaster zones
  if (pathname === '/mobile') {
    return children;
  }

  const allowedRoles = getRouteAllowedRoles(pathname);
  const isAllowed = !user || allowedRoles.includes(role);

  // If authenticated user switches to a role that is restricted on current route,
  // automatically redirect to their authorized role dashboard!
  useEffect(() => {
    if (user && !allowedRoles.includes(role)) {
      const dest = ROLE_HOMEPAGES[role] || '/volunteer';
      router.replace(dest);
    }
  }, [user, role, pathname, allowedRoles, router]);

  // 1. Initial hydration check
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full theme-accent-bg animate-ping" />
          <span className="text-xs font-semibold text-slate-500">
            Checking clearance...
          </span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated check: 1st screen MUST be the Login screen!
  if (!user) {
    return <LoginView targetRestrictedRoute={pathname !== '/' && pathname !== '/login' ? pathname : null} />;
  }

  // 3. Page-level role restriction: If not allowed, show Restricted Access screen (NEVER show restricted page!)
  if (!isAllowed) {
    return <RestrictedAccessView routePath={pathname} requiredRoles={allowedRoles} />;
  }

  return children;
}
