import React from 'react';

export default function LimitsPage() {
  const disclosureList = [
    'Mock data only, no real personal data',
    'Weights are our assumptions, not validated',
    'Mesh is simulated',
    'Role switcher is not authentication',
    'We did not find this combination in the ~20 papers we reviewed',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Limits & Trade-offs</h1>
        <p className="text-xs text-slate-500">
          Transparent system boundaries, architectural trade-offs, and design disclosures.
        </p>
      </div>

      {/* 3 Core Cards: What we built, What we left out, Why */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 1: What we built */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 font-bold text-sm">
              ✓
            </span>
            <h2 className="text-base font-bold text-[#0F172A]">What we built</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            A combined relief operations platform with an automated Dark Zone detection engine to surface silent, unserved areas before crisis escalation:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span><strong>Dark Zone engine:</strong> flags high-hazard, high-vulnerability sectors with unexpectedly low reporting rates.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span><strong>Unified priority queue:</strong> blends Dark Zone silent risk with reported camp inventory deficits.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span><strong>Allocation & transfers:</strong> matches camp surpluses to critical shortages via Haversine distance heuristics.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span><strong>Offline queue:</strong> IndexedDB persistent queue with auto-flush on reconnection.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span><strong>Mesh simulator:</strong> real Web Crypto ECDH P-256 + AES-GCM multi-hop encryption demonstration.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: What we left out */}
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 font-bold text-sm">
              ⊘
            </span>
            <h2 className="text-base font-bold text-[#0F172A]">What we left out</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Deliberately excluded features to maintain safety, prototype honesty, and operational realism:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span><strong>No automatic rescue dispatch:</strong> every algorithmically detected risk requires field verification by a human.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span><strong>No real personal data or PII:</strong> zero tracking of real citizen phone numbers, identities, or addresses.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span><strong>No native Bluetooth drivers:</strong> browser sandboxes cannot manage raw ad-hoc peer-to-peer radio protocols.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span><strong>No production authentication:</strong> role switcher is a presentation toggle, not a cryptographic security barrier.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span><strong>No ungrounded AI guessing:</strong> triage entity extraction returns "Not found" when text lacks clear signal.</span>
            </li>
          </ul>
        </div>

        {/* Card 3: Why */}
        <div className="rounded-2xl border border-sky-200 bg-white p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-sky-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 font-bold text-sm">
              💡
            </span>
            <h2 className="text-base font-bold text-[#0F172A]">Why</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The humanitarian and ethical rationale guiding our architecture and design trade-offs:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Human-in-the-loop safety:</strong> automated algorithmic rescue risks sending finite responder teams to false positives while silent communities perish.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Realistic capabilities:</strong> false promises of browser Bluetooth mesh endanger lives during actual disaster blackouts.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Suggested label policy:</strong> every recommendation is explicitly marked "Suggested" so coordinators retain moral agency.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Simplicity under pressure:</strong> deterministic heuristics run instantly in offline browsers when infrastructure collapses.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Disclosures & Key Assumptions List */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Disclosures & Key Assumptions</h2>
          <p className="text-xs text-slate-500">
            Explicit technical boundaries and assumptions documented for evaluators and responders.
          </p>
        </div>

        <div className="space-y-2.5">
          {disclosureList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold font-mono text-slate-700">
                {idx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-800">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
