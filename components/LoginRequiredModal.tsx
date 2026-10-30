'use client';

import React from 'react';
import { SignInButton } from '@clerk/nextjs';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({
  isOpen,
  onClose,
}: LoginRequiredModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="login-required-modal-overlay"
      onClick={onClose}
    >
      <div
        className="login-required-modal-card"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <button
          type="button"
          className="login-required-modal-close"
          onClick={onClose}
          aria-label="ปิด"
        >
          ×
        </button>

        <div className="login-required-modal-icon">
          <span>🔐</span>
        </div>

        <div className="login-required-modal-content">

          <p className="login-required-modal-label">
            GonnaTales
          </p>

          <h2>
            กรุณาเข้าสู่ระบบ
          </h2>

          <p>
            เข้าสู่ระบบเพื่อเริ่มอ่านนิยาย
            <br />
            และบันทึกความคืบหน้าของคุณ
          </p>

        </div>

        <div className="login-required-modal-actions">

          <SignInButton mode="modal">
            <button
              type="button"
              className="login-required-modal-primary"
            >
              <span>
                เข้าสู่ระบบ
              </span>

              <span className="login-required-modal-arrow">
                →
              </span>
            </button>
          </SignInButton>

          <button
            type="button"
            className="login-required-modal-secondary"
            onClick={onClose}
          >
            ‹ กลับหน้าหลัก
          </button>

        </div>

        <p className="login-required-modal-footer">
          Your stories, your journey.
        </p>

      </div>
    </div>
  );
}