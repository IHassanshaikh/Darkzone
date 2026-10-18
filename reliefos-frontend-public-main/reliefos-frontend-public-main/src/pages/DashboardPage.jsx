import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/index.jsx';
import StatCard from '../components/StatCard.jsx';
import SuggestedChip from '../components/SuggestedChip.jsx';
import TagChip from '../components/TagChip.jsx';
import ScoreGauge from '../components/ScoreGauge.jsx';
import DashboardMap from '../components/DashboardMap.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { summaryStats, areas, camps, priorityList } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRowClick = (item) => {
    if (item.kind === 'area') {
      navigate(`/areas/${item.id}`);
    } else {
      // If camp row, navigate to resources page with camp context
      navigate('/resources');
    }
  };

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Dashboard Telemetry Error"
          message={error}
          onRetry={() => {
            setError(null);
            setIsLoading(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Disaster Operations Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time multi-camp coordination, Dark Zone gap detection, and prioritized field actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SuggestedChip text="Automated Triage Active" />
        </div>
      </div>

      {/* 4 StatCards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Dark Zones"
            value={summaryStats.activeDarkZones}
            subtitle="Areas with high silence ratio"
            variant="danger"
            highlight={summaryStats.activeDarkZones > 0}
            icon={
              <svg className="h-5 w-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <StatCard
            title="Critical Shortages"
            value={summaryStats.criticalShortages}
            subtitle="Stock below 30% of need"
            variant="warning"
            icon={
              <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            title="Volunteers Active"
            value={summaryStats.volunteersActive}
            subtitle="Deployed or ready"
            variant="success"
            icon={
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            title="Deliveries In Transit"
            value={summaryStats.deliveriesInTransit}
            subtitle="Supply routes moving"
            variant="info"
            icon={
              <svg className="h-5 w-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          />
        </div>
      )}

      {/* Leaflet Map: Camp pins, Green/Red/Purple area circles, Legend & Popups */}
      {isLoading ? (
        <Skeleton className="h-[440px]" />
      ) : (
        <DashboardMap areas={areas} camps={camps} />
      )}

      {/* Unified Priority List */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Unified Priority Action Queue</h2>
            <p className="text-xs text-slate-500">
              Ranked urgency list. Silent Risk Dark Zones are served first, followed by reported needs. Click any row to view sector details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TagChip tag="Unified Matrix" variant="silent_risk" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" count={3} />
          </div>
        ) : priorityList.length === 0 ? (
          <EmptyState
            title="No active priority targets"
            description="All camps and disaster areas are currently operating at stable capacity."
          />
        ) : (
          <div className="space-y-2.5">
            {priorityList.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                onClick={() => handleRowClick(item)}
                className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-all hover:bg-white hover:border-sky-300 hover:shadow-xs cursor-pointer"
              >
                <div className="flex items-start gap-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E2E8F0] text-xs font-black text-[#0F172A] group-hover:border-sky-300 group-hover:text-sky-700 transition-colors">
                    #{item.rank}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#0F172A] uppercase group-hover:text-sky-700 transition-colors">
                        {item.id}
                      </span>
                      <TagChip tag={item.tag} variant={item.tag === 'Silent Risk' ? 'silent_risk' : 'reported'} />
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                        {item.kind}
                      </span>
                      <SuggestedChip />
                    </div>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                      <span>Reason:</span>
                      <strong className="text-slate-800">{item.reasons.join(' • ')}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <ScoreGauge score={item.urgency} label="Urgency" size="sm" />
                  <span className="text-xs text-slate-400 group-hover:text-sky-600 transition-colors font-medium">
                    View Sector →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
