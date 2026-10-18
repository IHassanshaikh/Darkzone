'use client';

import React from 'react';
import { Scale, ShieldCheck, AlertTriangle, BookOpen, Lock, Radio, Cpu, HeartHandshake } from 'lucide-react';

export default function LimitsTradeoffs() {
  const tradeoffs = [
    {
      area: 'Detection Logic',
      built: 'Rule-based composite Dark Zone score with transparent, explainable reason checklist',
      leftOut: 'Black-box machine learning classifier',
      why: 'No verified historical training dataset during hackathon; rule gates are human-verifiable, deterministic, and auditable.'
    },
    {
      area: 'Engine Weights',
      built: 'Configurable weights object (silence 0.35, hazard 0.35, vuln 0.10, network 0.20)',
      leftOut: 'Empirically calibrated statistical weights',
      why: 'Field calibration requires longitudinal disaster telemetry; stated openly on UI: "Weights are our assumptions, not validated."'
    },
    {
      area: 'Response Dispatch',
      built: 'Field verification recommendation with human coordinator confirmation ("Suggested")',
      leftOut: 'Automated autonomous rescue dispatch',
      why: 'Silence can also signify safe pre-evacuation; automated dispatch without human ground verification risks wasted emergency assets.'
    },
    {
      area: 'Offline Connectivity',
      built: 'PWA service worker app shell caching + IndexedDB idempotent offline sync queue',
      leftOut: 'Native mobile Bluetooth Low Energy (BLE) peripheral background daemon',
      why: 'Web browsers are sandbox-restricted from accessing raw Bluetooth ad-hoc sockets; native mobile app required for true physical mesh.'
    },
    {
      area: 'Mesh Demonstration',
      built: 'Real Web Crypto API (ECDH P-256 key exchange + AES-GCM 256 authenticated encryption)',
      leftOut: 'Hardware radio-frequency packet broadcasting',
      why: 'Proves mathematical end-to-end encryption honestly across untrusted relays without faking physical hardware.'
    },
    {
      area: 'Identity & Access',
      built: 'Role Switcher toggle (Rescue Coordinator / Field Volunteer / Camp Manager)',
      leftOut: 'Multi-factor authentication (MFA) & OAuth sessions',
      why: 'Fast role-shifting during presentation evaluation; allows judges to immediately test multi-perspective flows.'
    },
    {
      area: 'Resource Routing',
      built: 'Nearest-camp Haversine distance heuristic beyond minimum camp reserves',
      leftOut: 'Road network graph routing with real-time bridge-out constraints',
      why: 'Straight-line distance gives an explainable, fast approximation without external proprietary GIS dependencies.'
    },
    {
      area: 'Distress Triage',
      built: 'Deterministic rule-based keyword & entity extractor with zero-hallucination fallback',
      leftOut: 'Direct client-side LLM inference API keys',
      why: 'Protects proprietary API keys from client exposure; produces guaranteed "Not found" fallbacks rather than confabulations.'
    }
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm sm:text-base font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">
            SYSTEM TRADEOFFS // DESIGN CONSTRAINTS
          </h1>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
            TRANSPARENCY
          </span>
        </div>
      </div>

      {/* Research Literature Note */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-200 dark:border-purple-500/40 relative overflow-hidden shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-500/50 flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Research Synthesis &amp; Novelty Disclosure
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              "The team reviewed about 20 academic papers spanning missing disaster data, vulnerable demographic mapping, telecommunication outages, crowdsourced distress signals, unmet humanitarian needs, and resource allocation heuristics. While these individual concepts are explored in literature, we did not find the specific combination of an <strong>expected-versus-actual reporting gap</strong> cross-correlated with <strong>vulnerability share, hazard severity, and infrastructure collapse</strong> in the papers we evaluated."
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-purple-700 dark:text-purple-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>We never claim "first in the world"; we present an honest, explainable engineering integration.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade-offs Table */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Architectural Trade-Off Matrix
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            8 Architectural Dimensions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 font-bold">System Layer</th>
                <th className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">What We Built</th>
                <th className="py-3 px-3 font-bold text-amber-700 dark:text-amber-400">What We Left Out</th>
                <th className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">Engineering Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {tradeoffs.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {t.area}
                  </td>
                  <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200">
                    {t.built}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                    {t.leftOut}
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                    {t.why}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closing Pitch Highlight (Solid, Non-Gradient) */}
      <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          The ReliefOS + DARK ZONE Operational Thesis
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto italic font-medium">
          "ReliefOS doesn't only help those who ask. It finds those who can't ask, then sends supplies there first."
        </p>
      </div>
    </div>
  );
}
