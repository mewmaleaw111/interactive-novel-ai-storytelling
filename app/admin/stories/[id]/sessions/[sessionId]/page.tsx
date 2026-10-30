import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

import { isAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

type AdminSessionDetailPageProps = {
  params: Promise<{
    id: string;
    sessionId: string;
  }>;
};

type Story = {
  id: string;
  title: string;
  genre: string | null;
  tone: string | null;
  total_chapters: number;
  is_published: boolean;
  user_id: string | null;
};

type GameSession = {
  id: string;
  story_id: string;
  user_id: string | null;
  current_chapter: number;
  status: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type SharedChapter = {
  id: string;
  chapter_number: number;
  title: string | null;
  content: string;
  created_at: string;
};

type SessionChapter = {
  id: string;
  session_id: string;
  chapter_number: number;
  title: string | null;
  content: string;
  user_choice: string | null;
  created_at: string;
};

type Profile = {
  user_id: string;
  display_name: string | null;
};

type DisplayChapter = {
  id: string;
  chapter_number: number;
  title: string | null;
  content: string;
  user_choice: string | null;
  created_at: string;
  source: 'shared' | 'session';
};

export default async function AdminSessionDetailPage({
  params,
}: AdminSessionDetailPageProps) {
  const admin = await isAdmin();

  if (!admin) {
    redirect('/');
  }

  const {
    id: storyId,
    sessionId,
  } = await params;

  const {
    data: story,
    error: storyError,
  } = await supabaseAdmin
    .from('stories')
    .select(`
      id,
      title,
      genre,
      tone,
      total_chapters,
      is_published,
      user_id
    `)
    .eq('id', storyId)
    .single();

  if (storyError || !story) {
    notFound();
  }

  const storyData = story as Story;

  const {
    data: session,
    error: sessionError,
  } = await supabaseAdmin
    .from('game_sessions')
    .select(`
      id,
      story_id,
      user_id,
      current_chapter,
      status,
      is_public,
      created_at,
      updated_at
    `)
    .eq('id', sessionId)
    .eq('story_id', storyId)
    .single();

  if (sessionError || !session) {
    notFound();
  }

  const sessionData =
    session as GameSession;

  let profile: Profile | null = null;

  if (sessionData.user_id) {
    const {
      data: profileData,
      error: profileError,
    } = await supabaseAdmin
      .from('profiles')
      .select(`
        user_id,
        display_name
      `)
      .eq(
        'user_id',
        sessionData.user_id
      )
      .maybeSingle();

    if (profileError) {
      console.error(
        'Admin Session Profile Error:',
        profileError
      );
    }

    profile =
      (profileData as Profile | null) ??
      null;
  }

  const displayName =
    profile?.display_name?.trim() ||
    'ไม่ระบุชื่อ';

  const {
    data: sharedChapters,
    error: sharedChaptersError,
  } = await supabaseAdmin
    .from('chapters')
    .select(`
      id,
      chapter_number,
      title,
      content,
      created_at
    `)
    .eq('story_id', storyId)
    .order('chapter_number', {
      ascending: true,
    });

  const {
    data: sessionChapters,
    error: sessionChaptersError,
  } = await supabaseAdmin
    .from('session_chapters')
    .select(`
      id,
      session_id,
      chapter_number,
      title,
      content,
      user_choice,
      created_at
    `)
    .eq('session_id', sessionId)
    .order('chapter_number', {
      ascending: true,
    });

  const chapterMap =
    new Map<number, DisplayChapter>();

  if (sharedChapters) {
    for (const chapter of sharedChapters) {
      const shared =
        chapter as SharedChapter;

      chapterMap.set(
        shared.chapter_number,
        {
          id: shared.id,
          chapter_number:
            shared.chapter_number,
          title: shared.title,
          content: shared.content,
          user_choice: null,
          created_at:
            shared.created_at,
          source: 'shared',
        }
      );
    }
  }

  if (sessionChapters) {
    for (const chapter of sessionChapters) {
      const sessionChapter =
        chapter as SessionChapter;

      chapterMap.set(
        sessionChapter.chapter_number,
        {
          id: sessionChapter.id,
          chapter_number:
            sessionChapter.chapter_number,
          title: sessionChapter.title,
          content: sessionChapter.content,
          user_choice:
            sessionChapter.user_choice,
          created_at:
            sessionChapter.created_at,
          source: 'session',
        }
      );
    }
  }

  const chapters = Array.from(
    chapterMap.values()
  ).sort(
    (a, b) =>
      a.chapter_number -
      b.chapter_number
  );

  const sessionChapterCount =
    sessionChapters?.length ?? 0;

  const totalDisplayedChapters =
    chapters.length;

  return (
    <main className="admin-page admin-session-detail">
      <div className="admin-container">

        <div className="admin-page-header">

          <Link
            href={`/admin/stories/${storyId}`}
            className="admin-back-link"
          >
            ‹ กลับไปยังนิยาย
          </Link>

          <p className="admin-label">
            GONNATALES ADMIN
          </p>

          <h1>
            เส้นเรื่องของผู้เล่น
          </h1>

          <p className="admin-description">
            {storyData.title}
          </p>

        </div>

        {/* SESSION INFORMATION */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                ข้อมูลเส้นเรื่อง
              </h2>

              <p>
                รายละเอียดของ Session นี้
              </p>
            </div>

            <span
              className={
                sessionData.is_public
                  ? 'admin-status published'
                  : 'admin-status draft'
              }
            >
              {sessionData.is_public
                ? 'Public'
                : 'Private'}
            </span>

          </div>

          <div className="admin-detail-grid">

            <div className="admin-detail-item">
              <span>ผู้เล่น</span>

              <strong>
                {displayName}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>Current Chapter</span>

              <strong>
                บทที่{' '}
                {sessionData.current_chapter}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>สถานะ</span>

              <strong>
                {sessionData.status ||
                  '-'}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>จำนวนบทใน Session</span>

              <strong>
                {sessionChapterCount} บท
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>จำนวนบทที่แสดง</span>

              <strong>
                {totalDisplayedChapters} บท
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>Session ID</span>

              <strong className="admin-detail-mono">
                {sessionData.id}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>User ID</span>

              <strong className="admin-detail-mono">
                {sessionData.user_id ||
                  '-'}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>Story ID</span>

              <strong className="admin-detail-mono">
                {storyData.id}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>เริ่มเล่น</span>

              <strong>
                {formatDate(
                  sessionData.created_at
                )}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>เล่นล่าสุด</span>

              <strong>
                {formatDate(
                  sessionData.updated_at
                )}
              </strong>
            </div>

          </div>

        </section>

        {/* STORY INFORMATION */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                ข้อมูลนิยาย
              </h2>

              <p>
                นิยายที่ Session นี้กำลังเล่น
              </p>
            </div>

            <span
              className={
                storyData.is_published
                  ? 'admin-status published'
                  : 'admin-status draft'
              }
            >
              {storyData.is_published
                ? 'เผยแพร่'
                : 'ส่วนตัว'}
            </span>

          </div>

          <div className="admin-detail-grid">

            <div className="admin-detail-item">
              <span>ชื่อเรื่อง</span>

              <strong>
                {storyData.title}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>ประเภท</span>

              <strong>
                {storyData.genre ||
                  '-'}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>โทนเรื่อง</span>

              <strong>
                {storyData.tone ||
                  '-'}
              </strong>
            </div>

            <div className="admin-detail-item">
              <span>จำนวนตอนเป้าหมาย</span>

              <strong>
                {storyData.total_chapters}
              </strong>
            </div>

          </div>

        </section>

        {/* CHAPTERS */}

        <section className="admin-detail-card">

          <div className="admin-detail-header">

            <div className="admin-section-heading">
              <h2>
                เนื้อหาเส้นเรื่อง
              </h2>

              <p>
                บทกลางและบทที่เกิดจากการตัดสินใจของผู้เล่น
              </p>
            </div>

            <span className="admin-status published">
              {totalDisplayedChapters} บท
            </span>

          </div>

          {sharedChaptersError ||
          sessionChaptersError ? (
            <div className="admin-error">

              <h1>
                ไม่สามารถโหลดบทได้
              </h1>

              <p>
                เกิดข้อผิดพลาดในการโหลดข้อมูลบทของเส้นเรื่อง
              </p>

            </div>
          ) : chapters.length > 0 ? (

            <div className="admin-chapter-list">

              {chapters.map(
                (chapter) => (
                  <div
                    key={`${chapter.source}-${chapter.id}`}
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

                      <div className="admin-chapter-source">

                        <span
                          className={
                            chapter.source ===
                            'shared'
                              ? 'admin-status published'
                              : 'admin-status draft'
                          }
                        >
                          {chapter.source ===
                          'shared'
                            ? 'บทกลาง'
                            : 'บทของ Session'}
                        </span>

                      </div>

                      <div className="admin-chapter-preview">
                        {getPreview(
                          chapter.content
                        )}
                      </div>

                      {chapter.user_choice && (
                        <div className="admin-chapter-choice">
                          <span>
                            ตัวเลือกผู้เล่น
                          </span>

                          <strong>
                            {chapter.user_choice}
                          </strong>
                        </div>
                      )}

                      <div className="admin-chapter-date">
                        สร้างเมื่อ{' '}
                        {formatDate(
                          chapter.created_at
                        )}
                      </div>

                    </div>

                    <div className="admin-chapter-word-count">
                      {chapter.content?.length ?? 0}{' '}
                      ตัวอักษร
                    </div>

                  </div>
                )
              )}

            </div>

          ) : (
            <div className="admin-empty">

              <h2>
                ยังไม่มีบท
              </h2>

              <p>
                Session นี้ยังไม่มีข้อมูลบท
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