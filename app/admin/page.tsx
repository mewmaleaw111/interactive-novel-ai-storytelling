'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DashboardStats = {
  storyCount: number;
  publishedStoryCount: number;
  privateStoryCount: number;

  userCount: number;

  sharedChapterCount: number;
  sessionChapterCount: number;
  totalChapterCount: number;

  sessionCount: number;
  publicSessionCount: number;
  privateSessionCount: number;
};

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
      <path d="M4 5.5V18" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 11a3 3 0 1 0 0-6" />
      <path d="M16 14a5 5 0 0 1 4.5 6" />
    </svg>
  );
}

function ChapterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9" />
      <path d="M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
      <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10h11" />
      <path d="m11 5 5 5-5 5" />
    </svg>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || 'ไม่สามารถโหลดข้อมูล Dashboard ได้'
          );
        }

        setStats(data.stats);
      } catch (error) {
        console.error('Dashboard Error:', error);

        setError(
          error instanceof Error
            ? error.message
            : 'ไม่สามารถโหลดข้อมูล Dashboard ได้'
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const number = (value: number | undefined) => {
    if (loading) return '—';
    return value ?? 0;
  };

  return (
    <main className="admin-page admin-dashboard">
      <div className="admin-container">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <header className="admin-page-header admin-dashboard-header">
          <span className="admin-dashboard-eyebrow">
            GONNATALES ADMIN
          </span>

          <h1 className="admin-dashboard-title">
            แดชบอร์ดผู้ดูแลระบบ
          </h1>

          <p className="admin-dashboard-description">
            ภาพรวมและการจัดการข้อมูลภายในระบบ GonnaTales
          </p>
        </header>

        {error ? (
          <div className="admin-error">
            <div className="admin-error-icon">
              !
            </div>

            <div>
              <h2>ไม่สามารถโหลดข้อมูลได้</h2>
              <p>{error}</p>

              <button
                type="button"
                className="admin-button"
                onClick={() => window.location.reload()}
              >
                ลองใหม่
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* =====================================================
                MAIN STATISTICS
            ====================================================== */}
            <section className="admin-dashboard-section">
              <div className="admin-section-heading">
                <div>
                  <span className="admin-section-kicker">
                    OVERVIEW
                  </span>

                  <h2>ภาพรวมระบบ</h2>

                  <p>
                    ข้อมูลสำคัญของ GonnaTales ในปัจจุบัน
                  </p>
                </div>
              </div>

              <div className="admin-dashboard-stats">

                {/* Stories */}
                <div className="admin-stat-card admin-stat-story">
                  <div className="admin-stat-icon">
                    <BookIcon />
                  </div>

                  <div className="admin-stat-content">
                    <span className="admin-stat-label">
                      นิยายทั้งหมด
                    </span>

                    <strong className="admin-stat-number">
                      {number(stats?.storyCount)}
                    </strong>

                    <small>
                      เรื่องในระบบ
                    </small>
                  </div>
                </div>

                {/* Users */}
                <div className="admin-stat-card admin-stat-user">
                  <div className="admin-stat-icon">
                    <UsersIcon />
                  </div>

                  <div className="admin-stat-content">
                    <span className="admin-stat-label">
                      ผู้ใช้ทั้งหมด
                    </span>

                    <strong className="admin-stat-number">
                      {number(stats?.userCount)}
                    </strong>

                    <small>
                      บัญชีผู้ใช้
                    </small>
                  </div>
                </div>

                {/* Chapters */}
                <div className="admin-stat-card admin-stat-chapter">
                  <div className="admin-stat-icon">
                    <ChapterIcon />
                  </div>

                  <div className="admin-stat-content">
                    <span className="admin-stat-label">
                      ตอนทั้งหมด
                    </span>

                    <strong className="admin-stat-number">
                      {number(stats?.totalChapterCount)}
                    </strong>

                    <small>
                      ตอนของนิยายทั้งหมด
                    </small>
                  </div>
                </div>

                {/* Published */}
                <div className="admin-stat-card admin-stat-published">
                  <div className="admin-stat-icon">
                    <CheckIcon />
                  </div>

                  <div className="admin-stat-content">
                    <span className="admin-stat-label">
                      นิยายเผยแพร่
                    </span>

                    <strong className="admin-stat-number">
                      {number(stats?.publishedStoryCount)}
                    </strong>

                    <small>
                      เปิดให้ผู้อื่นเข้าชม
                    </small>
                  </div>
                </div>
              </div>
            </section>

            {/* =====================================================
                MANAGEMENT
            ====================================================== */}
            <section className="admin-dashboard-section">
              <div className="admin-section-heading">
                <div>
                  <span className="admin-section-kicker">
                    MANAGEMENT
                  </span>

                  <h2>การจัดการระบบ</h2>

                  <p>
                    จัดการข้อมูลนิยาย ผู้ใช้ และการใช้งานภายในระบบ
                  </p>
                </div>
              </div>

              <div className="admin-menu-grid">

                {/* Stories */}
                <Link
                  href="/admin/stories"
                  className="admin-menu-card"
                >
                  <div className="admin-menu-icon">
                    <BookIcon />
                  </div>

                  <div className="admin-menu-content">
                    <div className="admin-menu-title-row">
                      <h3>จัดการนิยาย</h3>

                      <span className="admin-menu-arrow">
                        <ArrowIcon />
                      </span>
                    </div>

                    <p>
                      ดู ตรวจสอบ และจัดการนิยายทั้งหมด
                      ที่มีอยู่ในระบบ
                    </p>

                    <span className="admin-menu-link">
                      ดูนิยายทั้งหมด
                    </span>
                  </div>
                </Link>

                {/* Users */}
                <Link
                  href="/admin/users"
                  className="admin-menu-card"
                >
                  <div className="admin-menu-icon">
                    <UsersIcon />
                  </div>

                  <div className="admin-menu-content">
                    <div className="admin-menu-title-row">
                      <h3>จัดการผู้ใช้</h3>

                      <span className="admin-menu-arrow">
                        <ArrowIcon />
                      </span>
                    </div>

                    <p>
                      ตรวจสอบข้อมูลผู้ใช้ นิยาย และ
                      Game Sessions
                    </p>

                    <span className="admin-menu-link">
                      ดูผู้ใช้ทั้งหมด
                    </span>
                  </div>
                </Link>
              </div>
            </section>

            {/* =====================================================
                SESSIONS
            ====================================================== */}
            <section className="admin-dashboard-section">
              <div className="admin-section-heading">
                <div>
                  <span className="admin-section-kicker">
                    STORY SESSIONS
                  </span>

                  <h2>การเล่นนิยาย</h2>

                  <p>
                    สรุปเส้นเรื่องที่ผู้ใช้สร้างและกำลังใช้งาน
                  </p>
                </div>
              </div>

              <div className="admin-dashboard-overview">

                {/* All sessions */}
                <div className="admin-overview-card">
                  <div className="admin-overview-icon">
                    <SparkIcon />
                  </div>

                  <div className="admin-overview-content">
                    <span>Game Sessions</span>

                    <strong className="admin-overview-number">
                      {number(stats?.sessionCount)}
                    </strong>

                    <p>
                      จำนวนเส้นเรื่องที่ผู้ใช้สร้างไว้
                    </p>
                  </div>
                </div>

                {/* Public */}
                <div className="admin-overview-card">
                  <div className="admin-overview-icon">
                    <GlobeIcon />
                  </div>

                  <div className="admin-overview-content">
                    <span>Public Sessions</span>

                    <strong className="admin-overview-number">
                      {number(stats?.publicSessionCount)}
                    </strong>

                    <p>
                      เส้นเรื่องที่เปิดให้ผู้ใช้อื่นเข้าชม
                    </p>
                  </div>
                </div>

                {/* Private */}
                <div className="admin-overview-card">
                  <div className="admin-overview-icon">
                    <LockIcon />
                  </div>

                  <div className="admin-overview-content">
                    <span>Private Sessions</span>

                    <strong className="admin-overview-number">
                      {number(stats?.privateSessionCount)}
                    </strong>

                    <p>
                      เส้นเรื่องที่เก็บไว้เป็นส่วนตัว
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =====================================================
                STORY STATUS
            ====================================================== */}
            <section className="admin-dashboard-breakdown">
              <div className="admin-section-heading">
                <div>
                  <span className="admin-section-kicker">
                    STORY STATUS
                  </span>

                  <h2>สถานะนิยาย</h2>

                  <p>
                    สรุปจำนวนเนื้อหาและสถานะการเผยแพร่
                  </p>
                </div>
              </div>

              <div className="admin-dashboard-breakdown-grid">

                <div className="admin-breakdown-item">
                  <div className="admin-breakdown-icon published">
                    <CheckIcon />
                  </div>

                  <div>
                    <span>เผยแพร่แล้ว</span>

                    <strong className="admin-breakdown-number">
                      {number(stats?.publishedStoryCount)}
                    </strong>
                  </div>
                </div>

                <div className="admin-breakdown-item">
                  <div className="admin-breakdown-icon private">
                    <LockIcon />
                  </div>

                  <div>
                    <span>ส่วนตัว</span>

                    <strong className="admin-breakdown-number">
                      {number(stats?.privateStoryCount)}
                    </strong>
                  </div>
                </div>

                <div className="admin-breakdown-item">
                  <div className="admin-breakdown-icon shared">
                    <GlobeIcon />
                  </div>

                  <div>
                    <span>Shared Chapters</span>

                    <strong className="admin-breakdown-number">
                      {number(stats?.sharedChapterCount)}
                    </strong>
                  </div>
                </div>

                <div className="admin-breakdown-item">
                  <div className="admin-breakdown-icon session">
                    <ChapterIcon />
                  </div>

                  <div>
                    <span>Session Chapters</span>

                    <strong className="admin-breakdown-number">
                      {number(stats?.sessionChapterCount)}
                    </strong>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}