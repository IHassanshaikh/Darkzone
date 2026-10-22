'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCamps, queryGeminiAI } from '../lib/api';
import { 
  Boxes, 
  Droplet, 
  Utensils, 
  Stethoscope, 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Truck,
  Sparkles,
  Bot,
  Zap,
  RefreshCw 
} from 'lucide-react';

export default function Resources() {
  const router = useRouter();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic AI Inventory State
  const [aiInventoryBrief, setAiInventoryBrief] = useState(
    'AI Inventory Synthesis: Evaluating multi-hub stock balances. Camp B drinking water reserve is under burn rate threshold. Inter-camp transfers from Camp A surplus hub recommended to ensure uninterrupted supply.'
  );
  const [isAiInventoryLoading, setIsAiInventoryLoading] = useState(false);

  const handleRunInventoryAnalysis = async () => {
    setIsAiInventoryLoading(true);
    try {
      const res = await queryGeminiAI({
        task: 'camp_forecast',
        prompt: `Analyze multi-camp inventory reserves across ${camps.length} camps: ${JSON.stringify(camps.map(c => ({ name: c.name, items: c.items, occupancy: c.occupancy })))}. Highlight acute deficits and recommend balanced redistribution.`,
        context: { campsCount: camps.length }
      });
      if (res?.response) {
        setAiInventoryBrief(res.response);
      }
    } catch (err) {
      console.warn('AI inventory error:', err);
    } finally {
      setIsAiInventoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps().then(data => {
      setCamps(data);
      setLoading(false);
    });
  }, []);

  const getItemIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'water': return Droplet;
      case 'food': return Utensils;
      case 'medicine': return Stethoscope;
      default: return Package;
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm sm:text-base font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
            CAMP SUPPLY RESERVES // INVENTORY
          </h1>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            4 HUBS
          </span>
        </div>

        <button
          onClick={() => router.push('/allocation')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Dispatch Optimizer</span>
        </button>
      </div>

      {/* AI INVENTORY BALANCING FORECASTER */}
      <div className="rounded-xl border border-[#2D4A22]/30 bg-gradient-to-r from-[#1C3315]/10 via-[#2D4A22]/15 to-[#3E6630]/10 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D4A22]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#1C3315] via-[#2D4A22] to-[#3E6630] text-white">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider">
                  AI MULTI-HUB INVENTORY BALANCING
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  reliefos-ai
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Automated stockout timeline • Burn-rate disparity detection • Inter-hub transfer recommendations
              </p>
            </div>
          </div>
          <button
            onClick={handleRunInventoryAnalysis}
            disabled={isAiInventoryLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#1C3315] via-[#2D4A22] to-[#3E6630] hover:opacity-95 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiInventoryLoading ? 'animate-spin' : ''}`} />
            <span>{isAiInventoryLoading ? 'Analyzing Reserves...' : 'Re-Analyze Inventory'}</span>
          </button>
        </div>
        <div className="mt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-lg p-3 border border-[#2D4A22]/20 flex items-start gap-2.5">
          <Bot className="w-4 h-4 text-[#2D4A22] dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium whitespace-pre-line">
            {aiInventoryBrief}
          </div>
        </div>
      </div>

      {/* Camp Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {camps.map((camp) => {
          const hasCriticalWater = camp.id === 'camp-b';
          const items = camp.items || [];

          return (
            <div
              key={camp.id}
              className={`rounded-lg p-5 border bg-white dark:bg-slate-900 transition-colors shadow-sm ${
                hasCriticalWater
                  ? 'border-red-300 dark:border-red-900 border-l-4 border-l-red-600'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>{camp.name}</span>
                    {hasCriticalWater && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-900">
                        CRITICAL SHORTAGE
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Capacity: {camp.occupancy} / {camp.capacity} evacuees • Min Reserve: {camp.minReserve || 40} units
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Occupancy</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {camp.capacity ? Math.round((camp.occupancy / camp.capacity) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 mt-4">
                {items.map((item) => {
                  const Icon = getItemIcon(item.item);
                  const stock = item.stock || 0;
                  const need = item.need || 0;
                  const shortage = need - stock;
                  const isDeficit = shortage > 0;
                  const isCritical = hasCriticalWater && item.item.toLowerCase() === 'water';

                  const percentage = Math.min(100, Math.round((stock / (need || 1)) * 100));

                  return (
                    <div key={item.item} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isCritical ? 'text-red-600' : 'text-slate-500'}`} />
                          <span className={`font-semibold capitalize ${isCritical ? 'text-red-700 dark:text-red-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.item}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">
                            {stock} / {need} units
                          </span>
                          {isDeficit && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCritical 
                                ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950 dark:text-red-300' 
                                : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              -{shortage} shortage
                            </span>
                          )}
                          {!isDeficit && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Surplus
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isCritical
                              ? 'bg-red-600'
                              : isDeficit
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Footer */}
              {hasCriticalWater && (
                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-red-700 dark:text-red-400 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Water supply critically exhausted
                  </span>
                  <button
                    onClick={() => router.push('/allocation')}
                    className="flex items-center gap-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <span>Approve Transfer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
