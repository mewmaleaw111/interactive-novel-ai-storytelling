'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type User = {
  id: string;
  userId: string;
  displayName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type Story = {
  id: string;
  title: string;
  synopsis: string | null;
  genre: string | null;
  tone: string | null;
  total_chapters: number;
  is_published: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type Session = {
  id: string;
  storyId: string;
  storyTitle: string;
  storyGenre: string | null;
  currentChapter: number;
  isPublic: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type Stats = {
  storyCount: number;
  publishedStoryCount: number;
  privateStoryCount: number;
  sessionCount: number;
  publicSessionCount: number;
  privateSessionCount: number;
};

function formatDate(date: string | null) {
  if (!date) {
    return '-';
  }

  return new Date(date).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/* =========================================================
   Loading Skeleton
   ========================================================= */

function UserDetailSkeleton() {
  return (
    <main className="admin-page admin-user-detail-page">
      <div className="admin-container">
        {/* Header Skeleton */}
        <header className="admin-page-header">
          <div className="admin-user-detail-skeleton-header">
            <div className="admin-skeleton admin-skeleton-back" />

            <div className="admin-skeleton admin-skeleton-title" />

            <div className="admin-skeleton admin-skeleton-subtitle" />
          </div>
        </header>

        {/* Profile Skeleton */}
        <section className="admin-user-profile-card admin-user-profile-skeleton">
          <div className="admin-user-profile-main">
            <div className="admin-skeleton admin-skeleton-avatar" />

            <div className="admin-user-profile-info">
              <div className="admin-skeleton admin-skeleton-profile-name" />

              <div className="admin-skeleton admin-skeleton-profile-id" />
            </div>
          </div>

          <div className="admin-user-profile-details">
            <div className="admin-user-profile-detail">
              <div className="admin-skeleton admin-skeleton-detail-label" />

              <div className="admin-skeleton admin-skeleton-detail-value" />
            </div>

            <div className="admin-user-profile-detail">
              <div className="admin-skeleton admin-skeleton-detail-label" />

              <div className="admin-skeleton admin-skeleton-detail-value" />
            </div>
          </div>
        </section>

        {/* Stats Skeleton */}
        <section className="admin-user-stats">
          <div className="admin-user-stat-card">
            <div className="admin-skeleton admin-skeleton-stat-label" />

            <div className="admin-skeleton admin-skeleton-stat-value" />

            <div className="admin-skeleton admin-skeleton-stat-description" />
          </div>

          <div className="admin-user-stat-card">
            <div className="admin-skeleton admin-skeleton-stat-label" />

            <div className="admin-skeleton admin-skeleton-stat-value" />

            <div className="admin-skeleton admin-skeleton-stat-description" />
          </div>
        </section>

        {/* Stories Skeleton */}
        <section className="admin-detail-card">
          <div className="admin-section-header">
            <div>
              <div className="admin-skeleton admin-skeleton-section-title" />

              <div className="admin-skeleton admin-skeleton-section-description" />
            </div>

            <div className="admin-skeleton admin-skeleton-count" />
          </div>

          <div className="admin-user-story-list">
            <UserStorySkeleton />
            <UserStorySkeleton />
          </div>
        </section>

        {/* Sessions Skeleton */}
        <section className="admin-detail-card">
          <div className="admin-section-header">
            <div>
              <div className="admin-skeleton admin-skeleton-section-title" />

              <div className="admin-skeleton admin-skeleton-section-description" />
            </div>

            <div className="admin-skeleton admin-skeleton-count" />
          </div>

          <div className="admin-user-session-list">
            <UserSessionSkeleton />
            <UserSessionSkeleton />
            <UserSessionSkeleton />
          </div>
        </section>
      </div>
    </main>
  );
}

function UserStorySkeleton() {
  return (
    <article className="admin-user-story-item admin-skeleton-item">
      <div className="admin-user-story-content">
        <div className="admin-user-story-header">
          <div className="admin-skeleton admin-skeleton-story-title" />

          <div className="admin-skeleton admin-skeleton-status" />
        </div>

        <div className="admin-user-story-meta">
          <div className="admin-skeleton admin-skeleton-meta" />
          <div className="admin-skeleton admin-skeleton-meta admin-skeleton-meta-short" />
          <div className="admin-skeleton admin-skeleton-meta-short" />
        </div>

        <div className="admin-skeleton admin-skeleton-story-description" />

        <div className="admin-skeleton admin-skeleton-story-date" />
      </div>

      <div className="admin-user-story-action">
        <div className="admin-skeleton admin-skeleton-action-button" />
      </div>
    </article>
  );
}

function UserSessionSkeleton() {
  return (
    <article className="admin-user-session-item admin-skeleton-item">
      <div className="admin-skeleton admin-skeleton-session-number" />

      <div className="admin-user-session-content">
        <div className="admin-user-session-header">
          <div>
            <div className="admin-skeleton admin-skeleton-session-title" />

            <div className="admin-skeleton admin-skeleton-session-id" />
          </div>

          <div className="admin-skeleton admin-skeleton-status" />
        </div>

        <div className="admin-user-session-meta">
          <div className="admin-skeleton admin-skeleton-session-meta" />

          <div className="admin-skeleton admin-skeleton-session-meta admin-skeleton-session-meta-short" />

          <div className="admin-skeleton admin-skeleton-session-meta" />
        </div>
      </div>

      <div className="admin-user-session-action">
        <div className="admin-skeleton admin-skeleton-action-button" />
      </div>
    </article>
  );
}

/* =========================================================
   Page
   ========================================================= */

export default function AdminUserDetailPage() {
  const params = useParams();

  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUser() {
      if (!userId) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/admin/users/${encodeURIComponent(userId)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'
          );
        }

        setUser(data.user ?? null);
        setStats(data.stats ?? null);
        setStories(data.stories ?? []);
        setSessions(data.sessions ?? []);
      } catch (error) {
        console.error('Admin User Detail Error:', error);

        setError(
          error instanceof Error
            ? error.message
            : 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userId]);

  /* -------------------------------------------------------
     Loading
     ------------------------------------------------------- */

  if (loading) {
    return <UserDetailSkeleton />;
  }

  /* -------------------------------------------------------
     Error
     ------------------------------------------------------- */

  if (error || !user || !stats) {
    return (
      <main className="admin-page admin-user-detail-page">
        <div className="admin-container">
          <div className="admin-page-header">
            <Link
              href="/admin/users"
              className="admin-back-link"
            >
              <span aria-hidden="true">‹</span>
              กลับไปผู้ใช้
            </Link>
          </div>

          <div className="admin-error">
            <h2>ไม่สามารถโหลดข้อมูลได้</h2>

            <p>
              {error || 'ไม่พบข้อมูลผู้ใช้'}
            </p>

            <Link
              href="/admin/users"
              className="admin-button"
            >
              กลับไปหน้าผู้ใช้
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* -------------------------------------------------------
     Main
     ------------------------------------------------------- */

  return (
    <main className="admin-page admin-user-detail-page">
      <div className="admin-container">
        {/* Header */}
        <header className="admin-page-header admin-user-detail-header">
          <Link
            href="/admin/users"
            className="admin-back-link"
          >
            <span aria-hidden="true">‹</span>
            กลับไปผู้ใช้
          </Link>

          <div className="admin-user-detail-heading">
            <span className="admin-user-detail-label">
              GONNATALES ADMIN · USER
            </span>

            <h1>รายละเอียดผู้ใช้</h1>

            <p>
              ข้อมูลบัญชี นิยาย และ Game Sessions ของผู้ใช้
            </p>
          </div>
        </header>

        {/* User Profile */}
        <section className="admin-user-profile-card">
          <div className="admin-user-profile-main">
            <div className="admin-user-profile-avatar">
              {getInitial(user.displayName)}
            </div>

            <div className="admin-user-profile-info">
              <h2>{user.displayName}</h2>

              <div className="admin-user-profile-id">
                {user.userId}
              </div>
            </div>
          </div>

          <div className="admin-user-profile-details">
            <div className="admin-user-profile-detail">
              <span>สมัครเมื่อ</span>

              <strong>
                {formatDate(user.createdAt)}
              </strong>
            </div>

            <div className="admin-user-profile-detail">
              <span>อัปเดตล่าสุด</span>

              <strong>
                {formatDate(user.updatedAt)}
              </strong>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="admin-user-stats">
          <div className="admin-user-stat-card">
            <span className="admin-user-stat-label">
              นิยายทั้งหมด
            </span>

            <strong className="admin-user-stat-value">
              {stats.storyCount}
            </strong>

            <span className="admin-user-stat-description">
              เผยแพร่ {stats.publishedStoryCount} ·
              ส่วนตัว {stats.privateStoryCount}
            </span>
          </div>

          <div className="admin-user-stat-card">
            <span className="admin-user-stat-label">
              Game Sessions
            </span>

            <strong className="admin-user-stat-value">
              {stats.sessionCount}
            </strong>

            <span className="admin-user-stat-description">
              Public {stats.publicSessionCount} ·
              Private {stats.privateSessionCount}
            </span>
          </div>
        </section>

        {/* Stories */}
        <section className="admin-detail-card">
          <div className="admin-section-header">
            <div>
              <h2>นิยายของผู้ใช้</h2>

              <p>
                นิยายทั้งหมดที่สร้างโดยผู้ใช้นี้
              </p>
            </div>

            <span className="admin-section-count">
              {stories.length} เรื่อง
            </span>
          </div>

          {stories.length === 0 ? (
            <div className="admin-user-detail-empty">
              ผู้ใช้ยังไม่มีนิยาย
            </div>
          ) : (
            <div className="admin-user-story-list">
              {stories.map((story) => (
                <article
                  key={story.id}
                  className="admin-user-story-item"
                >
                  <div className="admin-user-story-content">
                    <div className="admin-user-story-header">
                      <h3>{story.title}</h3>

                      <span
                        className={
                          story.is_published
                            ? 'admin-status admin-status-published'
                            : 'admin-status admin-status-private'
                        }
                      >
                        {story.is_published
                          ? 'เผยแพร่แล้ว'
                          : 'ส่วนตัว'}
                      </span>
                    </div>

                    <div className="admin-user-story-meta">
                      {story.genre && (
                        <span>{story.genre}</span>
                      )}

                      {story.tone && (
                        <span>{story.tone}</span>
                      )}

                      <span>
                        {story.total_chapters} บท
                      </span>
                    </div>

                    {story.synopsis && (
                      <p className="admin-user-story-synopsis">
                        {story.synopsis}
                      </p>
                    )}

                    <div className="admin-user-story-date">
                      สร้างเมื่อ{' '}
                      {formatDate(story.created_at)}
                    </div>
                  </div>

                  <div className="admin-user-story-action">
                    <Link
                      href={`/admin/stories/${story.id}`}
                      className="admin-view-button"
                    >
                      ดูรายละเอียด
                      <span aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Sessions */}
        <section className="admin-detail-card">
          <div className="admin-section-header">
            <div>
              <h2>Game Sessions</h2>

              <p>
                เส้นเรื่องและความคืบหน้าของผู้ใช้
              </p>
            </div>

            <span className="admin-section-count">
              {sessions.length} Sessions
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="admin-user-detail-empty">
              ผู้ใช้ยังไม่มี Game Session
            </div>
          ) : (
            <div className="admin-user-session-list">
              {sessions.map((session, index) => (
                <article
                  key={session.id}
                  className="admin-user-session-item"
                >
                  <div className="admin-user-session-number">
                    {index + 1}
                  </div>

                  <div className="admin-user-session-content">
                    <div className="admin-user-session-header">
                      <div className="admin-user-session-title">
                        <h3>
                          {session.storyTitle}
                        </h3>

                        <span
                          className={
                            session.isPublic
                              ? 'admin-status admin-status-published'
                              : 'admin-status admin-status-private'
                          }
                        >
                          {session.isPublic
                            ? 'Public'
                            : 'Private'}
                        </span>
                      </div>

                      <div className="admin-user-session-id">
                        Session ID: {session.id}
                      </div>
                    </div>

                    <div className="admin-user-session-meta">
                      {session.storyGenre && (
                        <span>
                          {session.storyGenre}
                        </span>
                      )}

                      <span>
                        บทปัจจุบัน{' '}
                        {session.currentChapter}
                      </span>

                      <span>
                        อัปเดต{' '}
                        {formatDate(session.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-user-session-action">
                    <Link
                      href={`/admin/stories/${session.storyId}/sessions/${session.id}`}
                      className="admin-view-button"
                    >
                      ดูเส้นเรื่อง
                      <span aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}