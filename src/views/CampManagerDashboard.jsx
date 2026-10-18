'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  fetchCamps, 
  fetchDuties, 
  fetchVolunteers,
  updateCampInventoryAction, 
  updateCampOccupancyAction, 
  confirmDeliveryArrivalAction,
  submitCampRequisitionAction,
  fetchRequisitions,
  updateRequisitionAction,
  queryGeminiAI 
} from '../lib/api';
import { 
  Tent, 
  Droplet, 
  Utensils, 
  Pill, 
  Package, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Clock, 
  Send, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Building2, 
  ArrowUpRight,
  TrendingDown,
  UserCheck,
  ChevronDown,
  Sparkles,
  HeartPulse,
  X,
  Bot,
  Zap
} from 'lucide-react';

const ITEM_CONFIG = {
  water: {
    label: 'Drinking Water',
    unit: 'Liters (L)',
    icon: Droplet,
    color: 'text-sky-500 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    burnPerPerson: 1.5 // 1.5L per occupant per day
  },
  food: {
    label: 'Food Rations',
    unit: 'Meals / Packs',
    icon: Utensils,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    burnPerPerson: 1.0 // 1 meal per occupant daily ration
  },
  medicine: {
    label: 'Medical Kits',
    unit: 'First-Aid / Trauma Packs',
    icon: Pill,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    burnPerPerson: 0.2
  },
  relief: {
    label: 'Relief & Bedding',
    unit: 'Blankets & Tarps',
    icon: Package,
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    burnPerPerson: 0.15
  }
};

export default function CampManagerDashboard() {
  const { showToast } = useApp();
  const [camps, setCamps] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState('camp-b'); // Default to Camp B (has critical water shortage)
  const [duties, setDuties] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals / Quick Actions State
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);

  // Forms State
  const [intakeCount, setIntakeCount] = useState(5);
  const [intakeVulnerable, setIntakeVulnerable] = useState(false);

  const [restockItem, setRestockItem] = useState('water');
  const [restockQty, setRestockQty] = useState(100);
  const [restockSource, setRestockSource] = useState('UN Humanitarian Relief Convoy');

  const [reqItem, setReqItem] = useState('water');
  const [reqQty, setReqQty] = useState(200);
  const [reqPriority, setReqPriority] = useState('critical');
  const [reqNotes, setReqNotes] = useState('Water tanks severely depleted. Resupply urgently needed for 280 occupants.');

  // Gemini 2.5 Flash Camp Intelligence State (Concise & Tactical)
  const [aiCampForecast, setAiCampForecast] = useState(
    'Water reserves (320L) critical in 16.2h under 280 residents. Priority: Dispatch 500L tanker before 08:00.'
  );
  const [isAiForecasting, setIsAiForecasting] = useState(false);

  const handleRunCampForecast = async () => {
    if (!currentCamp) return;
    setIsAiForecasting(true);
    showToast('Invoking Gemini 2.5 Flash camp forecast model...');
    try {
      const res = await queryGeminiAI({
        task: 'camp_forecast',
        prompt: `Analyze ${currentCamp.name} (Occupancy: ${currentCamp.occupancy}/${currentCamp.capacity}). Give ONLY 2 very short, concise tactical bullet points (under 25 words total) on depletion risk and priority restock. No fluff.`,
        context: { campId: currentCamp.id, occupancy: currentCamp.occupancy }
      });
      if (res?.response) {
        setAiCampForecast(res.response);
        showToast('Gemini AI camp forecast updated!', 'success');
      }
    } catch (err) {
      console.warn('Camp forecast error:', err);
    } finally {
      setIsAiForecasting(false);
    }
  };

  const [fieldRequisitions, setFieldRequisitions] = useState([]);

  const loadData = async () => {
    try {
      const [campsData, dutiesData, volsData, reqsData] = await Promise.all([
        fetchCamps(),
        fetchDuties(),
        fetchVolunteers(),
        fetchRequisitions()
      ]);
      setCamps(campsData);
      setDuties(dutiesData);
      setVolunteers(volsData);
      setFieldRequisitions(reqsData || []);
    } catch (err) {
      console.error('Failed to load camp manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = async () => {
      try {
        const [campsData, reqsData, dutiesData] = await Promise.all([
          fetchCamps(),
          fetchRequisitions(),
          fetchDuties()
        ]);
        setCamps(campsData);
        setFieldRequisitions(reqsData || []);
        setDuties(dutiesData);
      } catch (err) {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('reliefos_db_sync', handleSync);
      window.addEventListener('storage', handleSync);
    }
    const interval = setInterval(handleSync, 3000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('reliefos_db_sync', handleSync);
        window.removeEventListener('storage', handleSync);
      }
      clearInterval(interval);
    };
  }, []);

  const currentCamp = useMemo(() => {
    return camps.find(c => c.id === selectedCampId) || camps[0] || null;
  }, [camps, selectedCampId]);

  // Arriving deliveries targeting this camp
  const incomingDeliveries = useMemo(() => {
    if (!currentCamp) return [];
    return duties.filter(d => 
      (d.toId === currentCamp.id || d.toName?.toLowerCase().includes(currentCamp.name.toLowerCase().split('(')[0].trim())) &&
      d.type === 'delivery'
    );
  }, [duties, currentCamp]);

  // Active requisitions originating from this camp
  const campRequisitions = useMemo(() => {
    if (!currentCamp) return [];
    return duties.filter(d => 
      d.type === 'requisition' && 
      (d.fromCampId === currentCamp.id || d.fromCampName?.toLowerCase().includes(currentCamp.name.toLowerCase().split('(')[0].trim()))
    );
  }, [duties, currentCamp]);

  // Stationed volunteers
  const campVolunteers = useMemo(() => {
    if (!currentCamp) return [];
    return volunteers.filter(v => 
      v.location?.toLowerCase().includes(currentCamp.name.toLowerCase().split('(')[0].trim()) ||
      v.assignedCampId === currentCamp.id
    );
  }, [volunteers, currentCamp]);

  // Actions
  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!currentCamp) return;
    setActionLoading(true);
    try {
      await updateCampOccupancyAction(currentCamp.id, Number(intakeCount));
      showToast(`Registered intake of ${intakeCount} new occupants at ${currentCamp.name}.`, 'success');
      setShowIntakeModal(false);
      await loadData();
    } catch (err) {
      showToast(`Intake failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!currentCamp) return;
    setActionLoading(true);
    try {
      await updateCampInventoryAction(currentCamp.id, restockItem, Number(restockQty), restockSource);
      showToast(`Restocked +${restockQty} ${restockItem} from ${restockSource}.`, 'success');
      setShowRestockModal(false);
      await loadData();
    } catch (err) {
      showToast(`Restock failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequisitionSubmit = async (e) => {
    e.preventDefault();
    if (!currentCamp) return;
    setActionLoading(true);
    try {
      await submitCampRequisitionAction({
        campId: currentCamp.id,
        campName: currentCamp.name,
        item: reqItem,
        quantity: Number(reqQty),
        priority: reqPriority,
        notes: reqNotes
      });
      showToast(`Emergency requisition for ${reqQty} ${reqItem} transmitted to Central Command!`, 'success');
      setShowRequisitionModal(false);
      await loadData();
    } catch (err) {
      showToast(`Requisition failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeliveryArrival = async (delivery) => {
    setActionLoading(true);
    try {
      await confirmDeliveryArrivalAction(
        delivery.id,
        currentCamp.id,
        delivery.item,
        delivery.quantity
      );
      showToast(`Delivery #${delivery.id.substr(-6)} confirmed! Stock updated (+${delivery.quantity} ${delivery.item}).`, 'success');
      await loadData();
    } catch (err) {
      showToast(`Confirmation failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveFieldRequisition = async (req) => {
    setActionLoading(true);
    try {
      await updateRequisitionAction(req.id, { status: 'approved' });
      showToast(`Requisition #${req.id.substr(-6)} APPROVED! Camp inventory deducted and delivery convoy queued.`, 'success');
      await loadData();
    } catch (err) {
      showToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-80" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentCamp) {
    return <div className="p-8 text-slate-500">No camp data available.</div>;
  }

  const occupancy = currentCamp.occupancy || 0;
  const capacity = currentCamp.capacity || 1;
  const occupancyPct = Math.round((occupancy / capacity) * 100);
  const isNearCapacity = occupancyPct >= 90;
  const criticalItems = (currentCamp.items || []).filter(i => i.stock < i.need);

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6 animate-fadeIn">
      {/* Top Banner: Camp Selector & Operational Control Header */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Camp Selector Dropdown */}
            <div className="relative inline-block">
              <select
                id="camp-selector"
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm sm:text-base rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {camps.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              DEPOT LOGISTICS
            </span>

            {criticalItems.length > 0 ? (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {criticalItems.length} DEFICIT{criticalItems.length > 1 ? 'S' : ''}
              </span>
            ) : (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                STOCK STABLE
              </span>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex flex-wrap items-center gap-2">
            <span>POS: {currentCamp.lat}°N, {currentCamp.lng}°E</span>
            <span>//</span>
            <span>TYPE: EMERGENCY REFUGE</span>
            <span>//</span>
            <span>STATUS: ACTIVE HUB</span>
          </div>
        </div>

        {/* Quick Action Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowIntakeModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition shadow-xs"
          >
            <Users className="w-3 h-3" />
            <span>Intake</span>
          </button>

          <button
            onClick={() => setShowRestockModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-xs"
          >
            <Plus className="w-3 h-3" />
            <span>Restock</span>
          </button>

          <button
            onClick={() => setShowRequisitionModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-xs"
          >
            <Send className="w-3 h-3" />
            <span>Requisition</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh camp data"
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* GEMINI 2.5 FLASH LOGISTICS & BURN RATE FORECASTER */}
      <div className="rounded-xl border border-[#2D4A22]/30 bg-gradient-to-r from-[#1C3315]/10 via-[#2D4A22]/15 to-[#3E6630]/10 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D4A22]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#1C3315] via-[#2D4A22] to-[#3E6630] text-white">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider">
                  GEMINI 2.5 FLASH // PREDICTIVE CAMP LOGISTICS FORECASTER
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  gemini-2.5-flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Occupancy burn-rate telemetry • Automated hours-to-depletion projection • Proactive supply staging
              </p>
            </div>
          </div>
          <button
            onClick={handleRunCampForecast}
            disabled={isAiForecasting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#1C3315] via-[#2D4A22] to-[#3E6630] hover:opacity-95 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiForecasting ? 'animate-spin' : ''}`} />
            <span>{isAiForecasting ? 'Calculating Burn Rates...' : 'Re-Forecast Depletion'}</span>
          </button>
        </div>
        <div className="mt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-lg p-3 border border-[#2D4A22]/20 flex items-start gap-2.5">
          <Bot className="w-4 h-4 text-[#2D4A22] dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium whitespace-pre-line">
            {aiCampForecast}
          </div>
        </div>
      </div>

      {/* Critical Shortage Warning Banner */}
      {criticalItems.length > 0 && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold text-red-900 dark:text-red-200 uppercase font-mono">
                STOCK DEFICIT ALERT // {currentCamp.name}
              </span>
              <p className="text-[11px] text-red-700 dark:text-red-300">
                {criticalItems.map(i => `${ITEM_CONFIG[i.item]?.label || i.item}: ${i.stock} (deficit -${i.need - i.stock})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setReqItem(criticalItems[0].item);
              setReqQty(criticalItems[0].need - criticalItems[0].stock + 100);
              setShowRequisitionModal(true);
            }}
            className="self-start sm:self-center px-3 py-1 rounded-md text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1 flex-shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>Requisition</span>
          </button>
        </div>
      )}

      {/* Occupancy and Shelter Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Occupants Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Occupancy / Capacity</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-950" style={{ color: '#0f172a' }}>
              {occupancy}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / {capacity} persons
            </span>
            <span className={`ml-auto text-xs font-bold ${
              isNearCapacity ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {occupancyPct}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isNearCapacity ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(occupancyPct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {capacity - occupancy > 0 ? `${capacity - occupancy} beds remaining open` : 'Camp at maximum capacity'}
          </p>
        </div>

        {/* Medical Bay Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Medical Triage Bay</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-950" style={{ color: '#0f172a' }}>
              {Math.min(18, Math.round(occupancy * 0.08))}
            </span>
            <span className="text-xs font-semibold text-slate-500">/ 20 beds filled</span>
            <span className="ml-auto text-xs font-bold text-amber-500">90%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: '90%' }} />
          </div>
          <p className="text-[11px] text-slate-500">
            Stationed: Fatima Noor (Triage Scout)
          </p>
        </div>

        {/* Incoming Deliveries Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Arriving Deliveries</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-950" style={{ color: '#0f172a' }}>
              {incomingDeliveries.filter(d => d.status !== 'done').length}
            </span>
            <span className="text-xs font-semibold text-slate-500">en route</span>
            <span className="ml-auto text-xs font-bold text-blue-600 dark:text-blue-400">
              {incomingDeliveries.length} total
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {incomingDeliveries.filter(d => d.status !== 'done').length > 0 
              ? 'Click "Confirm Arrival" below when driver arrives' 
              : 'No pending in-transit transfers'}
          </div>
        </div>

        {/* Active Volunteers Stationed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Stationed Field Personnel</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-950" style={{ color: '#0f172a' }}>
              {campVolunteers.length || 2}
            </span>
            <span className="text-xs font-semibold text-slate-500">responders on-site</span>
            <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Mesh and VHF radio channels active
          </p>
        </div>
      </div>

      {/* 4 Inventory Stock & Burn-Rate Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-950" style={{ color: '#0f172a' }}>
              Real-Time Stock Inventory &amp; Days-of-Supply
            </h3>
            <p className="text-xs text-slate-700 font-semibold mt-0.5" style={{ color: '#334155' }}>
              Automated burn-rate calculations based on {occupancy} current camp occupants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(currentCamp.items || []).map((itemObj) => {
            const cfg = ITEM_CONFIG[itemObj.item] || {
              label: itemObj.item,
              unit: 'units',
              icon: Package,
              color: 'text-slate-700',
              bg: 'bg-slate-100',
              border: 'border-slate-300',
              burnPerPerson: 1
            };
            const Icon = cfg.icon;
            const dailyBurn = Math.max(1, Math.round(occupancy * cfg.burnPerPerson));
            const daysRemaining = (itemObj.stock / dailyBurn).toFixed(1);
            const isCritical = itemObj.stock < itemObj.need || Number(daysRemaining) < 1.0;
            const pct = Math.min(100, Math.round((itemObj.stock / Math.max(1, itemObj.need)) * 100));

            return (
              <div
                key={itemObj.item}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition hover:shadow-md ${
                  isCritical ? 'border-red-300 dark:border-red-900/60 bg-red-50/20' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-950" style={{ color: '#0f172a' }}>
                          {cfg.label}
                        </h4>
                        <span className="text-[10px] text-slate-600 font-bold uppercase font-mono" style={{ color: '#475569' }}>
                          {cfg.unit}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCritical
                        ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {daysRemaining} Days Left
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-950" style={{ color: '#0f172a' }}>
                        {itemObj.stock}
                      </span>
                      <span className="text-xs text-slate-600 font-medium" style={{ color: '#475569' }}>
                        Target Reserve: <strong className="text-slate-950" style={{ color: '#0f172a' }}>{itemObj.need}</strong>
                      </span>
                    </div>

                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct < 30 ? 'bg-red-500' : pct < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2" style={{ color: '#475569' }}>
                    <span>Daily burn rate:</span>
                    <strong className="text-slate-900 font-bold" style={{ color: '#0f172a' }}>~{dailyBurn} {cfg.unit.split(' ')[0]}/day</strong>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRestockItem(itemObj.item);
                      setShowRestockModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition text-center"
                  >
                    + Log Intake
                  </button>
                  {isCritical && (
                    <button
                      onClick={() => {
                        setReqItem(itemObj.item);
                        setReqQty(Math.max(100, itemObj.need - itemObj.stock));
                        setShowRequisitionModal(true);
                      }}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition"
                    >
                      Request
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INCOMING FIELD REQUISITIONS FROM VOLUNTEERS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/30 dark:border-amber-500/40 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase font-mono">
                INCOMING VOLUNTEER FIELD REQUISITIONS ({fieldRequisitions.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and approve supply requests submitted by field responders. Approval automatically deducts camp stock and dispatches a delivery convoy.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE POLLING (3s)
          </span>
        </div>

        {fieldRequisitions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-mono">
            No incoming volunteer requisitions at this time. When responders request camp resources from the field, they appear here instantly.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {fieldRequisitions.map((req) => {
              const isApproved = req.status === 'approved';
              return (
                <div key={req.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        #{req.id.substr(-6)}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isApproved
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : req.priority === 'critical'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 animate-pulse'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}>
                        {isApproved ? 'Approved // Convoy Dispatched' : `${req.priority?.toUpperCase()} PRIORITY`}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Responder: <strong>{req.volunteerName}</strong>
                      </span>
                      <span className="text-xs text-slate-400">
                        • Target: <strong>{req.campName}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Requested: {req.items?.map(i => `${i.quantity} ${i.unit || ''} ${i.item}`).join(', ')}
                    </h4>

                    {req.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        "{req.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
                    {!isApproved ? (
                      <button
                        onClick={() => handleApproveFieldRequisition(req)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 text-white transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve &amp; Dispatch Convoy</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Truck className="w-4 h-4" /> Convoy Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Arriving Deliveries & Emergency Requisitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arriving Inter-Camp Deliveries Intake Desk */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" />
                Arriving Deliveries &amp; Inter-Camp Transfers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify incoming supply trucks and intake supplies directly into camp storage.
              </p>
            </div>
          </div>

          {incomingDeliveries.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No incoming deliveries currently scheduled for {currentCamp.name}.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {incomingDeliveries.map((delivery) => {
                const isDone = delivery.status === 'done';
                return (
                  <div key={delivery.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          #{delivery.id.substr(-6)}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isDone
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 animate-pulse'
                        }`}>
                          {isDone ? 'Delivered & Stocked' : 'In-Transit'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {delivery.instructions || `Transfer ${delivery.quantity} ${delivery.item} to ${currentCamp.name}`}
                      </h4>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Courier: <strong>{delivery.volunteerName || 'Dispatch Driver'}</strong></span>
                        <span>•</span>
                        <span>Item: <strong>+{delivery.quantity} {delivery.item}</strong></span>
                      </div>
                    </div>

                    {!isDone ? (
                      <button
                        onClick={() => handleConfirmDeliveryArrival(delivery)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 flex-shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Arrival &amp; Stock In</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Received
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Outgoing Supply Requisitions to Command */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-red-500" />
                Emergency Requisitions to Central Command
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Supply requests transmitted to the Rescue Coordinator for dispatch approval.
              </p>
            </div>
            <button
              onClick={() => setShowRequisitionModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 transition"
            >
              + New Request
            </button>
          </div>

          {campRequisitions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No open supply requisitions for {currentCamp.name}. Click "+ New Request" if reserves drop.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {campRequisitions.map((req) => (
                <div key={req.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                        #{req.id.substr(-6)}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                        {req.priority || 'High'} Priority
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(req.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {req.instructions}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Status: <strong className="text-amber-500">Awaiting Command Allocation Dispatch</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shelter Intake Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-900 dark:text-white" />
                Register Shelter Intake
              </h3>
              <button onClick={() => setShowIntakeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Number of Evacuees Arriving
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={intakeCount}
                  onChange={(e) => setIntakeCount(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vulnerable-check"
                  checked={intakeVulnerable}
                  onChange={(e) => setIntakeVulnerable(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="vulnerable-check" className="text-xs text-slate-600 dark:text-slate-400">
                  Includes vulnerable persons (Infants, pregnant, elderly, injured)
                </label>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                This will increment current camp occupancy to <strong>{occupancy + Number(intakeCount)}</strong> / {capacity} and adjust ration burn rates.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                >
                  Confirm Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                Log Stock Intake / Restock
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Resource Item
                </label>
                <select
                  value={restockItem}
                  onChange={(e) => setRestockItem(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold"
                >
                  <option value="water">Drinking Water (Liters)</option>
                  <option value="food">Food Rations (Meals)</option>
                  <option value="medicine">Medical Kits (Packs)</option>
                  <option value="relief">Relief &amp; Blankets (Units)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity Received
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Donation / Supply Source
                </label>
                <input
                  type="text"
                  value={restockSource}
                  onChange={(e) => setRestockSource(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                >
                  Record Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Requisition Modal */}
      {showRequisitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-red-500" />
                Emergency Requisition to Central Command
              </h3>
              <button onClick={() => setShowRequisitionModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequisitionSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Requested Resource
                </label>
                <select
                  value={reqItem}
                  onChange={(e) => setReqItem(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold"
                >
                  <option value="water">Drinking Water</option>
                  <option value="food">Food Rations</option>
                  <option value="medicine">Medical / Trauma Supplies</option>
                  <option value="relief">Relief Kits / Blankets</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity Required
                </label>
                <input
                  type="number"
                  min="1"
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Urgency Priority
                </label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold"
                >
                  <option value="critical">CRITICAL (Imminent stockout / Life hazard)</option>
                  <option value="high">HIGH (Stockout anticipated in &lt;24 hours)</option>
                  <option value="standard">STANDARD (Routine replenishment)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Operational Justification
                </label>
                <textarea
                  rows="3"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="Explain why this resupply is required..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit to Command</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
