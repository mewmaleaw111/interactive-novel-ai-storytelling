'use client';

import React, { useEffect, useState } from 'react';
import type { Story } from '@/types/story';

interface EditStoryModalProps {
  isOpen: boolean;
  story: Story | null;
  onClose: () => void;
  onSaved: (story: Story) => void;
}

export const EditStoryModal: React.FC<EditStoryModalProps> = ({
  isOpen,
  story,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState('');

  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !story) return;

    setTitle(story.title);

    setCoverUrl(story.coverUrl || '');
    setCoverPreview(story.coverUrl || '');

    setError('');
  }, [isOpen, story]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !story) return null;

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (event.target === event.currentTarget && !isSaving) {
      onClose();
    }
  };

  const handleCoverChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type)
    ) {
      setError('รองรับเฉพาะ JPG, PNG และ WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5 MB');
      return;
    }

    setError('');
    setIsUploading(true);

    const localPreview = URL.createObjectURL(file);
    setCoverPreview(localPreview);

    try {
      const formData = new FormData();

      formData.append('file', file);

      const response = await fetch(
        '/api/upload-cover',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'ไม่สามารถอัปโหลดหน้าปกได้'
        );
      }

      setCoverUrl(data.url);
    } catch (uploadError) {
      console.error(
        'Cover Upload Error:',
        uploadError
      );

      setCoverPreview(
        story.coverUrl || ''
      );

      setCoverUrl(
        story.coverUrl || ''
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'ไม่สามารถอัปโหลดหน้าปกได้'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (isUploading || isSaving) return;

    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/stories/${story.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            cover_image_url: coverUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
  throw new Error(
    data.error ||
      'ไม่สามารถแก้ไขนิยายได้'
  );
}

onSaved({
  ...story,
  ...data.story,
  coverUrl:
    data.story.coverUrl ??
    data.story.cover_image_url ??
    coverUrl ??
    story.coverUrl,
});

onClose();
    } catch (saveError) {
      console.error(
        'Save Story Error:',
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="story-modal-overlay"
      onMouseDown={handleOverlayClick}
    >
      <div className="story-modal">

        {/* Header */}
        <div className="story-modal-header">
          <div>
            <span className="story-modal-eyebrow">
              STORY SETTINGS
            </span>

            <h2>แก้ไขนิยาย</h2>

            <p>
              แก้ไขชื่อเรื่องและหน้าปกนิยาย
            </p>
          </div>

          <button
            type="button"
            className="story-modal-close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="ปิด"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="story-modal-body">

            {/* Cover */}
            <div className="edit-cover-section">
              <div
                className="edit-cover-preview"
                style={
                  coverPreview
                    ? {
                        backgroundImage: `url("${coverPreview}")`,
                      }
                    : undefined
                }
              >
                {!coverPreview && (
                  <span>ไม่มีหน้าปก</span>
                )}

                {isUploading && (
                  <div className="cover-upload-loading">
                    กำลังอัปโหลด...
                  </div>
                )}
              </div>

              <div className="edit-cover-info">
                <h3>หน้าปกนิยาย</h3>

                <p>
                  ใช้ภาพ JPG, PNG หรือ WEBP
                  ขนาดไม่เกิน 5 MB
                </p>

                <label className="cover-change-button">
                  {isUploading
                    ? 'กำลังอัปโหลด...'
                    : 'เปลี่ยนหน้าปก'}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    disabled={
                      isUploading ||
                      isSaving
                    }
                  />
                </label>
              </div>
            </div>

            {/* Title */}
            <div className="story-form-field">
              <label>ชื่อเรื่อง</label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="ชื่อเรื่องของคุณ"
                maxLength={255}
                required
                disabled={isSaving}
              />
            </div>

            {/* Synopsis - Locked */}
            <div className="story-form-field">
              <label>
                เรื่องย่อ
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '0.8rem',
                    opacity: 0.6,
                  }}
                >
                  🔒 ล็อกแล้ว
                </span>
              </label>

              <textarea
                value={story.corePremise}
                rows={5}
                disabled
                readOnly
              />

              <small
                style={{
                  opacity: 0.65,
                  display: 'block',
                  marginTop: '6px',
                }}
              >
                เรื่องย่อเป็นแกนหลักของเนื้อเรื่อง
                จึงไม่สามารถแก้ไขหลังเริ่มเรื่องได้
              </small>
            </div>

            {/* Genre + Tone - Locked */}
            <div className="story-form-grid">

              <div className="story-form-field">
                <label>
                  แนวเรื่อง
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '0.8rem',
                      opacity: 0.6,
                    }}
                  >
                    🔒 ล็อกแล้ว
                  </span>
                </label>

                <input
                  type="text"
                  value={story.genre}
                  disabled
                  readOnly
                />
              </div>

              <div className="story-form-field">
                <label>
                  โทนเรื่อง
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '0.8rem',
                      opacity: 0.6,
                    }}
                  >
                    🔒 ล็อกแล้ว
                  </span>
                </label>

                <input
                  type="text"
                  value={story.tone}
                  disabled
                  readOnly
                />
              </div>

            </div>

            {error && (
              <div className="story-modal-error">
                {error}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="story-modal-footer">

            <button
              type="button"
              className="story-modal-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="story-modal-save"
              disabled={
                isSaving ||
                isUploading
              }
            >
              {isSaving
                ? 'กำลังบันทึก...'
                : 'บันทึกการเปลี่ยนแปลง'}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};
