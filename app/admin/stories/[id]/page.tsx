import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

import { isAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import AdminSessionActions from '@/components/admin/AdminSessionActions';

type AdminStoryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type SharedChapter = {
  id: string;
  chapter_number: number;
  title: string | null;
  content: string;
  created_at: string;
};

type GameSession = {
  id: string;
  user_id: string | null;
  current_chapter: number;
  status: string | null;
  is_public: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
};

type Profile = {
  user_id: string;
  display_name: string | null;
};

export default async function AdminStoryDetailPage({
  params,
}: AdminStoryDetailPageProps) {
  const admin = await isAdmin();

  if (!admin) {
    redirect('/');
  }

  const { id } = await params;

  // ==================================================
  // 1. โหลด Story
  // ==================================================

  const {
    data: story,
    error: storyError,
  } = await supabaseAdmin
    .from('stories')
    .select(`
      id,
      title,
      synopsis,
      plot_structure,
      genre,
      tone,
      total_chapters,
      cover_image_url,
      is_published,
      is_favorite,
      created_at,
      updated_at,
      user_id
    `)
    .eq('id', id)
    .single();

  if (storyError || !story) {
    notFound();
  }

  // ==================================================
  // 2. โหลด Shared Chapters
  // ==================================================

  const {
    data: chapters,
    error: chaptersError,
  } = await supabaseAdmin
    .from('chapters')
    .select(`
      id,
      chapter_number,
      title,
      content,
      created_at
    `)
    .eq('story_id', id)
    .order('chapter_number', {
      ascending: true,
    });

  // ==================================================
  // 3. โหลด Game Sessions
  // ==================================================

  const {
    data: sessions,
    error: sessionsError,
  } = await supabaseAdmin
    .from('game_sessions')
    .select(`
      id,
      user_id,
      current_chapter,
      status,
      is_public,
      is_banned,
      created_at,
      updated_at
    `)
    .eq('story_id', id)
    .order('updated_at', {
      ascending: false,
    });

  // ==================================================
  // 4. โหลด Profiles ของผู้เล่น
  // ==================================================

  const userIds = Array.from(
    new Set(
      (sessions ?? [])
        .map((session) => session.user_id)
        .filter(
          (userId): userId is string =>
            Boolean(userId)
        )
    )
  );

  let profiles: Profile[] = [];

  if (userIds.length > 0) {
    const {
      data: profileData,
      error: profilesError,
    } = await supabaseAdmin
      .from('profiles')
      .select(`
        user_id,
        display_name
      `)
      .in('user_id', userIds);

    if (profilesError) {
      console.error(
        'Admin Profiles Error:',
        profilesError
      );
    }

    profiles =
      (profileData as Profile[]) ?? [];
  }

  // ==================================================
  // 5. สรุปข้อมูล Session
  // ==================================================

  const sessionList =
    (sessions as GameSession[]) ?? [];

  const sessionCount =
    sessionList.length;

  const publicSessionCount =
    sessionList.filter(
      (session) => session.is_public
    ).length;

  const privateSessionCount =
    sessionList.filter(
      (session) => !session.is_public
    ).length;

  return (
    <main className="admin-page admin-story-detail">
      <div className="admin-container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="admin-page-header">

          <Link
            href="/admin/stories"
            className="admin-back-link"
          >
            ‹ กลับไปจัดการนิยาย
          </Link>

          <p className="admin-label">
            GONNATALES ADMIN
          </p>

          <h1>{story.title}</h1>

          <p className="admin-description">
            รายละเอียดและข้อมูลของนิยายเรื่องนี้
          </p>

        </div>

        {/* ==================================================
            STORY INFORMATION
        ================================================== */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                ข้อมูลนิยาย
              </h2>

              <p>
                รายละเอียดพื้นฐานของนิยาย
              </p>
            </div>

            <span
              className={
                story.is_published
                  ? 'admin-status published'
                  : 'admin-status draft'
              }
            >
              {story.is_published
                ? 'เผยแพร่'
                : 'ส่วนตัว'}
            </span>

          </div>

          <div className="admin-detail-grid">

            <div className="admin-detail-item">
              <span>ชื่อเรื่อง</span>

              <strong>
                {story.title}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>ประเภท</span>

              <strong>
                {story.genre || '-'}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>โทนเรื่อง</span>

              <strong>
                {story.tone || '-'}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>จำนวนตอน</span>

              <strong>
                {story.total_chapters}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>เจ้าของนิยาย</span>

              <strong className="admin-detail-mono">
                {story.user_id || '-'}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>จำนวนการเล่น</span>

              <strong>
                {sessionCount}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>วันที่สร้าง</span>

              <strong>
                {formatDate(
                  story.created_at
                )}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>แก้ไขล่าสุด</span>

              <strong>
                {formatDate(
                  story.updated_at
                )}
              </strong>
            </div>

          </div>

        </section>

        {/* ==================================================
            STORY SUMMARY
        ================================================== */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                สรุปเส้นเรื่อง
              </h2>

              <p>
                ภาพรวมของการเล่นนิยายเรื่องนี้
              </p>
            </div>

          </div>

          <div className="admin-detail-grid">

            <div className="admin-detail-item">
              <span>
                บทกลาง
              </span>

              <strong>
                {chapters?.length ?? 0} บท
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>
                เส้นเรื่องทั้งหมด
              </span>

              <strong>
                {sessionCount} เส้น
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>
                เส้นเรื่อง Public
              </span>

              <strong>
                {publicSessionCount} เส้น
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>
                เส้นเรื่อง Private
              </span>

              <strong>
                {privateSessionCount} เส้น
              </strong>
            </div>

          </div>

        </section>

        {/* ==================================================
            SYNOPSIS
        ================================================== */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                เรื่องย่อ
              </h2>

              <p>
                คำอธิบายของเรื่อง
              </p>
            </div>

          </div>

          <div className="admin-detail-text">
            {story.synopsis ||
              'ไม่มีเรื่องย่อ'}
          </div>

        </section>

        {/* ==================================================
            PLOT STRUCTURE
        ================================================== */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                โครงเรื่อง
              </h2>

              <p>
                โครงสร้างเนื้อหาที่ใช้ในการสร้างนิยาย
              </p>
            </div>

          </div>

          <div className="admin-detail-text admin-detail-pre">
            {story.plot_structure ||
              'ไม่มีข้อมูลโครงเรื่อง'}
          </div>

        </section>

        {/* ==================================================
            SHARED CHAPTERS
        ================================================== */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                บทกลางของเรื่อง
              </h2>

              <p>
                บทที่ใช้ร่วมกันก่อนเข้าสู่เส้นเรื่องของผู้เล่น
              </p>
            </div>

            <span className="admin-status published">
              {chapters?.length ?? 0} บท
            </span>

          </div>

          {chaptersError ? (
            <div className="admin-error">

              <h1>
                ไม่สามารถโหลดบทได้
              </h1>

              <p>
                เกิดข้อผิดพลาดในการโหลดข้อมูลบทของนิยาย
              </p>

            </div>
          ) : chapters &&
            chapters.length > 0 ? (
            <div className="admin-chapter-list">

              {chapters.map(
                (chapter: SharedChapter) => (
                  <div
                    key={chapter.id}
                    className="admin-chapter-item"
                  >

                    <div className="admin-chapter-number">
                      {chapter.chapter_number}
                    </div>

                    <div className="admin-chapter-content">

                      <div className="admin-chapter-title">
                        {chapter.title ||
                          `บทที่ ${chapter.chapter_number}`}
                      </div>

                      <div className="admin-chapter-preview">
                        {getPreview(
                          chapter.content
                        )}
                      </div>

                      <div className="admin-chapter-date">
                        สร้างเมื่อ{' '}
                        {formatDate(
                          chapter.created_at
                        )}
                      </div>

                    </div>

                    <div className="admin-chapter-word-count">
                      {chapter.content?.length ??
                        0}{' '}
                      ตัวอักษร
                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="admin-empty">

              <h2>
                ยังไม่มีบทกลาง
              </h2>

              <p>
                นิยายเรื่องนี้ยังไม่มีข้อมูลบทกลางในระบบ
              </p>

            </div>
          )}

        </section>

        {/* ==================================================
            PLAYER SESSIONS / BRANCHES
        ================================================== */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                เส้นเรื่องของผู้เล่น
              </h2>

              <p>
                แต่ละเส้นเรื่องเป็น Progress แยกของผู้เล่นแต่ละคน
              </p>
            </div>

            <span className="admin-status draft">
              {sessionCount} Session
            </span>

          </div>

          {sessionsError ? (
            <div className="admin-error">

              <h1>
                ไม่สามารถโหลด Session ได้
              </h1>

              <p>
                เกิดข้อผิดพลาดในการโหลดข้อมูลเส้นเรื่องของผู้เล่น
              </p>

            </div>
          ) : sessionList.length > 0 ? (

            <div className="admin-session-list">

              {sessionList.map(
                (session, index) => {

                  const profile =
                    profiles.find(
                      (item) =>
                        item.user_id ===
                        session.user_id
                    );

                  const displayName =
                    profile?.display_name?.trim() ||
                    'ไม่ระบุชื่อ';

                  return (
                    <div
                      key={session.id}
                      className={`admin-session-item ${
                        session.is_banned
                          ? 'admin-session-banned'
                          : ''
                      }`}
                    >

                      <div className="admin-session-number">
                        {index + 1}
                      </div>

                      <div className="admin-session-content">

                        <div className="admin-session-header">

                          <div>
                            <h3>
                              เส้นเรื่องที่{' '}
                              {index + 1}
                            </h3>

                            <p>
                              ผู้เล่น:{' '}
                              {displayName}
                            </p>
                          </div>

                          <div className="admin-session-statuses">

                            {session.is_banned && (
                              <span className="admin-status banned">
                                ถูกแบน
                              </span>
                            )}

                            <span
                              className={
                                session.is_public
                                  ? 'admin-status published'
                                  : 'admin-status draft'
                              }
                            >
                              {session.is_public
                                ? 'Public'
                                : 'Private'}
                            </span>

                          </div>

                        </div>

                        <div className="admin-session-meta">

                          <div>
                            <span>
                              Current Chapter
                            </span>

                            <strong>
                              บทที่{' '}
                              {session.current_chapter}
                            </strong>
                          </div>

                          <div>
                            <span>
                              สถานะ
                            </span>

                            <strong>
                              {session.status ||
                                '-'}
                            </strong>
                          </div>

                          <div>
                            <span>
                              เริ่มเล่น
                            </span>

                            <strong>
                              {formatDate(
                                session.created_at
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              เล่นล่าสุด
                            </span>

                            <strong>
                              {formatDate(
                                session.updated_at
                              )}
                            </strong>
                          </div>

                        </div>

                        <div className="admin-session-footer">

                          <span className="admin-session-id">
                            Session ID:{' '}
                            {session.id}
                          </span>

                          <div className="admin-session-footer-actions">

                            <AdminSessionActions
                              key={session.id}
                              storyId={story.id}
                              sessionId={session.id}
                              isBanned={session.is_banned}
                            />

                            <Link
                              href={`/admin/stories/${story.id}/sessions/${session.id}`}
                              className="admin-session-view-button"
                            >
                              ดูเส้นเรื่อง
                              <span aria-hidden="true">
                                →
                              </span>
                            </Link>

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          ) : (
            <div className="admin-empty">

              <h2>
                ยังไม่มีการเล่น
              </h2>

              <p>
                ยังไม่มีผู้เล่นสร้างเส้นเรื่องของตัวเอง
              </p>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

function formatDate(
  date: string | null
) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'th-TH',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  ).format(new Date(date));
}

function getPreview(
  content: string
) {
  if (!content) {
    return 'ไม่มีเนื้อหา';
  }

  const clean = content
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length > 150) {
    return `${clean.slice(
      0,
      150
    )}...`;
  }

  return clean;
}