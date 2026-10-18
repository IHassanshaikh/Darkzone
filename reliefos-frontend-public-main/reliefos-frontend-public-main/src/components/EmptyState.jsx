import React from 'react';

/**
 * EmptyState component styled with DESIGN_OVERRIDES.md tokens.
 * Card: #FFFDF7, 1px dashed #E4DFD0, 12px radius.
 * Action button: primary forest green #2F4A2B with 8px radius and #6B8F5E focus ring.
 */
export default function EmptyState({
  title = 'No records found',
  description = 'There is currently no data to display for this view.',
  icon,
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#E4DFD0] bg-[#FFFDF7] p-10 text-center shadow-[0_1px_3px_rgba(28,42,31,0.04)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6F3EA] text-[#5F6B5E] border border-[#E4DFD0]">
        {icon || (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-base font-bold font-heading text-[#1C2A1F]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-[#5F6B5E] leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2F4A2B] hover:bg-[#243A21] px-4 py-2 text-xs font-semibold text-white transition-colors shadow-xs focus-visible:outline-2 focus-visible:outline-[#6B8F5E]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
