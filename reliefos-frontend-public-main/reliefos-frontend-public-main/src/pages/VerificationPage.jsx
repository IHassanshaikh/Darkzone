import React, { useState } from 'react';
import { useAppStore } from '../store/index.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function VerificationPage() {
  const { areas, volunteers, duties, sendFieldTeam, verifyArea } = useAppStore();

  // Selected volunteers per area for the "Assign team" multi-select
  const [selectedVolunteersMap, setSelectedVolunteersMap] = useState({});

  // Toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Reject modal state
  const [rejectArea, setRejectArea] = useState(null);
  const [rejectNote, setRejectNote] = useState('Ground report indicated area is currently stable and accessible.');

  // List of areas that are Dark Zones OR have a field team sent, excluding rejected areas
  const verificationAreas = areas.filter(
    (a) => (a.assessment?.isDarkZone || a.verification === 'team_sent') && a.verification !== 'rejected'
  );

  const availableVolunteers = volunteers.filter(
    (v) => v.status === 'available' || v.status === 'on_duty'
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAssignTeam = (areaId) => {
    const selected = selectedVolunteersMap[areaId] || ['v-02'];
    sendFieldTeam(areaId, selected, 'Dispatched via Field Verification console');
    showToast(`Field team (${selected.join(', ')}) assigned to ${areaId}.`);
  };

  const handleConfirm = (areaId) => {
    verifyArea(areaId, 'confirmed', 'Ground team verified high vulnerability and critical distress.');
    showToast('Area raised in priority list.');
  };

  const handleRejectSubmit = () => {
    if (!rejectArea) return;
    verifyArea(rejectArea.id, 'rejected', rejectNote);
    setRejectArea(null);
    setRejectNote('Ground report indicated area is currently stable and accessible.');
    showToast('Area marked as rejected and removed from Silent Risk.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-3 text-xs font-semibold text-white shadow-xl border border-slate-700 animate-bounce">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white font-bold">
            ✓
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Field Verification</h1>
        <p className="text-xs text-slate-500">
          Human verification console for unconfirmed Dark Zones and dispatched field survey missions.
        </p>
      </div>

      {/* Mandatory Top Banner per Screen 6 */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-2xs">
        <svg className="h-5 w-5 shrink-0 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="text-xs font-semibold">
          Verification is required. No automatic rescue.
        </div>
      </div>

      {/* Areas List */}
      {verificationAreas.length === 0 ? (
        <EmptyState
          title="No areas need verification."
          description="All flagged sectors have been field-confirmed, verified safe, or cleared."
        />
      ) : (
        <div className="space-y-4">
          {verificationAreas.map((area) => {
            const currentSelected = selectedVolunteersMap[area.id] || ['v-02'];
            const assignedDuties = duties.filter(
              (d) => d.type === 'verification' && d.toAreaOrCampId === area.id
            );

            return (
              <div
                key={area.id}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs transition-all hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-[#E2E8F0] pb-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-[#0F172A]">{area.name}</h3>
                      <span className="font-mono text-xs text-slate-500">[{area.id}]</span>
                      <StatusBadge status={area.verification || 'none'} />
                      {area.assessment?.isDarkZone && (
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                          Potential Dark Zone
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      Population: <strong className="text-slate-800">{area.population}</strong> •
                      Actual reports: <strong className="text-rose-600 font-bold">{area.actualReports}</strong> (expected ~{Math.round(area.population * area.vulnerableShare * area.hazardSeverity * 0.16)})
                    </p>
                  </div>

                  {/* Confirm / Reject Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectArea(area)}
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirm(area.id)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                </div>

                {/* Reasons List */}
                {area.assessment?.reasons && (
                  <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Flagging Reasons
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {area.assessment.reasons.map((r, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Assign Team Multi-Select Section */}
                <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Assign team (Multi-select available volunteers):
                      </label>
                      <select
                        multiple
                        value={currentSelected}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, (o) => o.value);
                          setSelectedVolunteersMap((prev) => ({
                            ...prev,
                            [area.id]: values,
                          }));
                        }}
                        className="w-full h-20 rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                      >
                        {availableVolunteers.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.status}) — Skills: {v.skills.join(', ')}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Hold Ctrl / Cmd to multi-select volunteers
                      </span>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleAssignTeam(area.id)}
                        className="rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors h-fit"
                      >
                        Assign Team
                      </button>
                    </div>
                  </div>

                  {/* Active Assigned Missions */}
                  {assignedDuties.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-2 flex flex-wrap items-center gap-2">
                      <span className="text-slate-500 text-[11px] font-medium">Active team:</span>
                      {assignedDuties.map((d) => {
                        const vol = volunteers.find((v) => v.id === d.volunteerId);
                        return (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200"
                          >
                            <span>{vol?.name || d.volunteerId}</span>
                            <span className="text-[10px] font-normal text-slate-400">({d.status})</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal with Note requirement */}
      <ConfirmDialog
        isOpen={Boolean(rejectArea)}
        title={`Reject Dark Zone: ${rejectArea?.name}`}
        description="Rejecting requires a field verification note and removes this sector from the Silent Risk priority queue."
        confirmText="Confirm Rejection"
        confirmVariant="danger"
        onConfirm={handleRejectSubmit}
        onCancel={() => setRejectArea(null)}
      >
        <div className="mt-3 text-xs">
          <label className="block font-semibold text-slate-700 mb-1">
            Required Rejection Note / Ground Evidence:
          </label>
          <textarea
            rows={3}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Document why this area is confirmed safe or a false alarm..."
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
