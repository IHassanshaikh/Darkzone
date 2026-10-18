'use client';

import React, { useState, useEffect } from 'react';
import { fetchVolunteers, updateVolunteerStatusAction, fetchDuties } from '../lib/api';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  UserCheck, 
  Shield, 
  PhoneCall, 
  CheckCircle, 
  Clock, 
  Search, 
  X, 
  Calendar, 
  Radio, 
  RefreshCw 
} from 'lucide-react';

export default function VolunteersDirectory() {
  const { showToast } = useApp();
  const [volunteers, setVolunteers] = useState([]);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available' | 'on_duty' | 'offline'
  const [searchQuery, setSearchQuery] = useState('');

  // Selected volunteer for detail drawer
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [volsData, dutiesData] = await Promise.all([
        fetchVolunteers(),
        fetchDuties()
      ]);
      setVolunteers(volsData);
      setDuties(dutiesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetStatus = async (id, nextStatus) => {
    try {
      await updateVolunteerStatusAction(id, nextStatus);
      showToast(`Status updated to ${nextStatus.replace('_', ' ').toUpperCase()}.`, 'success');
      setVolunteers(prev => prev.map(v => v.id === id ? { ...v, status: nextStatus } : v));
      if (selectedVolunteer && selectedVolunteer.id === id) {
        setSelectedVolunteer(prev => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const availableCount = volunteers.filter(v => v.status === 'available').length;
  const onDutyCount = volunteers.filter(v => v.status === 'on_duty').length;
  const offlineCount = volunteers.filter(v => v.status === 'offline').length;

  const filteredVolunteers = volunteers.filter(vol => {
    if (statusFilter !== 'all' && vol.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = vol.name?.toLowerCase().includes(q);
      const matchId = vol.id?.toLowerCase().includes(q);
      const matchSkill = vol.skills?.some(s => s.toLowerCase().includes(q));
      return matchName || matchId || matchSkill;
    }
    return true;
  });

  const selectedDuties = selectedVolunteer 
    ? duties.filter(d => d.volunteerId === selectedVolunteer.id)
    : [];

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm sm:text-base font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
            FIELD PERSONNEL ROSTER
          </h1>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {volunteers.length} ACTIVE OPERATORS
          </span>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Control Bar: Status Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded font-bold transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ALL ({volunteers.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-2.5 py-1 rounded font-bold transition ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            AVAILABLE ({availableCount})
          </button>
          <button
            onClick={() => setStatusFilter('on_duty')}
            className={`px-2.5 py-1 rounded font-bold transition ${
              statusFilter === 'on_duty'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100'
            }`}
          >
            ON DUTY ({onDutyCount})
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={`px-2.5 py-1 rounded font-bold transition ${
              statusFilter === 'offline'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
            }`}
          >
            OFFLINE ({offlineCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, skill, ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of Volunteer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredVolunteers.map((vol) => {
          const isAvailable = vol.status === 'available';
          const isOnDuty = vol.status === 'on_duty';
          const isOffline = vol.status === 'offline';
          const volDuties = duties.filter(d => d.volunteerId === vol.id);

          return (
            <div
              key={vol.id}
              onClick={() => setSelectedVolunteer(vol)}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-xs cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : isOnDuty
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {vol.status.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{vol.id}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300 flex-shrink-0">
                    {vol.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {vol.name}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400">
                      {vol.role || 'Field Operator'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {(vol.skills || []).map((skill, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">
                  {volDuties.length} {volDuties.length === 1 ? 'task' : 'tasks'}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                  Inspect &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side Inspector Drawer / Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-end backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full p-5 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Top */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
                    OPERATOR PROFILE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVolunteer(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedVolunteer.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {selectedVolunteer.id}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  Phone: <strong>{selectedVolunteer.phone || '+1-555-0192'}</strong>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  Role: <strong>{selectedVolunteer.role || 'Search & Rescue Medic'}</strong>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(selectedVolunteer.skills || []).map((s, i) => (
                    <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Switcher Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase">SET DISPATCH STATUS:</span>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(selectedVolunteer.id, 'available')}
                    className={`py-1.5 rounded font-bold border transition ${
                      selectedVolunteer.status === 'available'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(selectedVolunteer.id, 'on_duty')}
                    className={`py-1.5 rounded font-bold border transition ${
                      selectedVolunteer.status === 'on_duty'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    On Duty
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(selectedVolunteer.id, 'offline')}
                    className={`py-1.5 rounded font-bold border transition ${
                      selectedVolunteer.status === 'offline'
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Offline
                  </button>
                </div>
              </div>

              {/* Assigned Tasks */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                  <span>ASSIGNED TASKS &amp; MISSIONS ({selectedDuties.length})</span>
                </div>

                {selectedDuties.length === 0 ? (
                  <p className="text-xs font-mono text-slate-400 py-3 text-center">
                    No active assignments. Responder is available for dispatch.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDuties.map(d => (
                      <div key={d.id} className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white uppercase">
                            {d.type} // {d.toName || d.toId}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            d.status === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {d.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {d.instructions}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedVolunteer(null)}
              className="w-full py-2 rounded-md font-mono text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 mt-4 transition"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
