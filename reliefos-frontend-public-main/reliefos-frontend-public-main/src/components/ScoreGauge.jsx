import React from 'react';

/**
 * ScoreGauge component for composite scores (0-100).
 * Styled with DESIGN_OVERRIDES.md status colors:
 * High risk >= 75: Red #DC2626 (#FEE2E2), Elevated >= 50: Amber #D97706 (#FEF3C7),
 * Safe < 50: Safe Green #16A34A (#DCFCE7). Background ring uses border color #E4DFD0.
 */
export default function ScoreGauge({ score = 0, label = 'Score', size = 'md' }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  let color = 'text-[#16A34A] border-[#86EFAC] bg-[#DCFCE7]/60';
  let strokeColor = '#16A34A';

  if (clamped >= 75) {
    color = 'text-[#DC2626] border-[#FCA5A5] bg-[#FEE2E2]/60';
    strokeColor = '#DC2626';
  } else if (clamped >= 50) {
    color = 'text-[#D97706] border-[#FCD34D] bg-[#FEF3C7]/60';
    strokeColor = '#D97706';
  } else if (clamped >= 25) {
    color = 'text-[#2F4A2B] border-[#C2D6C6] bg-[#EBF3ED]/60';
    strokeColor = '#2F4A2B';
  }

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold font-heading tabular-nums ${color}`}>
        <span>{clamped}</span>
        {label && <span className="text-xs opacity-75 font-normal uppercase">{label}</span>}
      </div>
    );
  }

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`inline-flex items-center gap-3 rounded-[12px] border p-3 shadow-2xs ${color}`}>
      <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
        <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="#E4DFD0"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke={strokeColor}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute text-sm font-black font-heading tabular-nums text-[#1C2A1F]">{clamped}</span>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#5F6B5E]">{label}</div>
        <div className="text-xs font-bold text-[#1C2A1F]">
          {clamped >= 75 ? 'Critical Risk' : clamped >= 50 ? 'Elevated' : 'Moderate'}
        </div>
      </div>
    </div>
  );
}
