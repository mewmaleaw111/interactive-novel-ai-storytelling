'use client';

import React, { useEffect } from 'react';
import type { Story } from '@/types/story';

interface DeleteStoryModalProps {
  isOpen: boolean;
  story: Story | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteStoryModal: React.FC<
  DeleteStoryModalProps
> = ({
  isOpen,
  story,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !story) return null;

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      event.target === event.currentTarget &&
      !isDeleting
    ) {
      onClose();
    }
  };

  return (
    <div
      className="story-modal-overlay"
      onMouseDown={handleOverlayClick}
    >
      <div className="delete-story-modal">
        <button
          type="button"
          className="story-modal-close"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="ปิด"
        >
          ×
        </button>

        <div className="delete-icon">
          🗑
        </div>

        <span className="story-modal-eyebrow">
          DELETE STORY
        </span>

        <h2>ลบนิยายเรื่องนี้?</h2>

        <p className="delete-story-name">
          “{story.title}”
        </p>

        <p className="delete-warning">
          บท ตัวละคร ความสัมพันธ์
          และข้อมูลการเล่นของนิยายเรื่องนี้
          จะถูกลบทั้งหมด
          <strong> และไม่สามารถกู้คืนได้</strong>
        </p>

        <div className="delete-story-actions">
          <button
            type="button"
            className="story-modal-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            ยกเลิก
          </button>

          <button
            type="button"
            className="delete-confirm-button"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting
              ? 'กำลังลบ...'
              : 'ลบนิยาย'}
          </button>
        </div>
      </div>
    </div>
  );
};