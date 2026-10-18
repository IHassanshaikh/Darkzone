import React from 'react';

/**
 * SuggestedChip component with DESIGN_OVERRIDES.md amber warning tint #FEF3C7,
 * #D97706 text, and minimum 12px label for projector readability.
 */
export default function SuggestedChip({ text = 'Suggested', tooltip = 'Automated recommendation — requires human confirmation' }) {
  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#FCD34D] bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#D97706] shadow-2xs"
    >
      <svg className="h-3.5 w-3.5 text-[#D97706] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>{text}</span>
    </span>
  );
}
