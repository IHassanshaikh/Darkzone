import React from 'react';

/**
 * ProgressBar component styled with DESIGN_OVERRIDES.md tokens.
 * Track uses #E4DFD0, fill uses status colors:
 * Danger #DC2626, Warning #D97706, Safe Green #16A34A.
 * Labels adhere to minimum 12px with tabular numeric values.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  variant = 'auto',
  size = 'md',
}) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / (max || 1)) * 100)));

  let barColor = 'bg-[#16A34A]';
  if (variant === 'auto') {
    if (percentage >= 80) barColor = 'bg-[#DC2626]';
    else if (percentage >= 50) barColor = 'bg-[#D97706]';
    else barColor = 'bg-[#16A34A]';
  } else if (variant === 'danger') {
    barColor = 'bg-[#DC2626]';
  } else if (variant === 'warning') {
    barColor = 'bg-[#D97706]';
  } else if (variant === 'success') {
    barColor = 'bg-[#16A34A]';
  } else if (variant === 'brand') {
    barColor = 'bg-[#2F4A2B]';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="mb-1.5 flex justify-between text-xs font-semibold">
          {label && <span className="text-[#5F6B5E]">{label}</span>}
          <span className="text-[#1C2A1F] tabular-nums font-heading font-medium">{valueLabel || `${percentage}%`}</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-[#E4DFD0] border border-[#D5CEBE]/50 ${heightClasses[size]}`}>
        <div
          className={`${heightClasses[size]} rounded-full ${barColor} transition-all duration-300 shadow-2xs`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
