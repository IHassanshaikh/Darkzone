'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  MapPin, 
  Boxes, 
  Truck, 
  UserCheck, 
  Users, 
  ShieldAlert, 
  FileSearch, 
  Map,
  Tent,
  ClipboardCheck,
  Smartphone
} from 'lucide-react';

// All nav links with role access lists
const ALL_LINKS = [
  // Admin / Rescue Coordinator
  { to: '/',              label: 'Dashboard',            icon: LayoutDashboard, roles: ['admin'] },
  { to: '/resources',    label: 'Resources',            icon: Boxes,           roles: ['admin'] },
  { to: '/allocation',   label: 'Allocation & Delivery',icon: Truck,           roles: ['admin'] },
  { to: '/volunteers',   label: 'Volunteers',           icon: Users,           roles: ['admin', 'volunteer'] },
  { to: '/verification', label: 'Field Verification',   icon: ClipboardCheck,  roles: ['admin'] },
  { to: '/triage',       label: 'Report Triage',        icon: FileSearch,      roles: ['admin'] },
  { to: '/admin',        label: 'Admin Panel',          icon: ShieldAlert,     roles: ['admin'] },
  { to: '/mobile',       label: 'Citizen SOS App',      icon: Smartphone,      roles: ['admin', 'camp_manager', 'volunteer'] },

  // Camp Manager
  { to: '/camp-manager', label: 'Camp Operations',      icon: LayoutDashboard, roles: ['camp_manager'] },
  { to: '/resources',    label: 'Inventory & Stock',    icon: Boxes,           roles: ['camp_manager'] },
  { to: '/allocation',   label: 'Deliveries & Intake',  icon: Truck,           roles: ['camp_manager'] },
  { to: '/camps',        label: 'All Camps Overview',   icon: Tent,            roles: ['camp_manager'] },
  { to: '/field-map',    label: 'Field Map',            icon: Map,             roles: ['camp_manager'] },

  // Field Volunteer
  { to: '/volunteer',    label: 'My Duties',            icon: UserCheck,       roles: ['volunteer'] },
  { to: '/field-map',    label: 'Field Map',            icon: Map,             roles: ['volunteer'] },
  { to: '/camps',        label: 'Camps & Stock',        icon: Tent,            roles: ['volunteer'] },
];

const ROLE_META = {
  admin:        { label: 'Rescue Coordinator', sectionLabel: 'Command Operations', dot: 'bg-red-500',    color: 'text-red-600 dark:text-red-400' },
  camp_manager: { label: 'Camp Manager',       sectionLabel: 'Camp Operations',    dot: 'bg-amber-500',  color: 'text-amber-600 dark:text-amber-400' },
  volunteer:    { label: 'Field Volunteer',    sectionLabel: 'Field Operations',   dot: 'bg-emerald-500',color: 'text-emerald-600 dark:text-emerald-400' },
};

export default function Sidebar() {
  const { role } = useApp();
  const pathname = usePathname();

  const links = ALL_LINKS.filter(l => l.roles.includes(role));
  const meta = ROLE_META[role] ?? ROLE_META.admin;

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col justify-between py-4 px-3 min-h-[calc(100vh-61px)] transition-colors">
      <div className="space-y-1">
        {/* Active role banner */}
        <div className="px-3 py-2 mb-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${meta.color}`}>
              {meta.label}
            </span>
          </div>
        </div>

        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {meta.sectionLabel}
        </div>

        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.to || 
            (pathname === '/' && role === 'camp_manager' && link.to === '/camp-manager') ||
            (pathname === '/' && role === 'volunteer' && link.to === '/volunteer');

          return (
            <Link
              key={link.to}
              href={link.to}
              className={`
                group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors
                ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border-l-4 theme-accent-border font-bold dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                }
              `}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'theme-accent-text' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400'}`} />
                <span>{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Profile & Clearance Status at Bottom (Footer) */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span className="font-semibold">Local SQLite DB:</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">reliefos.sql</span>
        </div>
        <div className="flex items-center gap-2 px-1 pt-1 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
          <img src="/logo.webp" alt="ReliefOS" className="w-4 h-4 rounded object-contain opacity-80" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">ReliefOS</span>
          <span className="text-[10px] font-mono text-slate-400">DARK ZONE</span>
        </div>
      </div>
    </aside>
  );
}
