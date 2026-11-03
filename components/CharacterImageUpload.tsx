'use client';

import React, { useState } from 'react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

interface CharacterImageUploadProps {
  /** URL รูปปัจจุบัน (ว่าง = ยังไม่มีรูป) */
  imageUrl?: string;

  /** เรียกเมื่ออัปโหลดสำเร็จ หรือเมื่อลบรูป (ส่ง '' กลับมา) */
  onChange: (url: string) => void;

  /** ข้อความ alt ของรูป เช่น ชื่อตัวละคร */
  alt?: string;
}

export default function CharacterImageUpload({
  imageUrl,
  onChange,
  alt = 'รูปตัวละคร',
}: CharacterImageUploadProps) {
  const [isUploading, setIsUploading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.target;
    const file = input.files?.[0];

    // เคลียร์ค่า เพื่อให้เลือกไฟล์เดิมซ้ำได้
    input.value = '';

    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('รองรับเฉพาะไฟล์ JPG, PNG และ WEBP');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5 MB');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const uploadData = new FormData();

      uploadData.append('file', file);

      const response = await fetch(
        '/api/upload-character-image',
        {
          method: 'POST',
          body: uploadData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          'อัปโหลดรูปไม่สำเร็จ'
        );
      }

      onChange(data.url);
    } catch (uploadError) {
      console.error(
        'Character image upload error:',
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'อัปโหลดรูปไม่สำเร็จ'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="character-image-upload">

      <div className="character-image-preview">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt}
          />
        ) : (
          <span>ยังไม่มีรูป</span>
        )}
      </div>

      <div className="character-image-actions">

        <label className="story-create-upload">
          {isUploading
            ? 'กำลังอัปโหลด...'
            : imageUrl
              ? 'เปลี่ยนรูป'
              : 'เลือกรูปจากเครื่อง'}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>

        {imageUrl && !isUploading && (
          <button
            type="button"
            className="character-image-remove"
            onClick={() => {
              setError('');
              onChange('');
            }}
          >
            ลบรูป
          </button>
        )}

        <small>
          JPG, PNG หรือ WEBP ไม่เกิน 5 MB
        </small>

        {error && (
          <small className="character-image-error">
            {error}
          </small>
        )}

      </div>

    </div>
  );
}
