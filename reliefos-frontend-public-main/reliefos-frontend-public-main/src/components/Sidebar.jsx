import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/index.jsx';

export default function Sidebar() {
  const { role, summaryStats } = useAppStore();

  const allNavItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      adminOnly: true,
    },
    {
      to: '/resources',
      label: 'Resources',
      badge: summaryStats.criticalShortages > 0 ? `${summaryStats.criticalShortages} crit` : null,
      badgeColor: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      adminOnly: true,
    },
    {
      to: '/allocation',
      label: 'Allocation & Delivery',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      adminOnly: true,
    },
    {
      to: '/volunteers',
      label: 'Volunteers',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      adminOnly: false,
    },
    {
      to: '/verification',
      label: 'Field Verification',
      badge: summaryStats.activeDarkZones > 0 ? summaryStats.activeDarkZones : null,
      badgeColor: 'bg-[#FEE2E2] text-[#991B1B] border-[#F87171]',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      adminOnly: true,
    },
    {
      to: '/triage',
      label: 'Report Triage',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      adminOnly: true,
    },
    {
      to: '/mesh',
      label: 'Mesh Simulator',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      adminOnly: false,
    },
    {
      to: '/limits',
      label: 'Limits & Trade-offs',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      adminOnly: false,
    },
    {
      to: '/admin',
      label: 'Admin Panel',
      icon: (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      adminOnly: true,
    },
  ];

  // Volunteer sees only Volunteers, Mesh Simulator, Limits & Trade-offs
  const visibleNavItems = role === 'volunteer'
    ? allNavItems.filter(item => !item.adminOnly)
    : allNavItems;

  return (
    <aside className="flex w-64 flex-col justify-between bg-[#1F3D2B] p-4 text-white border-r border-[#173022]">
      <div className="space-y-6">
        <div>
          <div className="px-3 pb-2.5 text-xs font-bold uppercase tracking-wider text-emerald-200/75">
            {role === 'volunteer' ? 'Volunteer Mode' : 'Admin Navigation'}
          </div>
          <nav className="space-y-1.5">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F5E] ${
                    isActive
                      ? 'bg-[#2F5A3A] text-white shadow-xs font-semibold'
                      : 'text-white/85 hover:bg-[#274834] hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${item.badgeColor || 'bg-[#274834] text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer honesty disclaimer */}
      <div className="rounded-xl border border-[#2B4E38] bg-[#183022] p-3 text-xs text-emerald-100/80 leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
          <svg className="h-3.5 w-3.5 text-[#F59E0B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Honesty Note</span>
        </div>
        Weights are our assumptions, not validated. Automatic results are labeled Suggested.
      </div>
    </aside>
  );
}
