import React from 'react';

/**
 * StatusBadge component conforming to DESIGN_OVERRIDES.md status colors.
 * Red #DC2626 (tint #FEE2E2), Amber #D97706 (tint #FEF3C7), Safe Green #16A34A (tint #DCFCE7) with check icon,
 * Purple #7C3AED (tint #F5F3FF) only for Dark Zone/Silent Risk.
 * Every status has an icon and text label; labels are minimum 12px.
 */
export default function StatusBadge({ status, label, size = 'md' }) {
  const normStatus = String(status || '').toLowerCase().replace(/[\s-]/g, '_');

  const statusConfig = {
    // High Risk / Critical (Red)
    critical: { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]', iconType: 'alert' },
    high: { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]', iconType: 'alert' },
    confirmed: { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]', iconType: 'alert' },

    // Warning / Degraded (Amber)
    warning: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FCD34D]', iconType: 'warning' },
    moderate: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FCD34D]', iconType: 'warning' },
    in_progress: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FCD34D]', iconType: 'pulse' },
    in_transit: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FCD34D]', iconType: 'pulse' },
    pending: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FCD34D]', iconType: 'clock' },
    assigned: { bg: 'bg-[#EBF3ED]', text: 'text-[#2F4A2B]', border: 'border-[#C2D6C6]', iconType: 'info' },

    // Safe / Nominal (Safe Green)
    low: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#86EFAC]', iconType: 'check' },
    done: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#86EFAC]', iconType: 'check' },
    delivered: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#86EFAC]', iconType: 'check' },
    available: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#86EFAC]', iconType: 'check' },
    verified_safe: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#86EFAC]', iconType: 'check' },
    safe: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#86EFAC]', iconType: 'check' },
    ok: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#86EFAC]', iconType: 'check' },

    // Dark Zone / Silent Risk (Purple)
    silent_risk: { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', border: 'border-[#C4B5FD]', iconType: 'purple_dot' },
    dark_zone: { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', border: 'border-[#C4B5FD]', iconType: 'purple_dot' },
    team_sent: { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', border: 'border-[#C4B5FD]', iconType: 'purple_dot' },

    // Neutral / Inactive
    on_duty: { bg: 'bg-[#EBF3ED]', text: 'text-[#2F4A2B]', border: 'border-[#C2D6C6]', iconType: 'pulse' },
    offline: { bg: 'bg-[#F0EDE4]', text: 'text-[#5F6B5E]', border: 'border-[#D5CEBE]', iconType: 'dot' },
    none: { bg: 'bg-[#F0EDE4]', text: 'text-[#5F6B5E]', border: 'border-[#D5CEBE]', iconType: 'dot' },
    rejected: { bg: 'bg-[#F0EDE4]', text: 'text-[#5F6B5E]', border: 'border-[#D5CEBE]', iconType: 'cross' },
  };

  const current = statusConfig[normStatus] || {
    bg: 'bg-[#F0EDE4]',
    text: 'text-[#5F6B5E]',
    border: 'border-[#D5CEBE]',
    iconType: 'dot',
  };

  const displayText = label || (status ? String(status).replace(/_/g, ' ') : 'unknown');

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };

  const renderIcon = () => {
    switch (current.iconType) {
      case 'check':
        return (
          <svg className="h-3 w-3 shrink-0 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="h-3 w-3 shrink-0 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'warning':
      case 'clock':
        return (
          <svg className="h-3 w-3 shrink-0 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'cross':
        return (
          <svg className="h-3 w-3 shrink-0 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        );
      case 'purple_dot':
        return <span className="h-2 w-2 rounded-full bg-[#7C3AED] shrink-0" />;
      case 'pulse':
        return <span className="h-2 w-2 rounded-full bg-current animate-pulse shrink-0" />;
      default:
        return <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border capitalize ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}
    >
      {renderIcon()}
      <span>{displayText}</span>
    </span>
  );
}
