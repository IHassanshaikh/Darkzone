import React from 'react';

/**
 * ConfirmDialog modal component styled with DESIGN_OVERRIDES.md tokens.
 * Modal surface: #FFFDF7 with #E4DFD0 border, 12px radius.
 * Buttons: Primary action #2F4A2B (hover #243A21), Danger #DC2626, with 8px radius and #6B8F5E focus ring.
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger' | 'warning'
  onConfirm,
  onCancel,
  children,
}) {
  if (!isOpen) return null;

  const confirmColors = {
    primary: 'bg-[#2F4A2B] hover:bg-[#243A21] text-white font-semibold focus-visible:outline-2 focus-visible:outline-[#6B8F5E]',
    danger: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold focus-visible:outline-2 focus-visible:outline-[#DC2626]',
    warning: 'bg-[#D97706] hover:bg-[#B45309] text-white font-semibold focus-visible:outline-2 focus-visible:outline-[#D97706]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F3D2B]/50 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[12px] border border-[#E4DFD0] bg-[#FFFDF7] p-6 shadow-xl">
        <h3 className="text-lg font-bold font-heading text-[#1C2A1F]">{title}</h3>
        <p className="mt-2 text-sm text-[#5F6B5E] leading-relaxed">{description}</p>
        
        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#E4DFD0] bg-[#FFFDF7] px-4 py-2 text-xs font-medium text-[#1C2A1F] hover:bg-[#F6F3EA] transition-colors focus-visible:outline-2 focus-visible:outline-[#6B8F5E]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs transition-colors shadow-xs ${confirmColors[confirmVariant] || confirmColors.primary}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
