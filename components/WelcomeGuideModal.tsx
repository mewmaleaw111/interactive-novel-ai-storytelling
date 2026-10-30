'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../styles/welcome-guide-modal.css';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeGuideModal({
  isOpen,
  onClose,
}: WelcomeGuideModalProps) {
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  const handleGuideClick = () => {
    onClose();
    router.push('/guide');
  };

  return (
    <div
      className="welcome-guide-overlay"
    >
      <div
        className="welcome-guide-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="welcome-guide-close"
          onClick={onClose}
          aria-label="ปิด"
        >
          ×
        </button>

        <div className="welcome-guide-content">
          <span className="welcome-guide-eyebrow">
            WELCOME TO GONNATALES
          </span>

          <h2>
            ยินดีต้อนรับสู่
            <br />
            GonnaTales
          </h2>

          <p>
            เริ่มต้นสร้างนิยายด้วย AI
            <br />
            ได้ง่าย ๆ ในไม่กี่ขั้นตอน
          </p>

          <button
            type="button"
            className="welcome-guide-primary"
            onClick={handleGuideClick}
          >
            ดูคู่มือการใช้งาน
          </button>

          <button
            type="button"
            className="welcome-guide-secondary"
            onClick={onClose}
          >
            ข้ามไปก่อน
          </button>
        </div>
      </div>
    </div>
  );
}