import React from 'react';

/**
 * TagChip component with DESIGN_OVERRIDES.md status tokens.
 * Silent Risk / Dark Zone is formatted as a purple pill (#F5F3FF / #7C3AED / #A78BFA).
 * Labels are minimum 12px for projector legibility.
 */
export default function TagChip({ tag, variant }) {
  const normTag = (tag || '').toLowerCase();

  let styles = 'bg-[#F0EDE4] text-[#1C2A1F] border-[#D5CEBE]';

  if (variant === 'silent_risk' || normTag.includes('silent') || normTag.includes('dark')) {
    styles = 'bg-[#F5F3FF] text-[#7C3AED] border-[#A78BFA]';
  } else if (variant === 'danger' || normTag.includes('critical') || normTag.includes('high')) {
    styles = 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]';
  } else if (variant === 'warning' || normTag.includes('warn')) {
    styles = 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]';
  } else if (variant === 'success' || normTag.includes('safe') || normTag.includes('verified')) {
    styles = 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]';
  } else if (variant === 'reported' || normTag.includes('reported')) {
    styles = 'bg-[#EBF3ED] text-[#2F4A2B] border-[#C2D6C6]';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${styles}`}
    >
      {tag}
    </span>
  );
}
