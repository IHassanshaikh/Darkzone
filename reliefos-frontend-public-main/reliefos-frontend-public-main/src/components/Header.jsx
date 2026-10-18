import React from 'react';
import { useAppStore } from '../store/index.jsx';

export default function Header() {
  const { role, setRole, isOnline, isDemoData, pendingSyncCount } = useAppStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#173022] bg-[#1F3D2B] px-6 text-white shadow-xs">
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F5A3A] text-white border border-[#3E6F4D] shadow-xs">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-white font-heading">ReliefOS</span>
            <span className="rounded-full bg-[#F5F3FF] px-2 py-0.5 text-xs font-bold text-[#7C3AED] border border-[#A78BFA]">
              DARK ZONE
            </span>
          </div>
          <p className="text-xs font-medium text-emerald-100/75">Finding who needs help most</p>
        </div>
      </div>

      {/* Right: Chips & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Demo Data Chip */}
        {isDemoData && (
          <div className="flex items-center gap-1.5 rounded-full border border-[#376145] bg-[#244230] px-3 py-1 text-xs font-semibold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Demo data</span>
          </div>
        )}

        {/* Online / Offline Status Chip */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            isOnline
              ? 'border-[#16A34A]/50 bg-[#16A34A]/20 text-emerald-100'
              : 'border-[#D97706]/50 bg-[#D97706]/20 text-amber-200 animate-pulse'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isOnline ? 'bg-[#16A34A]' : 'bg-[#D97706] animate-ping'
            }`}
          />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
          {pendingSyncCount > 0 && (
            <span className="ml-1 rounded-full bg-[#D97706] px-2 py-0.5 text-xs font-bold text-white">
              {pendingSyncCount} pending
            </span>
          )}
        </div>

        {/* Role Switcher: "Admin" and "Volunteer" */}
        <div className="flex items-center rounded-xl border border-[#2B4E38] bg-[#162D20] p-1 text-xs">
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all focus-visible:outline-2 focus-visible:outline-[#6B8F5E] ${
              role === 'admin'
                ? 'bg-[#2F5A3A] text-white shadow-xs font-bold border border-[#3E6F4D]'
                : 'text-emerald-100/75 hover:text-white'
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('volunteer')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all focus-visible:outline-2 focus-visible:outline-[#6B8F5E] ${
              role === 'volunteer'
                ? 'bg-[#2F5A3A] text-white shadow-xs font-bold border border-[#3E6F4D]'
                : 'text-emerald-100/75 hover:text-white'
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Volunteer</span>
          </button>
        </div>
      </div>
    </header>
  );
}
