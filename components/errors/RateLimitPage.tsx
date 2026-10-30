
'use client';

import { useEffect, useState } from 'react';
import styles from './RateLimitPage.module.css';

interface RateLimitPageProps {
  retryAfter: number;
}

export default function RateLimitPage({
  retryAfter,
}: RateLimitPageProps) {
  const [remaining, setRemaining] = useState(retryAfter);

  useEffect(() => {
    if (remaining <= 0) return;

    const timer = setTimeout(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <span aria-hidden="true">!</span>
        </div>

        <h1 className={styles.title}>
          พักสักครู่นะ
        </h1>

        <h2 className={styles.subtitle}>
          คุณเข้าใช้งานบ่อยเกินไป
        </h2>

        <p className={styles.description}>
          ระบบตรวจพบการเข้าถึงเว็บไซต์หลายครั้งในระยะเวลาสั้น ๆ
          เพื่อป้องกันการใช้งานที่ผิดปกติ
          กรุณารอสักครู่แล้วลองใหม่อีกครั้ง
        </p>

        <div className={styles.timerBox}>
          <p className={styles.timerLabel}>
            สามารถเข้าใช้งานได้อีกครั้งใน
          </p>

          <p
            className={styles.timer}
            aria-live="polite"
          >
            {formattedTime}
          </p>
        </div>

        <button
          type="button"
          disabled={remaining > 0}
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          {remaining > 0
            ? 'กรุณารอสักครู่...'
            : 'ลองเข้าเว็บไซต์อีกครั้ง'}
        </button>

        <p className={styles.errorCode}>
          HTTP ERROR 429 · TOO MANY REQUESTS
        </p>
      </div>
    </main>
  );
}
