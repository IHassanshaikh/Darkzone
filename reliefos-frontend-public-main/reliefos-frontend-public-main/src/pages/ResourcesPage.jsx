import React from 'react';
import { useAppStore } from '../store/index.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function ResourcesPage() {
  const { camps } = useAppStore();

  const items = ['food', 'water', 'medicine', 'relief'];

  if (!camps || camps.length === 0) {
    return (
      <div className="py-8">
        <EmptyState title="No camps found." description="No displacement camps registered in the system." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Resources</h1>
        <p className="text-xs text-slate-500">
          Camp capacities, inventory stock levels, and supply shortage monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {camps.map((camp) => {
          // Check for critical shortage: any item with shortage >= 70% of need
          const hasCriticalShortage = items.some((item) => {
            const stock = (camp.stock || {})[item] || 0;
            const need = (camp.need || {})[item] || 0;
            const shortage = need - stock;
            return shortage > 0 && need > 0 && shortage / need >= 0.7;
          });

          return (
            <div
              key={camp.id}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs transition-all hover:border-slate-300"
            >
              {/* Header: Camp name & Status Badge */}
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">{camp.name}</h3>
                  <p className="text-xs text-slate-500">ID: {camp.id} • Lat: {camp.lat}, Lng: {camp.lng}</p>
                </div>
                {hasCriticalShortage ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    Critical shortage
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    OK
                  </span>
                )}
              </div>

              {/* Occupancy */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Occupancy</span>
                  <span className="text-slate-900">{camp.occupancy} / {camp.capacity}</span>
                </div>
                <ProgressBar
                  value={camp.occupancy}
                  max={camp.capacity}
                  variant="auto"
                  size="sm"
                />
              </div>

              {/* Resource Rows: Food, Water, Medicine, Relief */}
              <div className="mt-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Supplies (Stock vs Need)
                </div>
                {items.map((item) => {
                  const stock = (camp.stock || {})[item] || 0;
                  const need = (camp.need || {})[item] || 0;
                  const shortage = Math.max(0, need - stock);
                  const isShortage = shortage > 0;

                  return (
                    <div
                      key={item}
                      className={`rounded-xl border p-3 transition-colors ${
                        isShortage
                          ? 'border-rose-200 bg-rose-50/60'
                          : 'border-[#E2E8F0] bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <span className="font-semibold text-slate-800 capitalize">{item}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">
                            Stock: <strong className="text-slate-900">{stock}</strong> / Need: <strong className="text-slate-900">{need}</strong>
                          </span>
                          {isShortage && (
                            <span className="font-bold text-rose-600">
                              Shortage: {shortage}
                            </span>
                          )}
                        </div>
                      </div>
                      <ProgressBar
                        value={stock}
                        max={need || stock || 1}
                        variant={isShortage ? 'danger' : 'success'}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
