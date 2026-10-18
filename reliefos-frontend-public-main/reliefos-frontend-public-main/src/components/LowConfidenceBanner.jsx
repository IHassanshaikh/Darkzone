import React from 'react';

/**
 * LowConfidenceBanner component styled with DESIGN_OVERRIDES.md amber warning tokens.
 * Background: #FEF3C7, border: #FCD34D, text: #92400E / #D97706, 12px radius.
 */
export default function LowConfidenceBanner({
  message = 'Low confidence: field check recommended',
  detail,
  compact = false,
}) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-[#FCD34D] bg-[#FEF3C7] px-3 py-1.5 text-xs text-[#92400E] font-medium">
        <svg className="h-4 w-4 shrink-0 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-[#FCD34D] bg-[#FEF3C7] p-4 text-[#92400E]">
      <div className="mt-0.5 rounded-lg bg-[#FDE68A] p-1.5 text-[#D97706] shrink-0">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold font-heading text-[#78350F]">{message}</h4>
        {detail && <p className="mt-1 text-xs text-[#92400E] leading-relaxed">{detail}</p>}
      </div>
    </div>
  );
}
