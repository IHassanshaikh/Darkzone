'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { 
  fetchDuties, 
  updateDutyStatusAction, 
  queryGeminiAI,
  fetchMessages,
  submitRequisitionAction,
  fetchCamps
} from '../lib/api';
import { enqueueAction } from '../lib/offlineQueue';
import { 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  FileCheck, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Map, 
  Tent,
  Sparkles,
  Bot,
  Zap,
  ShieldAlert,
  Radio,
  Package,
  Plus,
  X,
  Send,
  MessageSquare,
  Droplet,
  Utensils,
  Pill,
  HeartPulse
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { isOnline, pendingSyncCount, syncNow, isSyncing, showToast } = useApp();
  const [duties, setDuties] = useState([]);
  const [citizenMessages, setCitizenMessages] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gemini 2.5 Flash Field Safety State (Concise & Tactical)
  const [aiSafetyAdvice, setAiSafetyAdvice] = useState(
    'Area C flood surge active (+3.2 ft). Avoid subterranean basements; maintain low-power mesh beacon pinging every 15 min.'
  );
  const [isAiSafetyLoading, setIsAiSafetyLoading] = useState(false);

  // Volunteer Camp Resource Requisition Modal State
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqCampId, setReqCampId] = useState('camp-3');
  const [reqItem, setReqItem] = useState('water');
  const [reqQty, setReqQty] = useState(150);
  const [reqPriority, setReqPriority] = useState('critical');
  const [reqNotes, setReqNotes] = useState('Urgent drinking water replenishment required for displaced families in Sector Delta 9.');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // Active Volunteer ID & Name
  const currentVolunteerId = 'vol-3';
  const currentVolunteerName = 'Fatima Noor';

  const handleRunSafetyCheck = async () => {
    setIsAiSafetyLoading(true);
    showToast('Invoking Gemini 2.5 Flash field safety model...');
    try {
      const res = await queryGeminiAI({
        task: 'citizen_advisor',
        prompt: `Provide ONLY 2 very brief responder safety rules (under 25 words total) for volunteer ${currentVolunteerName} in high flood zone. No filler text.`,
        context: { volunteerId: currentVolunteerId, dutiesCount: duties.length, messagesCount: citizenMessages.length }
      });
      if (res?.response) {
        setAiSafetyAdvice(res.response);
        showToast('Gemini field safety briefing updated!', 'success');
      }
    } catch (err) {
      console.warn('Safety advisor error:', err);
    } finally {
      setIsAiSafetyLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [allDuties, allMsgs, allCamps] = await Promise.all([
        fetchDuties(),
        fetchMessages({ volunteerId: currentVolunteerId }),
        fetchCamps()
      ]);
      setDuties(allDuties);
      setCitizenMessages(allMsgs);
      if (allCamps && allCamps.length > 0) {
        setCamps(allCamps);
        if (!reqCampId) setReqCampId(allCamps[0].id);
      }
    } catch (err) {
      console.error('Failed to load volunteer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Real-time polling every 3 seconds for inbound citizen messages and duty dispatches
    const interval = setInterval(() => {
      fetchMessages({ volunteerId: currentVolunteerId }).then(setCitizenMessages).catch(() => {});
      fetchDuties().then(setDuties).catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (dutyId, nextStatus) => {
    if (!isOnline) {
      await enqueueAction({
        type: 'duty_status',
        payload: { dutyId, status: nextStatus },
        timestamp: new Date().toISOString()
      });
      setDuties(prev => prev.map(d => d.id === dutyId ? { ...d, status: nextStatus } : d));
      showToast(`Offline action saved to IndexedDB! Pending sync badge incremented.`, 'warning');
    } else {
      try {
        await updateDutyStatusAction(dutyId, nextStatus);
        showToast(`Duty status updated to ${nextStatus}.`, 'success');
        await loadData();
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
      }
    }
  };

  // Submit Resource Requisition to Camp Manager & Admin
  const handleRequisitionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReq(true);
    try {
      const selectedCamp = camps.find(c => c.id === reqCampId) || { name: 'Camp 3 (Khanpur Valley)', id: reqCampId };
      await submitRequisitionAction({
        volunteerId: currentVolunteerId,
        volunteerName: currentVolunteerName,
        campId: selectedCamp.id,
        campName: selectedCamp.name,
        items: [{ item: reqItem, quantity: Number(reqQty), unit: reqItem === 'water' ? 'Liters' : 'Packs' }],
        priority: reqPriority,
        notes: reqNotes
      });
      showToast(`Requisition for ${reqQty} ${reqItem} broadcast to Camp Manager & Admin Command!`, 'success');
      setShowReqModal(false);
    } catch (err) {
      showToast(`Requisition failed: ${err.message}`, 'error');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6 animate-fadeIn">
      {/* Volunteer Profile Banner */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-mono font-bold text-xs shadow-xs">
            FN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {currentVolunteerName}
              </h1>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                PARAMEDIC // SCOUT
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
              HUB: COASTAL CAMP B • ID: {currentVolunteerId}
            </p>
          </div>
        </div>

        {/* Connectivity, Actions & Sync Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Request Camp Supplies */}
          <button
            onClick={() => setShowReqModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 shadow-xs transition"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Request Camp Supplies</span>
          </button>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${
            isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700' : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-rose-600" />}
            <span>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
          </div>

          {pendingSyncCount > 0 && (
            <button
              onClick={syncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>SYNC QUEUE ({pendingSyncCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* GEMINI 2.5 FLASH FIELD SAFETY ADVISOR */}
      <div className="rounded-xl border border-[#2D4A22]/30 bg-gradient-to-r from-[#1C3315]/10 via-[#2D4A22]/15 to-[#3E6630]/10 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D4A22]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#1C3315] via-[#2D4A22] to-[#3E6630] text-white">
              <ShieldAlert className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  GEMINI 2.5 FLASH // FIELD RESPONDER SAFETY ADVISOR
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  gemini-2.5-flash
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans mt-0.5">
                Dynamic route hazard appraisal • Subterranean flood warnings • Offline mesh rendezvous
              </p>
            </div>
          </div>
          <button
            onClick={handleRunSafetyCheck}
            disabled={isAiSafetyLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#1C3315] via-[#2D4A22] to-[#3E6630] hover:opacity-95 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiSafetyLoading ? 'animate-spin' : ''}`} />
            <span>{isAiSafetyLoading ? 'Scanning Hazards...' : 'Re-Check Route Hazards'}</span>
          </button>
        </div>
        <div className="mt-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg p-3 border border-[#2D4A22]/20 flex items-start gap-2.5">
          <Bot className="w-4 h-4 text-[#2D4A22] dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-900 dark:text-slate-100 font-medium leading-relaxed font-sans whitespace-pre-line">
            {aiSafetyAdvice}
          </div>
        </div>
      </div>

      {/* REAL-TIME INBOUND CITIZEN DISTRESS SOS FEED */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3.5 sm:p-4 border border-red-500/30 dark:border-red-500/40 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 font-mono">
              INBOUND CITIZEN DISTRESS SOS // LIVE P2P MESH ({citizenMessages.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE POLLING (3s)
          </span>
        </div>

        {citizenMessages.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-mono space-y-1">
            <p>No active citizen distress messages currently routed to your unit.</p>
            <p className="text-[11px] text-slate-500">Listening on Bluetooth mesh beacon for inbound emergency packets...</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {citizenMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="p-3.5 rounded-lg border border-red-300 dark:border-red-800/80 bg-red-50/80 dark:bg-red-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:border-red-400 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white uppercase tracking-wider">
                      {msg.category || 'CITIZEN SOS'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-slate-200">
                      From: {msg.senderName || 'Affected Citizen'}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      • {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-sm font-black text-slate-950 dark:text-slate-50 leading-snug">
                    {msg.text}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-800 dark:text-emerald-400 font-bold">Mesh Route:</span>
                    <span>{msg.hopRoute || 'Bluetooth Low Energy P2P Peer Mesh'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Delivered to Volunteer
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Field Access Links: Map and Camps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/field-map"
          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-xs transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Map className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                Field Operations Map
              </div>
              <p className="text-[11px] text-slate-400">
                Sectors, hazard polygons &amp; camp GPS
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
        </Link>

        <Link
          href="/camps"
          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-xs transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Tent className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                Camps &amp; Inventory
              </div>
              <p className="text-[11px] text-slate-400">
                Shelter occupancy &amp; supply reserves
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {/* Offline Status Mini-Bar */}
      <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>OFFLINE LOCAL BUFFER ACTIVE (INDEXED_DB)</span>
        </div>
        <span className="text-slate-400">AUTO-FLUSH ON RECONNECT</span>
      </div>

      {/* Assigned Duties List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
              ASSIGNED DUTIES &amp; CONVOYS ({duties.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {duties.map((duty) => {
            const isAssigned = duty.status === 'assigned';
            const isInProgress = duty.status === 'in_progress';
            const isDone = duty.status === 'done';

            return (
              <div key={duty.id} className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      #{duty.id.substr(-6)}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isAssigned
                        ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-600/40'
                        : isInProgress
                        ? 'bg-sky-50 text-sky-800 border border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-500/40 animate-pulse'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/40'
                    }`}>
                      {duty.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Type: {(duty.type || 'duty').toUpperCase()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {duty.instructions || duty.title || duty.notes}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Target: <strong className="text-slate-800 dark:text-slate-300">{duty.toName || duty.toId || duty.location || 'Field Zone'}</strong></span>
                    <span>•</span>
                    <span>Assigned to: <strong className="text-slate-800 dark:text-slate-300">{duty.volunteerName}</strong></span>
                    <span>•</span>
                    <span>Updated: {new Date(duty.updatedAt || duty.createdAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  {isAssigned && (
                    <button
                      onClick={() => handleStatusChange(duty.id, 'in_progress')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1.5 shadow-md shadow-sky-600/30"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Task</span>
                    </button>
                  )}
                  {isInProgress && (
                    <button
                      onClick={() => handleStatusChange(duty.id, 'done')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Complete</span>
                    </button>
                  )}
                  {isDone && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REQUEST CAMP RESOURCES MODAL */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono">
                  REQUEST CAMP SUPPLIES // FIELD REQUISITION
                </h3>
              </div>
              <button 
                onClick={() => setShowReqModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequisitionSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Camp
                </label>
                <select
                  value={reqCampId}
                  onChange={(e) => setReqCampId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {camps.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.valley || 'Sector'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resource Category
                  </label>
                  <select
                    value={reqItem}
                    onChange={(e) => setReqItem(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="water">Drinking Water (Liters)</option>
                    <option value="food">Food Rations (Meals)</option>
                    <option value="medicine">Trauma Kits (Packs)</option>
                    <option value="relief">Blankets &amp; Bedding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['critical', 'high', 'normal'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setReqPriority(lvl)}
                      className={`py-1.5 text-xs font-mono font-bold uppercase rounded border transition ${
                        reqPriority === lvl
                          ? lvl === 'critical' ? 'bg-red-500 text-white border-red-600' : lvl === 'high' ? 'bg-amber-500 text-white border-amber-600' : 'bg-blue-500 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Operational Reason / Notes
                </label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-sans text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReq ? 'Transmitting...' : 'Transmit Requisition'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
