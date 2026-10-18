import React from 'react';

/**
 * StatCard component for summary metrics across dashboards.
 * Warm cream #FFFDF7 card with #E4DFD0 border, 12px radius, and 40px bold Hanken Grotesk metrics.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  highlight = false,
  onClick,
}) {
  const variantStyles = {
    default: 'border-[#E4DFD0] bg-[#FFFDF7] text-[#1C2A1F] hover:border-[#D5CEBE]',
    danger: 'border-[#DC2626]/30 bg-[#FEE2E2]/60 text-[#1C2A1F] hover:border-[#DC2626]/50',
    warning: 'border-[#D97706]/30 bg-[#FEF3C7]/60 text-[#1C2A1F] hover:border-[#D97706]/50',
    success: 'border-[#16A34A]/30 bg-[#DCFCE7]/60 text-[#1C2A1F] hover:border-[#16A34A]/50',
    info: 'border-[#6B8F5E]/30 bg-[#F6F3EA] text-[#1C2A1F] hover:border-[#6B8F5E]/50',
    purple: 'border-[#A78BFA] border-l-[3px] border-l-[#7C3AED] bg-[#F5F3FF] text-[#1C2A1F] hover:border-[#8B5CF6]',
  };

  const valueColors = {
    default: 'text-[#1C2A1F]',
    danger: 'text-[#DC2626]',
    warning: 'text-[#D97706]',
    success: 'text-[#16A34A]',
    info: 'text-[#2F4A2B]',
    purple: 'text-[#7C3AED]',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-[12px] border p-5 shadow-[0_1px_3px_rgba(28,42,31,0.04)] transition-all duration-200 ${
        variantStyles[variant] || variantStyles.default
      } ${highlight ? 'ring-2 ring-[#DC2626] shadow-md' : ''} ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5F6B5E]">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-[40px] font-bold font-heading tabular-nums leading-none ${valueColors[variant] || 'text-[#1C2A1F]'}`}>
              {value}
            </span>
            {trend && <span className="text-xs font-medium text-[#5F6B5E]">{trend}</span>}
          </div>
          {subtitle && <p className="mt-1.5 text-xs text-[#5F6B5E]">{subtitle}</p>}
        </div>
        {icon && (
          <div className="rounded-lg bg-[#F6F3EA] p-2.5 text-[#1C2A1F] border border-[#E4DFD0]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
