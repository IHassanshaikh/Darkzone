import React, { useState } from 'react';
import { useAppStore } from '../store/index.jsx';
import SuggestedChip from '../components/SuggestedChip.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { extractEmergencyDetails } from '../lib/mockExtractor.js';

export default function TriagePage() {
  const { reports, addReport, areas } = useAppStore();
  const [reportText, setReportText] = useState(
    'Elderly couple trapped on second floor due to rising flood waters. Wheelchair user, urgent evacuation and insulin needed.'
  );
  const [selectedAreaId, setSelectedAreaId] = useState('area-c');
  const [extractedResult, setExtractedResult] = useState(null);
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleExtract = () => {
    if (!reportText.trim()) return;
    const result = extractEmergencyDetails(reportText);
    setExtractedResult(result);
    setSubmittedMessage(false);
  };

  const handleSaveToStore = () => {
    if (!reportText.trim() || !extractedResult) return;

    addReport({
      areaId: selectedAreaId,
      text: reportText,
      source: 'triage',
      extracted: extractedResult,
    });

    setSubmittedMessage(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Report Triage</h1>
          <p className="text-xs text-slate-500">
            Rapid text triage, entity extraction, and vulnerability assessment.
          </p>
        </div>
        <SuggestedChip text="NLP Extraction Engine" />
      </div>

      {/* Input Form Card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs space-y-4">
        <div>
          <label htmlFor="emergency-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Paste an emergency message
          </label>
          <textarea
            id="emergency-input"
            rows={4}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Paste an emergency message"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="area-select" className="text-xs font-semibold text-slate-600">
              Assign to Area:
            </label>
            <select
              id="area-select"
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-sky-500 focus:outline-none"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.id})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExtract}
            className="rounded-lg bg-sky-600 hover:bg-sky-500 px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            Extract details
          </button>
        </div>
      </div>

      {/* Extracted Result Card */}
      {extractedResult && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0F172A]">Extracted Entities</h2>
              <SuggestedChip text="Suggested" />
            </div>
            {extractedResult.urgency !== 'Not found' && (
              <StatusBadge status={extractedResult.urgency} size="sm" />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {/* Age */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Age</span>
              <p className={`mt-1 text-sm font-semibold capitalize ${extractedResult.age === 'Not found' ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                {extractedResult.age}
              </p>
            </div>

            {/* Mobility Issue */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobility issue</span>
              <p className={`mt-1 text-sm font-semibold capitalize ${extractedResult.mobilityIssue === 'Not found' ? 'text-slate-400 italic' : extractedResult.mobilityIssue === 'Yes' ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                {extractedResult.mobilityIssue}
              </p>
            </div>

            {/* Hazard */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hazard</span>
              <p className={`mt-1 text-sm font-semibold capitalize ${extractedResult.hazard === 'Not found' ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                {extractedResult.hazard}
              </p>
            </div>

            {/* Urgency */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Urgency</span>
              <p className={`mt-1 text-sm font-semibold capitalize ${extractedResult.urgency === 'Not found' ? 'text-slate-400 italic' : extractedResult.urgency === 'critical' ? 'text-rose-600 font-bold' : 'text-amber-700 font-bold'}`}>
                {extractedResult.urgency}
              </p>
            </div>

            {/* Assistance Needed */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assistance needed</span>
              <p className={`mt-1 text-sm font-semibold capitalize ${extractedResult.assistanceNeeded === 'Not found' ? 'text-slate-400 italic' : 'text-sky-700 font-bold'}`}>
                {extractedResult.assistanceNeeded}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Required Footer Note */}
            <p className="text-xs font-medium text-amber-800">
              A human must review this result.
            </p>

            <button
              type="button"
              onClick={handleSaveToStore}
              disabled={submittedMessage}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                submittedMessage
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-[#0F172A] text-white hover:bg-slate-800 cursor-pointer'
              }`}
            >
              {submittedMessage ? '✓ Queued into Field Reports' : 'Accept & add to reports'}
            </button>
          </div>
        </div>
      )}

      {/* Reports Feed */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
        <h2 className="text-base font-bold text-[#0F172A] mb-4">Past Triage Reports ({reports.length})</h2>
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-700 uppercase">{r.areaId}</span>
                    <span className="text-xs text-slate-500 font-mono">[{r.id}]</span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700 capitalize">
                      via {r.source || 'field'}
                    </span>
                    <SuggestedChip text="Suggested" />
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-slate-900">{r.text}</p>
                </div>
                {r.extracted?.urgency && r.extracted.urgency !== 'Not found' && (
                  <StatusBadge status={r.extracted.urgency} size="sm" />
                )}
              </div>

              {r.extracted && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {r.extracted.age && r.extracted.age !== 'Not found' && (
                    <span className="rounded bg-white px-2 py-0.5 border border-slate-200">
                      Age: <strong className="text-slate-800 capitalize">{r.extracted.age}</strong>
                    </span>
                  )}
                  {r.extracted.mobilityIssue && r.extracted.mobilityIssue !== 'Not found' && (
                    <span className="rounded bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-200">
                      Mobility issue: {r.extracted.mobilityIssue}
                    </span>
                  )}
                  {r.extracted.hazard && r.extracted.hazard !== 'Not found' && (
                    <span className="rounded bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200">
                      Hazard: {r.extracted.hazard}
                    </span>
                  )}
                  {r.extracted.assistanceNeeded && r.extracted.assistanceNeeded !== 'Not found' && (
                    <span className="rounded bg-sky-50 text-sky-700 px-2 py-0.5 border border-sky-200">
                      Needed: {r.extracted.assistanceNeeded}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
