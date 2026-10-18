import React from 'react';

/**
 * ErrorState component styled with DESIGN_OVERRIDES.md red high-risk tokens.
 * Background: #FEE2E2, border: #FCA5A5, text: #DC2626, radius: 12px.
 * Retry button: red outline per button guidelines.
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#FCA5A5] bg-[#FEE2E2]/60 p-8 text-center shadow-[0_1px_3px_rgba(28,42,31,0.04)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="mt-3 text-base font-bold font-heading text-[#991B1B]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-[#DC2626] leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#DC2626] bg-[#FFFDF7] hover:bg-[#FEE2E2] px-3.5 py-1.5 text-xs font-semibold text-[#DC2626] transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-[#DC2626]"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      )}
    </div>
  );
}
