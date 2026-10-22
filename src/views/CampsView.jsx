'use client';

import React, { useState, useEffect } from 'react';
import { fetchCamps, addSafeZoneAction, skipSyncFor } from '../lib/api';
import { Tent, Droplet, Utensils, Pill, Package, RefreshCw, AlertTriangle, CheckCircle2, Users, Plus, X, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ITEM_META = {
  water:    { label: 'Water',     icon: Droplet,   color: 'text-sky-400',     bg: 'bg-sky-950',     border: 'border-sky-500/30' },
  food:     { label: 'Food',      icon: Utensils,  color: 'text-amber-400',   bg: 'bg-amber-950',   border: 'border-amber-500/30' },
  medicine: { label: 'Medicine',  icon: Pill,      color: 'text-rose-400',    bg: 'bg-rose-950',    border: 'border-rose-500/30' },
  relief:   { label: 'Relief',    icon: Package,   color: 'text-purple-400',  bg: 'bg-purple-950',  border: 'border-purple-500/30' },
};

function StockBar({ stock, need, item }) {
  const pct = need > 0 ? Math.min(Math.round((stock / need) * 100), 100) : 100;
  const isShort = stock < need;
  const meta = ITEM_META[item] || {};
  const Icon = meta.icon || Package;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3 h-3 ${meta.color || 'text-slate-400'}`} />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{meta.label || item}</span>
        </div>
        <span className={`font-bold ${isShort ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {stock} / {need}
          {isShort && <span className="ml-1 text-red-600 dark:text-red-300">(-{need - stock})</span>}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct < 40 ? 'bg-red-500' : pct < 70 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CampsView() {
  const { showToast } = useApp ? useApp() : { showToast: () => {} };
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Camp Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampLat, setNewCampLat] = useState('24.8720');
  const [newCampLng, setNewCampLng] = useState('67.0450');
  const [newCampCapacity, setNewCampCapacity] = useState(300);
  const [creating, setCreating] = useState(false);

  const loadCamps = async () => {
    setLoading(true);
    try {
      const data = await fetchCamps();
      setCamps(data);
    } catch (err) {
      console.error('Failed to load camps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCamps();
  }, []);

  const handleCreateCampSubmit = async (e) => {
    e.preventDefault();
    if (!newCampName.trim()) return;
    setCreating(true);
    skipSyncFor(4000);
    try {
      await addSafeZoneAction({
        name: newCampName.trim(),
        lat: parseFloat(newCampLat),
        lng: parseFloat(newCampLng),
        capacity: Number(newCampCapacity),
        type: 'camp'
      });
      if (showToast) showToast(`New camp "${newCampName}" created successfully!`, 'success');
      setShowCreateModal(false);
      setNewCampName('');
      await loadCamps();
    } catch (err) {
      if (showToast) showToast(`Failed to create camp: ${err.message}`, 'error');
    } finally {
      setCreating(false);
    }
  };

  const shortageCount = camps.filter(c => (c.items || []).some(i => i.need > i.stock)).length;

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-52 bg-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm sm:text-base font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
            RELIEF HUBS // INVENTORY TELEMETRY
          </h1>
          {shortageCount > 0 && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              {shortageCount} SHORTAGE{shortageCount > 1 ? 'S' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Camp</span>
          </button>
          <button
            type="button"
            onClick={loadCamps}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {camps.map(camp => {
          const hasShortage = (camp.items || []).some(i => i.need > i.stock);
          const occupancyPct = camp.capacity ? Math.round((camp.occupancy / camp.capacity) * 100) : 0;
          return (
            <div
              key={camp.id}
              className={`rounded-xl p-3.5 border flex flex-col gap-1 ${
                hasShortage
                  ? 'bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-500/30'
                  : 'bg-white border-slate-200 dark:bg-slate-900/60 dark:border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Tent className={`w-3.5 h-3.5 flex-shrink-0 ${hasShortage ? 'text-red-600 dark:text-red-400' : 'text-sky-600 dark:text-sky-400'}`} />
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{camp.name.split('(')[0].trim()}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  {camp.occupancy}/{camp.capacity}
                </span>
                <span className={`font-bold ${occupancyPct >= 90 ? 'text-red-600 dark:text-red-400' : occupancyPct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {occupancyPct}%
                </span>
              </div>
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${occupancyPct >= 90 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed camp cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {camps.map(camp => {
          const hasShortage = (camp.items || []).some(i => i.need > i.stock);
          const occupancyPct = camp.capacity ? Math.round((camp.occupancy / camp.capacity) * 100) : 0;
          const shortageItems = (camp.items || []).filter(i => i.need > i.stock);

          return (
            <div
              key={camp.id}
              className={`glass-panel rounded-2xl border p-5 space-y-4 ${
                hasShortage ? 'border-red-200 dark:border-red-500/30' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Camp header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    hasShortage ? 'bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-500/30' : 'bg-sky-50 border border-sky-200 dark:bg-sky-950 dark:border-sky-500/30'
                  }`}>
                    <Tent className={`w-4 h-4 ${hasShortage ? 'text-red-600 dark:text-red-400' : 'text-sky-600 dark:text-sky-400'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{camp.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />
                      {camp.occupancy} / {camp.capacity} occupants
                      <span className={`ml-1 font-bold ${occupancyPct >= 90 ? 'text-red-600 dark:text-red-400' : occupancyPct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ({occupancyPct}%)
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex-shrink-0 flex items-center gap-1 ${
                  hasShortage
                    ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-500/40'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/40'
                }`}>
                  {hasShortage
                    ? <><AlertTriangle className="w-2.5 h-2.5" /> Shortage</>
                    : <><CheckCircle2 className="w-2.5 h-2.5" /> Stable</>
                  }
                </span>
              </div>

              {/* Shortage alert */}
              {hasShortage && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-500/30 text-[11px] text-red-800 dark:text-red-300">
                  <span className="font-bold">Critical shortage:</span>{' '}
                  {shortageItems.map(i => `${ITEM_META[i.item]?.label || i.item} (-${i.need - i.stock})`).join(', ')}
                </div>
              )}

              {/* Occupancy bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Occupancy</span>
                  <span className={`font-bold ${occupancyPct >= 90 ? 'text-red-600 dark:text-red-400' : occupancyPct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {occupancyPct}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${occupancyPct >= 90 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stock items */}
              <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                {(camp.items || []).map(stockItem => (
                  <StockBar
                    key={stockItem.item}
                    stock={stockItem.stock}
                    need={stockItem.need}
                    item={stockItem.item}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Camp Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tent className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase font-mono">
                  CREATE NEW RELIEF CAMP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampSubmit} className="space-y-4">
              <div>
                <label htmlFor="camps-new-camp-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Camp Name / Shelter Identifier
                </label>
                <input
                  type="text"
                  id="camps-new-camp-name"
                  name="campsNewCampName"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="e.g. Camp E (Highland Stadium)"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="camps-new-camp-lat" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="camps-new-camp-lat"
                    name="campsNewCampLat"
                    value={newCampLat}
                    onChange={(e) => setNewCampLat(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="camps-new-camp-lng" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="camps-new-camp-lng"
                    name="campsNewCampLng"
                    value={newCampLng}
                    onChange={(e) => setNewCampLng(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="camps-new-camp-capacity" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Shelter Capacity (Persons)
                </label>
                <input
                  type="number"
                  id="camps-new-camp-capacity"
                  name="campsNewCampCapacity"
                  min="10"
                  max="10000"
                  value={newCampCapacity}
                  onChange={(e) => setNewCampCapacity(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newCampName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creating ? 'Creating...' : 'Create Relief Camp'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
