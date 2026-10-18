'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp } from '../context/AppContext';
import { 
  fetchAreas, 
  fetchCamps, 
  fetchPriorityList, 
  fetchAdminStats,
  sendFieldTeamAction,
  queryGeminiAI
} from '../lib/api';
import { 
  AlertTriangle, 
  Droplet, 
  Users, 
  Truck, 
  ShieldAlert, 
  ChevronRight,
  Radio,
  Sparkles,
  RefreshCw,
  Zap,
  Bot
} from 'lucide-react';

// Dynamically import Leaflet CommandMap with ssr: false
const CommandMap = dynamic(() => import('../components/CommandMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 text-sm">
      Loading interactive disaster map...
    </div>
  )
});

export default function CommandDashboard() {
  const router = useRouter();
  const navigate = (path) => router.push(path);
  const { isMock, showToast } = useApp();
  const [areas, setAreas] = useState([]);
  const [camps, setCamps] = useState([]);
  const [priorityList, setPriorityList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gemini 2.5 Flash Disaster Intelligence State
  const [aiBriefing, setAiBriefing] = useState(
    'Gemini 2.5 Flash Situation Assessment: Delta Sector (Area C) shows a 98% reporting blackout indicating cellular tower collapse. Immediate recommendation: dispatch amphibious drone recon along North Canal corridor and pre-stage 500L emergency potable water at Camp B.'
  );
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLastUpdated, setAiLastUpdated] = useState('Active Synced');

  const handleGenerateAiBriefing = async () => {
    setIsAiLoading(true);
    showToast('Querying Gemini 2.5 Flash for tactical situation briefing...');
    try {
      const res = await queryGeminiAI({
        task: 'dark_zone_analysis',
        prompt: `Current disaster status: ${areas.length} sectors monitored. Delta Sector (Area C) has 98% reporting silence and high flood severity. Camp B has -160L water deficit with 1,240 residents. Provide an executive tactical situation briefing with 3 actionable priorities for the incident commander.`,
        context: { areasCount: areas.length, activeDarkZones: stats?.activeDarkZones || 1, criticalShortages: stats?.criticalShortages || 1 }
      });
      if (res?.response) {
        setAiBriefing(res.response);
        setAiLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        showToast('Gemini 2.5 Flash briefing updated successfully!', 'success');
      }
    } catch (err) {
      console.warn('AI briefing error:', err);
      showToast('Could not reach Gemini model, local tactical fallback active.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [areasData, campsData, priorityData, statsData] = await Promise.all([
        fetchAreas(),
        fetchCamps(),
        fetchPriorityList(),
        fetchAdminStats()
      ]);
      setAreas(areasData);
      setCamps(campsData);
      setPriorityList(priorityData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickFieldTeam = async (areaId) => {
    try {
      await sendFieldTeamAction(areaId, ['vol-1', 'vol-4']);
      showToast('Field Team dispatched to Area C. Status upgraded to team_sent.', 'success');
      loadData();
    } catch (err) {
      showToast(`Action failed: ${err.message}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header Banner - Sharp Tactical Bar */}
      <div className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              OPERATIONS COMMAND // SITUATION ROOM
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>STATUS: ACTIVE</span>
        </div>
      </div>

      {/* 4 Summary Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Active Dark Zones */}
        <div 
          onClick={() => navigate('/verification')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-l-indigo-600 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              DARK ZONES
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{stats ? stats.activeDarkZones : 1}</span>
            <span className="text-[11px] font-sans font-medium text-indigo-700 dark:text-indigo-400">Delta Sector</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
            <span>VERIFICATION REQUIRED</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 2: Critical Shortages */}
        <div 
          onClick={() => navigate('/resources')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-l-red-600 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              CRITICAL DEFICIT
            </span>
            <Droplet className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{stats ? stats.criticalShortages : 1}</span>
            <span className="text-[11px] font-sans font-medium text-red-700 dark:text-red-400">Camp B Water</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
            <span>-160L DEFICIT</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 3: Volunteers Active */}
        <div 
          onClick={() => navigate('/volunteers')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-600 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              FIELD TEAMS
            </span>
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{stats ? stats.volunteersByStatus.on_duty : 2}</span>
            <span className="text-[11px] font-mono text-slate-400">/ 8 TOTAL</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
            <span>{stats ? stats.volunteersByStatus.available : 5} STANDBY</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 4: Deliveries in Transit */}
        <div 
          onClick={() => navigate('/allocation')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-600 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
              LOGISTICS CONVOY
            </span>
            <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span>{stats ? (stats.deliveriesByStatus['In transit'] || 0) : 0}</span>
            <span className="text-[11px] font-sans font-medium text-emerald-700 dark:text-emerald-400">En Route</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
            <span>CONVOY TRACKING</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* GEMINI 2.5 FLASH TACTICAL SITUATION BRIEFING */}
      <div className="rounded-xl border border-[#2D4A22]/30 bg-gradient-to-r from-[#1C3315]/10 via-[#2D4A22]/15 to-[#3E6630]/10 p-4 shadow-sm backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-[#2D4A22]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D4A22]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#1C3315] via-[#2D4A22] to-[#3E6630] text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider">
                  GEMINI 2.5 FLASH // TACTICAL SITUATION BRIEFING
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2D4A22]/20 text-[#2D4A22] dark:text-emerald-300 font-bold border border-[#2D4A22]/30">
                  AI COPILOT ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Real-time multi-source synthesis • Cellular silence analysis • Automated casualty forecasting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              Updated: {aiLastUpdated}
            </span>
            <button
              onClick={handleGenerateAiBriefing}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#1C3315] via-[#2D4A22] to-[#3E6630] hover:opacity-95 transition-opacity shadow-xs border border-emerald-900/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span>{isAiLoading ? 'Synthesizing Intel...' : 'Refresh AI Briefing'}</span>
            </button>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
          <div className="lg:col-span-9 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-lg p-3.5 border border-[#2D4A22]/20 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-[#2D4A22] dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium whitespace-pre-line">
                {aiBriefing}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Model Verification</div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Zap className="w-3 h-3 text-amber-500" />
                gemini-2.5-flash
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">DARK ZONE THREAT</span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                CRITICAL (DELTA)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map & Situation Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
              GEOSPATIAL SITUATION GRID
            </h2>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              SECTOR 1-4
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>TELEMETRY SYNCED</span>
          </div>
        </div>

        {/* Leaflet Map */}
        <CommandMap 
          areas={areas} 
          camps={camps} 
          onSelectArea={(a) => navigate(`/areas/${a.id}`)} 
        />
      </div>

      {/* Priority Action Queue */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
              PRIORITY ACTION QUEUE
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {priorityList.length} TARGETS
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {priorityList.map((item, idx) => {
            const isSilent = item.tag === 'Silent Risk';

            return (
              <div 
                key={item.id} 
                onClick={() => {
                  if (item.type === 'area') {
                    navigate(`/areas/${item.refId}`);
                  } else {
                    navigate('/resources');
                  }
                }}
                className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850 px-2 rounded-md transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5 ${
                    idx === 0 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                        isSilent 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800' 
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                      }`}>
                        {item.tag}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        SUGGESTED
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 font-semibold ml-1">
                        SCORE: {item.priorityScore}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {item.reason}
                    </p>
                  </div>
                </div>

                {/* Action Trigger & View Sector Hint */}
                <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
                  {item.type === 'area' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/verification');
                        }}
                        className="px-2 py-1 text-xs font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-300 dark:border-amber-700 transition-colors"
                      >
                        Verify Console
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/areas/${item.refId}`);
                        }}
                        className="px-2 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Telemetry
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickFieldTeam(item.refId);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        Dispatch Team
                      </button>
                      <span className="text-xs font-medium text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 hidden sm:inline ml-1">
                        View Sector &rarr;
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/allocation');
                        }}
                        className="px-3 py-1 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        Resolve Transfer
                      </button>
                      <span className="text-xs font-medium text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 hidden sm:inline ml-1">
                        View Stock &rarr;
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
