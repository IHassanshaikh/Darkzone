'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../src/context/AppContext';
import CommandDashboard from '../src/views/CommandDashboard';

export default function Page() {
  const { role } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (role === 'volunteer') {
      router.replace('/volunteer');
    } else if (role === 'camp_manager') {
      router.replace('/camp-manager');
    }
  }, [role, router]);

  if (role === 'volunteer' || role === 'camp_manager') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-semibold text-slate-500">
        Redirecting to {role === 'volunteer' ? 'Volunteer Tasks' : 'Camp Operations'}...
      </div>
    );
  }

  return <CommandDashboard />;
}
