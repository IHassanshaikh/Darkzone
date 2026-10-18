import React, { useState } from 'react';
import { useAppStore } from '../store/index.jsx';
import SuggestedChip from '../components/SuggestedChip.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function AllocationPage() {
  const {
    allocationSuggestions,
    approveAllocation,
    duties,
    updateDutyStatus,
    volunteers,
  } = useAppStore();

  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState('v-03');
  const [approvedIds, setApprovedIds] = useState(new Set());

  // Filter delivery duties for the delivery tracker
  const deliveryDuties = duties.filter((d) => d.type === 'delivery');

  // Filter unapproved suggestions
  const pendingSuggestions = allocationSuggestions.filter(
    (s) => !approvedIds.has(s.id)
  );

  const handleApprove = () => {
    if (selectedSuggestion) {
      approveAllocation(selectedSuggestion, selectedVolunteer);
      setApprovedIds((prev) => new Set(prev).add(selectedSuggestion.id));
      setSelectedSuggestion(null);
    }
  };

  const handleAdvanceDelivery = (dutyId, currentStatus) => {
    if (currentStatus === 'assigned') {
      updateDutyStatus(dutyId, 'in_progress');
    } else if (currentStatus === 'in_progress') {
      updateDutyStatus(dutyId, 'done');
    }
  };

  const availableVolunteers = volunteers.filter(
    (v) => v.status === 'available' || v.status === 'on_duty'
  );

  const steps = ['Pending', 'In transit', 'Delivered'];

  const getStepIndex = (status) => {
    if (status === 'done') return 2;
    if (status === 'in_progress') return 1;
    return 0; // 'assigned' or 'pending'
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">
          Allocation & Delivery
        </h1>
        <p className="text-xs text-slate-500">
          Automated surplus-to-deficit matching and end-to-end delivery tracking.
        </p>
      </div>

      {/* SECTION 1: Suggested Transfers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#0F172A]">Suggested transfers</h2>
            <SuggestedChip />
          </div>
          <span className="text-xs text-slate-500">
            {pendingSuggestions.length} pending suggestion(s)
          </span>
        </div>

        {pendingSuggestions.length === 0 ? (
          <EmptyState
            title="No transfers needed."
            description="All camps currently meet minimum reserves or donor reserves are exhausted."
          />
        ) : (
          <div className="space-y-3">
            {pendingSuggestions.map((s) => {
              const reason = `${s.shortage} units ${s.item} deficit at ${s.toCampId.toUpperCase()}; donor ${s.fromCampId.toUpperCase()} has ${s.surplus} surplus`;

              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-[#0F172A] capitalize">
                          {s.fromCampId.toUpperCase()} → {s.toCampId.toUpperCase()}
                        </span>
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700 border border-sky-200 capitalize">
                          {s.quantity} {s.item}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {s.distanceKm} km
                        </span>
                        <SuggestedChip />
                      </div>

                      <p className="text-xs text-slate-600">
                        Reason: <strong className="text-slate-800">{reason}</strong>
                      </p>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedSuggestion(s)}
                        className="rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Delivery Tracker */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Delivery tracker</h2>
          <p className="text-xs text-slate-500">
            Real-time status tracking for dispatched relief consignments.
          </p>
        </div>

        {deliveryDuties.length === 0 ? (
          <EmptyState
            title="No active deliveries."
            description="Approve suggested transfers above to dispatch delivery duties."
          />
        ) : (
          <div className="space-y-4">
            {deliveryDuties.map((duty) => {
              const currentStep = getStepIndex(duty.status);
              const volunteer = volunteers.find((v) => v.id === duty.volunteerId);

              return (
                <div
                  key={duty.id}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0F172A] capitalize">
                          {duty.fromCampId ? `${duty.fromCampId.toUpperCase()} → ${duty.toAreaOrCampId.toUpperCase()}` : duty.toAreaOrCampId.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs text-slate-500">[{duty.id}]</span>
                        {duty.item && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 capitalize">
                            {duty.quantity}x {duty.item}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Assigned Volunteer: <strong className="text-slate-700">{volunteer?.name || duty.volunteerId}</strong>
                      </p>
                    </div>

                    <div>
                      {duty.status !== 'done' && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceDelivery(duty.id, duty.status)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          {duty.status === 'assigned' ? 'Start Transit →' : 'Mark Delivered ✓'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-Step Stepper: Pending -> In transit -> Delivered */}
                  <div className="relative flex items-center justify-between px-4 sm:px-12 py-2">
                    {/* Connecting line */}
                    <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
                    <div
                      className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-sky-600 transition-all duration-300 z-0"
                      style={{
                        width: currentStep === 2 ? 'calc(100% - 4rem)' : currentStep === 1 ? 'calc(50% - 2rem)' : '0%',
                      }}
                    />

                    {steps.map((label, idx) => {
                      const isCompleted = currentStep > idx;
                      const isCurrent = currentStep === idx;

                      return (
                        <div key={label} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                              isCompleted
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                : isCurrent
                                ? 'bg-sky-600 text-white ring-4 ring-sky-100 shadow-xs'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`mt-2 text-xs font-semibold ${
                              isCurrent
                                ? 'text-sky-700 font-bold'
                                : isCompleted
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(selectedSuggestion)}
        title="Approve Resource Dispatch"
        description={`Deploy ${selectedSuggestion?.quantity} units of ${selectedSuggestion?.item} from ${selectedSuggestion?.fromCampId.toUpperCase()} to ${selectedSuggestion?.toCampId.toUpperCase()} (${selectedSuggestion?.distanceKm} km)?`}
        confirmText="Approve"
        onConfirm={handleApprove}
        onCancel={() => setSelectedSuggestion(null)}
      >
        <div className="mt-3 text-xs">
          <label className="block font-semibold text-slate-700 mb-1">
            Assign Delivery Volunteer:
          </label>
          <select
            value={selectedVolunteer}
            onChange={(e) => setSelectedVolunteer(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
          >
            {availableVolunteers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.status}) — Skills: {v.skills.join(', ')}
              </option>
            ))}
          </select>
        </div>
      </ConfirmDialog>
    </div>
  );
}
