import React, { useState } from 'react';
import { useAppStore } from '../store/index.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { usePendingSync } from '../hooks/usePendingSync.js';

export default function VolunteersPage() {
  const {
    role,
    volunteers,
    duties,
    isOnline,
    updateDutyStatus,
    updateVolunteerStatus,
  } = useAppStore();

  const { pendingCount, flush } = usePendingSync();

  // Admin filter state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available' | 'on_duty' | 'offline'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'delivery' | 'verification' | 'support'

  // Admin side panel state
  const [panelVolunteer, setPanelVolunteer] = useState(null);

  // Volunteer mode state: active selected volunteer profile
  const [activeVolunteerId, setActiveVolunteerId] = useState('v-03'); // Sana Mahmood

  const currentVolunteer = volunteers.find((v) => v.id === activeVolunteerId) || volunteers[0];

  const handleNextStatus = (dutyId, currentStatus) => {
    if (currentStatus === 'assigned') {
      updateDutyStatus(dutyId, 'in_progress');
    } else if (currentStatus === 'in_progress') {
      updateDutyStatus(dutyId, 'done');
    } else {
      updateDutyStatus(dutyId, 'assigned');
    }
  };

  // Filtered lists for Admin view
  const filteredVolunteers = volunteers.filter((v) => {
    if (statusFilter === 'all') return true;
    return v.status === statusFilter;
  });

  const filteredDuties = duties.filter((d) => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    return true;
  });

  // Filtered duties for Volunteer personal view
  const myDuties = duties.filter((d) => d.volunteerId === currentVolunteer?.id);

  // Duties for side panel volunteer
  const panelDuties = panelVolunteer
    ? duties.filter((d) => d.volunteerId === panelVolunteer.id)
    : [];

  // Counts for summary
  const availableCount = volunteers.filter((v) => v.status === 'available').length;
  const onDutyCount = volunteers.filter((v) => v.status === 'on_duty').length;
  const offlineCount = volunteers.filter((v) => v.status === 'offline').length;

  return (
    <div className="space-y-6 relative">
      {/* Page Title & Top Sync Controls for Volunteer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">
            {role === 'volunteer' ? 'Field Duties & Volunteer Profile' : 'Volunteers Roster & Operations'}
          </h1>
          <p className="text-xs text-slate-500">
            {role === 'volunteer'
              ? 'Real-time task tracking, mission status reporting, and personal availability.'
              : 'Mobilization management, task assignments, and responder availability.'}
          </p>
        </div>

        {/* Volunteer My Dashboard sync bar: chip Online/Offline, badge Pending sync (0), disabled Sync now button */}
        {role === 'volunteer' && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                isOnline
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-300 bg-amber-50 text-amber-800'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>

            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Pending sync ({pendingCount})
            </span>

            <button
              type="button"
              onClick={flush}
              disabled={pendingCount === 0}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                pendingCount > 0
                  ? 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer'
                  : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              Sync now
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* VOLUNTEER VIEW: Focused Personal Dashboard                     */}
      {/* ============================================================== */}
      {role === 'volunteer' && (
        <div className="space-y-6">
          {/* Volunteer Profile & Status Switcher Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 font-bold text-base border border-sky-200">
                  {currentVolunteer.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#0F172A]">{currentVolunteer.name}</h2>
                    <span className="font-mono text-xs text-slate-500">[{currentVolunteer.id}]</span>
                    <StatusBadge status={currentVolunteer.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Field Location: <strong className="text-slate-700">{currentVolunteer.lat}, {currentVolunteer.lng}</strong> •
                    Skills: {currentVolunteer.skills.join(', ')}
                  </p>
                </div>
              </div>

              {/* Status Switcher Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">My Availability:</span>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                  {['available', 'on_duty', 'offline'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateVolunteerStatus(currentVolunteer.id, st)}
                      className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                        currentVolunteer.status === st
                          ? 'bg-white text-[#0F172A] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Persona Switcher for Evaluation */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">Switch Persona for testing:</span>
              <div className="flex flex-wrap gap-1.5">
                {volunteers.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVolunteerId(v.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                      v.id === currentVolunteer.id
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {v.name} ({v.id})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* My Assigned Duties List */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">My Assigned Missions ({myDuties.length})</h3>
                <p className="text-xs text-slate-500">
                  Update task milestones as you execute deliveries or ground verifications.
                </p>
              </div>
            </div>

            {myDuties.length === 0 ? (
              <EmptyState
                title="No duties assigned."
                description="You currently have no pending field duties. Stand by for coordinator dispatch."
              />
            ) : (
              <div className="space-y-3">
                {myDuties.map((duty) => (
                  <div
                    key={duty.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-all hover:border-slate-300"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#0F172A] capitalize">
                          {duty.type} Task
                        </span>
                        <span className="font-mono text-xs text-slate-500">[{duty.id}]</span>
                        <StatusBadge status={duty.status} />
                        {duty.item && (
                          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 capitalize">
                            {duty.quantity}x {duty.item}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        Destination / Target: <strong className="text-slate-800">{duty.toAreaOrCampId}</strong>
                        {duty.fromCampId && <span> (Origin: <strong>{duty.fromCampId}</strong>)</span>}
                        {duty.note && <span className="block mt-0.5 text-purple-700">Note: {duty.note}</span>}
                      </p>
                    </div>

                    <div>
                      {duty.status !== 'done' ? (
                        <button
                          type="button"
                          onClick={() => handleNextStatus(duty.id, duty.status)}
                          className="rounded-lg bg-sky-600 hover:bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
                        >
                          {duty.status === 'assigned' ? 'Start Mission →' : 'Complete Mission ✓'}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Completed ✓
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADMIN VIEW: Full Volunteer Force Roster & Global Duties       */}
      {/* ============================================================== */}
      {role === 'admin' && (
        <div className="space-y-6">
          {/* Summary Stat Pills */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-semibold">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-2xs">
              <span className="text-slate-500 text-[11px] uppercase">Total Registered</span>
              <div className="text-xl font-bold text-[#0F172A] mt-1">{volunteers.length}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-2xs">
              <span className="text-emerald-800 text-[11px] uppercase">Available</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{availableCount}</div>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-3.5 shadow-2xs">
              <span className="text-cyan-800 text-[11px] uppercase">On Duty</span>
              <div className="text-xl font-bold text-cyan-700 mt-1">{onDutyCount}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-100/60 p-3.5 shadow-2xs">
              <span className="text-slate-600 text-[11px] uppercase">Offline</span>
              <div className="text-xl font-bold text-slate-700 mt-1">{offlineCount}</div>
            </div>
          </div>

          {/* Volunteer Roster Section */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Field Volunteers ({volunteers.length})</h2>
                <p className="text-xs text-slate-500">Click any volunteer to open profile side panel with duties</p>
              </div>

              {/* Status Filter */}
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                {['all', 'available', 'on_duty', 'offline'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                      statusFilter === filter
                        ? 'bg-white text-[#0F172A] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {filter.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {filteredVolunteers.length === 0 ? (
              <EmptyState title="No volunteers match filter" description="Try selecting a different status filter." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredVolunteers.map((vol) => {
                  const volDutyCount = duties.filter((d) => d.volunteerId === vol.id && d.status !== 'done').length;

                  return (
                    <div
                      key={vol.id}
                      onClick={() => setPanelVolunteer(vol)}
                      className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 shadow-2xs transition-all hover:border-sky-400 hover:bg-white hover:shadow-xs cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-sky-700 transition-colors">
                            {vol.name}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-500">{vol.id}</span>
                        </div>
                        <StatusBadge status={vol.status} size="sm" />
                      </div>

                      <div className="mt-2.5 text-[11px] text-slate-500">
                        GPS: <strong className="text-slate-700">{vol.lat}, {vol.lng}</strong>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {vol.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 border-t border-slate-200 pt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Active tasks:</span>
                        <span className="font-bold text-sky-700">{volDutyCount} (view profile →)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Global Duties Log */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Operations Duty Log ({duties.length})</h2>
                <p className="text-xs text-slate-500">All assigned and in-progress missions</p>
              </div>

              {/* Type Filter */}
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                {['all', 'delivery', 'verification', 'support'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all ${
                      typeFilter === t
                        ? 'bg-white text-[#0F172A] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {filteredDuties.length === 0 ? (
              <EmptyState title="No duties match filter" description="No missions found for the selected type." />
            ) : (
              <div className="space-y-3">
                {filteredDuties.map((duty) => {
                  const assignedVol = volunteers.find((v) => v.id === duty.volunteerId);

                  return (
                    <div
                      key={duty.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F172A] capitalize">{duty.type} Duty</span>
                          <span className="font-mono text-slate-400">[{duty.id}]</span>
                          <StatusBadge status={duty.status} size="sm" />
                          {duty.item && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700 capitalize">
                              {duty.quantity}x {duty.item}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1">
                          Assigned to: <strong className="text-slate-800">{assignedVol?.name || duty.volunteerId}</strong> •
                          Target: <strong className="text-slate-800">{duty.toAreaOrCampId}</strong>
                          {duty.fromCampId && <span> (Origin: <strong>{duty.fromCampId}</strong>)</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleNextStatus(duty.id, duty.status)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          Advance Status →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SIDE PANEL: Volunteer Profile & Duties Drawer (Admin Roster)    */}
      {/* ============================================================== */}
      {panelVolunteer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="h-full w-full max-w-md bg-white border-l border-[#E2E8F0] shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#0F172A]">{panelVolunteer.name}</h3>
                    <StatusBadge status={panelVolunteer.status} size="sm" />
                  </div>
                  <span className="font-mono text-xs text-slate-500">[{panelVolunteer.id}]</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelVolunteer(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Telemetry info */}
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-xs space-y-2">
                <div>
                  <span className="text-slate-500">GPS Coordinates:</span>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{panelVolunteer.lat}, {panelVolunteer.lng}</div>
                </div>
                <div>
                  <span className="text-slate-500">Verified Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {panelVolunteer.skills.map((s) => (
                      <span key={s} className="rounded bg-white px-2 py-0.5 border border-slate-200 text-[11px] font-medium text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Volunteer Duties in Side Panel */}
              <div>
                <h4 className="text-sm font-bold text-[#0F172A] mb-3">
                  Assigned Missions ({panelDuties.length})
                </h4>

                {panelDuties.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center rounded-xl border border-dashed border-slate-200">
                    No duties currently assigned to this volunteer.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {panelDuties.map((duty) => (
                      <div
                        key={duty.id}
                        className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0F172A] capitalize">{duty.type}</span>
                            <span className="font-mono text-slate-400">[{duty.id}]</span>
                          </div>
                          <StatusBadge status={duty.status} size="sm" />
                        </div>

                        <p className="text-slate-600">
                          Destination: <strong className="text-slate-800">{duty.toAreaOrCampId}</strong>
                          {duty.fromCampId && <span> (From: <strong>{duty.fromCampId}</strong>)</span>}
                          {duty.item && <span> • <strong>{duty.quantity}x {duty.item}</strong></span>}
                          {duty.note && <span className="block text-purple-700 mt-1">Note: {duty.note}</span>}
                        </p>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleNextStatus(duty.id, duty.status)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                          >
                            Advance Status →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setPanelVolunteer(null)}
                className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
              >
                Close Side Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
