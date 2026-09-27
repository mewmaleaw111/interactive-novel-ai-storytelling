'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import type {
  CreateStoryFormData,
} from '@/types/story';

import '../../../styles/generating.css';

const CREATE_KEY =
  'GonnaTales_create_story';

const GENERATING_KEY =
  'GonnaTales_generating';

const RESULT_KEY =
  'GonnaTales_generated_story';

const STORY_ID_KEY =
  'GonnaTales_generating_story_id';

const DRAFT_KEY =
  'GonnaTales_create_story_draft';

export default function GeneratingStoryPage() {
  const router = useRouter();

  const hasStarted = useRef(false);

  const [message, setMessage] = useState(
    'กำลังเรียบเรียงเรื่องราวของคุณ'
  );

  const [formData, setFormData] =
    useState<CreateStoryFormData | null>(
      null
    );

  const [error, setError] = useState('');

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const generateStory = async () => {
      try {
        // ==================================================
        // 1. ดึงข้อมูล Story ใหม่ก่อน
        // ==================================================

        const savedData =
          sessionStorage.getItem(
            CREATE_KEY
          );

        // ==================================================
        // ถ้าไม่มีข้อมูลสำหรับสร้าง Story ใหม่
        // ให้ตรวจสอบว่าเป็นผลลัพธ์เก่าหรือไม่
        // ==================================================

        if (!savedData) {
          const savedResult =
            sessionStorage.getItem(
              RESULT_KEY
            );

          if (savedResult) {
            try {
              const result =
                JSON.parse(
                  savedResult
                );

              if (result.storyId) {
                router.replace(
                  `/story/${result.storyId}`
                );

                return;
              }
            } catch {
              sessionStorage.removeItem(
                RESULT_KEY
              );
            }
          }

          router.replace('/');
          return;
        }

        // ==================================================
        // 2. อ่านข้อมูลจาก Create Story
        // ==================================================

        const parsedData:
          CreateStoryFormData =
          JSON.parse(savedData);

        setFormData(parsedData);

        // ==================================================
        // 3. สร้าง / ใช้ Story ID เดิม
        //
        // ถ้าหน้า Generating ถูก Refresh ระหว่างสร้าง
        // จะยังใช้ ID เดิม เพื่อป้องกัน Story ซ้ำ
        // ==================================================

        let storyId =
          sessionStorage.getItem(
            STORY_ID_KEY
          );

        if (!storyId) {
          storyId =
            crypto.randomUUID();

          sessionStorage.setItem(
            STORY_ID_KEY,
            storyId
          );
        }

        // ==================================================
        // 4. สถานะกำลังสร้าง
        // ==================================================

        const isGenerating =
          sessionStorage.getItem(
            GENERATING_KEY
          );

        if (
          isGenerating === 'true'
        ) {
          setMessage(
            'กำลังตรวจสอบเรื่องราวของคุณ'
          );
        } else {
          sessionStorage.setItem(
            GENERATING_KEY,
            'true'
          );

          setMessage(
            'กำลังเรียบเรียงบทแรกของเรื่อง'
          );
        }

        // ==================================================
        // 5. เรียก Generate Story API
        // ==================================================

        const res =
          await fetch(
            '/api/generate-story',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                actionType:
                  'create_story',

                formData:
                  parsedData,

                storyId:
                  storyId,
              }),
            }
          );

        // ==================================================
        // 6. อ่าน Response
        // ==================================================

        let data: {
          success?: boolean;
          storyId?: string;
          alreadyCreated?: boolean;
          error?: string;
        };

        try {
          data =
            await res.json();
        } catch {
          throw new Error(
            'ไม่สามารถอ่านผลจากระบบสร้างนิยายได้'
          );
        }

        // ==================================================
        // 7. ตรวจสอบ API Error
        // ==================================================

        if (
          !res.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
            'ไม่สามารถสร้างนิยายได้'
          );
        }

        // ==================================================
        // 8. ต้องได้รับ Story ID จริงจาก Backend
        // ==================================================

        if (!data.storyId) {
          throw new Error(
            'ระบบสร้างนิยายสำเร็จแต่ไม่ได้รับ Story ID'
          );
        }

        // ==================================================
        // 9. ตรวจสอบว่า Story ID ตรงกับที่ส่งไปหรือไม่
        // ==================================================

        console.log(
          'Story created successfully:',
          data.storyId
        );

        console.log(
          'Already created:',
          data.alreadyCreated
        );

        // ==================================================
        // 10. เก็บผลลัพธ์ล่าสุด
        // ==================================================

        sessionStorage.setItem(
          RESULT_KEY,
          JSON.stringify({
            storyId:
              data.storyId,
          })
        );

        // ==================================================
        // 11. ล้างข้อมูลที่ใช้สร้าง
        // ==================================================

        sessionStorage.removeItem(
          CREATE_KEY
        );

        sessionStorage.removeItem(
          DRAFT_KEY
        );

        sessionStorage.removeItem(
          GENERATING_KEY
        );

        sessionStorage.removeItem(
          STORY_ID_KEY
        );

        // ==================================================
        // 12. ไปหน้า Story จริง
        // ==================================================

        router.replace(
          `/story/${data.storyId}`
        );
      } catch (error) {
        console.error(
          'Generate Story Error:',
          error
        );

        sessionStorage.removeItem(
          GENERATING_KEY
        );

        setError(
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการสร้างนิยาย'
        );

        setMessage(
          'ดูเหมือนว่าการสร้างเรื่องจะสะดุดเล็กน้อย'
        );
      }
    };

    generateStory();
  }, [router]);

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <main className="generating-page">
        <div className="generating-card error-card">

          <div className="ornament">
            ───── ❦ ─────
          </div>

          <div className="eyebrow">
            GonnaTales
          </div>

          <h1>
            ยังสร้างเรื่อง
            <br />
            ไม่สำเร็จ
          </h1>

          <p className="error-message">
            {error}
          </p>

          <div className="error-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                sessionStorage.removeItem(
                  GENERATING_KEY
                );

                sessionStorage.removeItem(
                  STORY_ID_KEY
                );

                router.back();
              }}
            >
              กลับไปแก้ไข
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                sessionStorage.removeItem(
                  GENERATING_KEY
                );

                sessionStorage.removeItem(
                  STORY_ID_KEY
                );

                window.location.reload();
              }}
            >
              ลองอีกครั้ง
            </button>

          </div>
        </div>
      </main>
    );
  }

  // ==================================================
  // GENERATING
  // ==================================================

  return (
    <main className="generating-page">

      <div className="generating-card">

        <div className="ornament">
          ───── ❦ ─────
        </div>

        <div className="eyebrow">
          GonnaTales
        </div>

        <h1>
          กำลังเรียบเรียง
          <br />
          เรื่องราวของคุณ
        </h1>

        {formData?.title && (
          <div className="story-preview">

            <span className="preview-label">
              เรื่อง
            </span>

            <span className="story-title">
              {formData.title}
            </span>

          </div>
        )}

        <p className="message">
          {message}

          <span className="dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>

        <div className="writing-area">

          <div
            className="paper-line line-one"
          />

          <div
            className="paper-line line-two"
          />

          <div
            className="paper-line line-three"
          />

          <div className="writing-cursor" />

        </div>

        <p className="sub-message">
          ใช้เวลาสักครู่
          <br />
          เรื่องราวบทแรกกำลังจะเริ่มต้น
        </p>

      </div>

    </main>
  );
}