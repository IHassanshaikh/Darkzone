import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import { useAppStore } from '../store/index.jsx';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function AdminPage() {
  const {
    role,
    isDemoData,
    areas,
    camps,
    volunteers,
    duties,
    reports,
    activityLog,
    summaryStats,
  } = useAppStore();

  const dataAsOf = useMemo(
    () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    []
  );

  // Volunteer access guard
  if (role === 'volunteer') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-12 text-center shadow-2xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-rose-950">Admin access only</h2>
        <p className="mt-1 text-xs text-rose-800">
          Your current session is in Volunteer role mode. Switch to Admin role in the top header to view this panel.
        </p>
      </div>
    );
  }

  // 1. StatCard metrics computation
  const totalAreas = areas.length;
  const activeDarkZones = areas.filter((a) => a.assessment?.isDarkZone).length;
  const highRiskAreas = areas.filter((a) => a.hazardSeverity >= 0.7).length;
  const criticalShortages = summaryStats.criticalShortages;
  const totalCamps = camps.length;
  const totalOccupancy = camps.reduce((sum, c) => sum + (c.occupancy || 0), 0);
  const totalCapacity = camps.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const campOccupancyText = `${totalOccupancy} / ${totalCapacity}`;
  const reportsReceived = reports.length;
  const pendingVerifications = areas.filter(
    (a) =>
      a.assessment?.isDarkZone &&
      (!a.verification || a.verification === 'pending' || a.verification === 'team_sent')
  ).length;

  // 2. recharts chart datasets
  // Volunteers by status
  const volunteerStatusData = [
    { status: 'Available', count: volunteers.filter((v) => v.status === 'available').length, fill: '#10B981' },
    { status: 'On Duty', count: volunteers.filter((v) => v.status === 'on_duty').length, fill: '#0284C7' },
    { status: 'Offline', count: volunteers.filter((v) => v.status === 'offline').length, fill: '#64748B' },
  ];

  // Duties by status
  const dutyStatusData = [
    { status: 'Assigned', count: duties.filter((d) => d.status === 'assigned').length, fill: '#F59E0B' },
    { status: 'In Progress', count: duties.filter((d) => d.status === 'in_progress').length, fill: '#0284C7' },
    { status: 'Done', count: duties.filter((d) => d.status === 'done').length, fill: '#10B981' },
  ];

  // Total stock vs need
  const stockVsNeedData = ['food', 'water', 'medicine', 'relief'].map((item) => {
    const stock = camps.reduce((sum, c) => sum + (c.stock?.[item] || 0), 0);
    const need = camps.reduce((sum, c) => sum + (c.need?.[item] || 0), 0);
    return {
      item: item.charAt(0).toUpperCase() + item.slice(1),
      Stock: stock,
      Need: need,
    };
  });

  // Areas by risk level
  const areasByRiskData = [
    { level: 'Dark Zone', count: areas.filter((a) => a.assessment?.isDarkZone).length, fill: '#7C3AED' },
    {
      level: 'High Risk',
      count: areas.filter((a) => !a.assessment?.isDarkZone && a.hazardSeverity >= 0.7).length,
      fill: '#EF4444',
    },
    {
      level: 'Moderate/Low',
      count: areas.filter((a) => !a.assessment?.isDarkZone && a.hazardSeverity < 0.7).length,
      fill: '#10B981',
    },
  ];

  // 3. Deliveries card counts
  const deliveryDuties = duties.filter((d) => d.type === 'delivery');
  const deliveryCounts = {
    pending: deliveryDuties.filter((d) => d.status === 'assigned').length,
    inTransit: deliveryDuties.filter((d) => d.status === 'in_progress').length,
    delivered: deliveryDuties.filter((d) => d.status === 'done').length,
  };

  // 4. Recent activity log (last 10)
  const recentActivities = (activityLog || []).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header with Title, Data as of time, and Demo data chip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Admin Panel</h1>
          <p className="text-xs text-slate-500">
            System overview, resource telemetry, and operations monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Data as of <span className="font-semibold text-slate-700">{dataAsOf}</span>
          </span>

          {isDemoData && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
              Demo data
            </span>
          )}
        </div>
      </div>

      {/* 8 StatCards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Areas" value={totalAreas} variant="default" />
        <StatCard title="Active Dark Zones" value={activeDarkZones} variant="purple" />
        <StatCard title="High-risk Areas" value={highRiskAreas} variant="danger" />
        <StatCard title="Critical Shortages" value={criticalShortages} variant="danger" />
        <StatCard title="Camps" value={totalCamps} variant="default" />
        <StatCard title="Camp Occupancy" value={campOccupancyText} variant="info" />
        <StatCard title="Reports Received" value={reportsReceived} variant="default" />
        <StatCard title="Pending Verifications" value={pendingVerifications} variant="warning" />
      </div>

      {/* 2x2 recharts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Volunteers by status */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Volunteers by status</h3>
            <p className="text-xs text-slate-500">Current responder availability and assignment</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volunteerStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {volunteerStatusData.map((entry, idx) => (
                    <Cell key={`cell-vol-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Duties by status */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Duties by status</h3>
            <p className="text-xs text-slate-500">All task lifecycles (delivery, verification, support)</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dutyStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dutyStatusData.map((entry, idx) => (
                    <Cell key={`cell-duty-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Total stock vs need */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Total stock vs need</h3>
            <p className="text-xs text-slate-500">Summed inventory vs requirements across all camps</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockVsNeedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="item" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Stock" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Need" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Areas by risk level */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Areas by risk level</h3>
            <p className="text-xs text-slate-500">Breakdown of operational sectors by severity & silence</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areasByRiskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {areasByRiskData.map((entry, idx) => (
                    <Cell key={`cell-risk-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Deliveries card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#0F172A]">Deliveries</h3>
          <p className="text-xs text-slate-500">Resource transfer execution progress</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-bold">
              ⏳
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Pending</p>
              <p className="text-2xl font-black text-amber-900">{deliveryCounts.pending}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700 font-bold">
              🚚
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">In transit</p>
              <p className="text-2xl font-black text-sky-900">{deliveryCounts.inTransit}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
              ✅
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Delivered</p>
              <p className="text-2xl font-black text-emerald-900">{deliveryCounts.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Recent activity</h3>
            <p className="text-xs text-slate-500">Audit trail of critical operations and decisions</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {recentActivities.length} events
          </span>
        </div>

        {recentActivities.length === 0 ? (
          <EmptyState title="No activity yet." description="Operational actions will appear here in real-time." />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start justify-between py-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-6 items-center rounded-md px-2 text-[10px] font-bold ${
                      act.action === 'sendFieldTeam'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : act.action === 'verifyArea'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : act.action === 'approveTransfer'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {act.action}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{act.details}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 ml-3">
                  {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
