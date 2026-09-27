'use client';

import { useEffect } from 'react';

type AdminConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'ban' | 'unban' | 'delete';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function AdminConfirmModal({
  open,
  title,
  description,
  confirmText,
  cancelText = 'ยกเลิก',
  variant = 'ban',
  loading = false,
  onConfirm,
  onCancel,
}: AdminConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="admin-confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        className={`admin-confirm-modal admin-confirm-${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-description"
      >
        <div className="admin-confirm-icon">
          {variant === 'delete' ? '!' : '?'}
        </div>

        <div className="admin-confirm-content">
          <h2 id="admin-confirm-title">
            {title}
          </h2>

          <p id="admin-confirm-description">
            {description}
          </p>
        </div>

        <div className="admin-confirm-actions">
          <button
            type="button"
            className="admin-confirm-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="admin-confirm-submit"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'กำลังดำเนินการ...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}