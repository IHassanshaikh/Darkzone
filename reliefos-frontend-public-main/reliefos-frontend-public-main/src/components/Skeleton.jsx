import React from 'react';

/**
 * Skeleton loading placeholder styled for the warm cream palette.
 * Uses #E4DFD0 / #EAE5D9 animated shimmer.
 */
export default function Skeleton({ className = '', variant = 'rect', count = 1 }) {
  const baseStyles = 'animate-pulse bg-[#E4DFD0]/80';
  
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rect: 'rounded-[12px]',
  };

  const items = Array.from({ length: count });

  if (count === 1) {
    return <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} />;
  }

  return (
    <div className="space-y-3">
      {items.map((_, i) => (
        <div key={i} className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
      ))}
    </div>
  );
}
