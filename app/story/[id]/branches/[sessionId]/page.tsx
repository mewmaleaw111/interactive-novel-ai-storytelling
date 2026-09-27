'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import '@/styles/reader.css';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  userPromptChoice?: string;
  createdAt: string;
}

interface Branch {
  sessionId: string;
  userId: string;
  userName?: string;
  currentChapter: number;
  status: string;
  isPublic: boolean;
  isOwner: boolean;
}

interface BranchResponse {
  success: boolean;

  story?: {
    id: string;
    title: string;
    totalChapters: number;
    genre?: string;
    tone?: string;
    synopsis?: string;
    creatorName?: string;
  };

  branch?: Branch;

  chapters?: Chapter[];

  error?: string;
}

export default function BranchReaderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const storyId =
    params.id as string;

  const sessionId =
    params.sessionId as string;

  const from =
    searchParams.get('from');

  /* =========================
     State
  ========================= */

  const [storyTitle, setStoryTitle] =
    useState('');

  const [
    totalChapters,
    setTotalChapters,
  ] = useState(0);

  const [genre, setGenre] =
    useState('');

  const [tone, setTone] =
    useState('');

  const [synopsis, setSynopsis] =
    useState('');

  const [
    creatorName,
    setCreatorName,
  ] = useState('');

  const [
    playerName,
    setPlayerName,
  ] = useState('');

  const [isPublic, setIsPublic] =
    useState(false);

  const [isOwner, setIsOwner] =
    useState(false);

  const [
    updatingVisibility,
    setUpdatingVisibility,
  ] = useState(false);

  const [chapters, setChapters] =
    useState<Chapter[]>([]);

  const [fontSize, setFontSize] =
    useState<
      'sm' | 'md' | 'lg'
    >('md');

  // เปิด Branch มาเริ่มที่บท 1
  const [
    selectedChapter,
    setSelectedChapter,
  ] = useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* =========================
     Back
  ========================= */

  const handleBack = () => {
    router.push(
      `/story/${storyId}/branches${from
        ? `?from=${from}`
        : ''
      }`
    );
  };

  /* =========================
     Toggle Public / Private
  ========================= */

  const handleToggleVisibility =
    async () => {
      if (
        updatingVisibility ||
        !isOwner
      ) {
        return;
      }

      try {
        setUpdatingVisibility(
          true
        );

        const nextValue =
          !isPublic;

        const response =
          await fetch(
            `/api/game-sessions/${sessionId}`,
            {
              method: 'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                is_public:
                  nextValue,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
            'ไม่สามารถเปลี่ยนสถานะเส้นเรื่องได้'
          );
        }

        setIsPublic(
          nextValue
        );
      } catch (err) {
        console.error(
          'Error updating visibility:',
          err
        );

        alert(
          err instanceof Error
            ? err.message
            : 'ไม่สามารถเปลี่ยนสถานะเส้นเรื่องได้'
        );
      } finally {
        setUpdatingVisibility(
          false
        );
      }
    };

  /* =========================
     Load Branch
  ========================= */

  useEffect(() => {
    if (
      !storyId ||
      !sessionId
    ) {
      return;
    }

    async function loadBranch() {
      try {
        setLoading(true);
        setError('');

        const res =
          await fetch(
            `/api/stories/${storyId}/branches/${sessionId}`,
            {
              cache: 'no-store',
            }
          );

        const data: BranchResponse =
          await res.json();

        if (
          !res.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
            'ไม่สามารถโหลดเส้นเรื่องได้'
          );
        }

        /* =========================
           Story
        ========================= */

        setStoryTitle(
          data.story?.title ?? ''
        );

        setTotalChapters(
          data.story
            ?.totalChapters ?? 0
        );

        setGenre(
          data.story?.genre ?? ''
        );

        setTone(
          data.story?.tone ?? ''
        );

        setSynopsis(
          data.story?.synopsis ?? ''
        );

        setCreatorName(
          data.story
            ?.creatorName ??
          'ไม่ระบุชื่อ'
        );

        /* =========================
           Branch
        ========================= */

        setPlayerName(
          data.branch?.userName ??
          'ผู้เล่น'
        );

        setIsPublic(
          data.branch
            ?.isPublic ??
          false
        );

        setIsOwner(
          data.branch
            ?.isOwner ??
          false
        );

        /* =========================
           Chapters
        ========================= */

        const loadedChapters =
          data.chapters ?? [];

        setChapters(
          loadedChapters
        );

        // สำคัญ:
        // คนที่เข้ามาดู Branch
        // จะเริ่มอ่านจากบทที่ 1
        setSelectedChapter(1);

      } catch (err) {
        console.error(
          'Error loading branch:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'เกิดข้อผิดพลาดในการโหลดเส้นเรื่อง'
        );
      } finally {
        setLoading(false);
      }
    }

    loadBranch();
  }, [
    storyId,
    sessionId,
  ]);

  /* =========================
     Current Chapter
  ========================= */

  const currentChapter =
    chapters.find(
      (chapter) =>
        chapter.chapterNumber ===
        selectedChapter
    ) ||
    chapters[
    chapters.length - 1
    ];

  /* =========================
     Scroll
  ========================= */

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =========================
     Font Controls
  ========================= */

  const FontSizeControls = () => (
    <div className="font-size-controls">
      <button
        type="button"
        onClick={() => setFontSize('sm')}
        className={
          fontSize === 'sm'
            ? 'active'
            : ''
        }
        aria-label="ลดขนาดตัวอักษร"
      >
        A-
      </button>

      <button
        type="button"
        onClick={() => setFontSize('md')}
        className={
          fontSize === 'md'
            ? 'active'
            : ''
        }
        aria-label="ขนาดตัวอักษรปกติ"
      >
        A
      </button>

      <button
        type="button"
        onClick={() => setFontSize('lg')}
        className={
          fontSize === 'lg'
            ? 'active'
            : ''
        }
        aria-label="เพิ่มขนาดตัวอักษร"
      >
        A+
      </button>
    </div>
  );

  /* =========================
     Visibility Button
  ========================= */

  const VisibilityButton = () => {
    if (!isOwner) {
      return null;
    }

    return (
      <button
        type="button"
        className={`visibility-toggle ${isPublic
          ? 'is-public'
          : 'is-private'
          } ${updatingVisibility
            ? 'is-updating'
            : ''
          }`}
        onClick={handleToggleVisibility}
        disabled={updatingVisibility}
        aria-label={
          isPublic
            ? 'เปลี่ยนเป็น Private'
            : 'เปลี่ยนเป็น Public'
        }
      >
        <span className="visibility-toggle-track">
          <span className="visibility-toggle-thumb" />
        </span>

        <span className="visibility-toggle-label">
          {updatingVisibility
            ? 'กำลังเปลี่ยน...'
            : isPublic
              ? 'Public'
              : 'Private'}
        </span>
      </button>
    );
  };

  /* =========================
   Loading
========================= */

  if (loading) {
    return (
      <div className="reader-loading">
        <div className="reader-loading-content">

          {/* Header */}
          <header className="reader-header branches-reader-header">
            <div className="branches-header-inner">

              <div className="reader-loading-back" />

              <div className="reader-loading-header-actions">

                <div className="reader-loading-branch" />

                <div className="reader-loading-font">
                  <span />
                  <span />
                  <span />
                </div>

              </div>

            </div>
          </header>

          {/* Reader */}
          <main className="reader-content">

            {/* Story Info */}
            <div className="story-meta-banner">

              <div className="reader-loading-title" />

              <div className="reader-loading-badges">
                <span />
                <span />
              </div>

              <div className="reader-loading-premise">
                <span />
                <span />
              </div>

              <div className="reader-loading-author" />

              <div className="reader-loading-counter" />

              <div className="reader-loading-counter" />

              <div className="reader-loading-counter" />

            </div>

            {/* Chapter */}
            <article className="chapter-block">

              <div className="chapter-heading">

                <div className="reader-loading-chapter-number" />

                <div className="reader-loading-chapter-title" />

              </div>

              <div className="chapter-text font-serif">

                <div className="reader-loading-lines">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />

                  <span />
                  <span />
                  <span />
                  <span />

                  <span />
                  <span />
                  <span />
                </div>

              </div>

            </article>

            {/* Navigation */}
            <div className="chapter-navigation">

              <div className="reader-loading-nav-button" />

              <div className="reader-loading-nav-counter" />

              <div className="reader-loading-nav-button" />

            </div>

          </main>

        </div>
      </div>
    );
  }

  /* =========================
     Error
  ========================= */

  if (error) {
    return (
      <div className="reader-wrapper">

        <header className="reader-header branches-reader-header">

          <div className="branches-header-inner">

            <button
              className="btn-back"
              onClick={handleBack}
            >
              ‹ ย้อนกลับ
            </button>

            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
              }}
            >
              <VisibilityButton />

              <FontSizeControls />
            </div>

          </div>

        </header>

        <main className="reader-empty">

          <div>

            <span>⚠️</span>

            <h2>
              ไม่สามารถโหลดเส้นเรื่องได้
            </h2>

            <p>
              {error}
            </p>

            <button
              className="chapter-nav-button"
              onClick={() =>
                window.location.reload()
              }
              style={{
                marginTop:
                  '1rem',
              }}
            >
              ลองอีกครั้ง
            </button>

          </div>

        </main>

      </div>
    );
  }

  /* =========================
     Empty Branch
  ========================= */

  if (!currentChapter) {
    return (
      <div className="reader-wrapper">

        <header className="reader-header branches-reader-header">

          <div className="branches-header-inner">

            <button
              className="btn-back"
              onClick={handleBack}
            >
              ‹ ย้อนกลับ
            </button>

            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
              }}
            >
              <VisibilityButton />

              <FontSizeControls />
            </div>

          </div>

        </header>

        <main className="reader-content">

          <div className="story-meta-banner">

            <h1 className="story-main-title">
              {storyTitle}
            </h1>

            <div className="story-badges">

              {genre && (
                <span className="badge">
                  {genre}
                </span>
              )}

              {tone && (
                <span className="badge">
                  {tone}
                </span>
              )}

            </div>

            {synopsis && (
              <p className="premise font-serif">
                "{synopsis}"
              </p>
            )}

            <div className="chapter-counter">
              สร้างโดย{' '}
              <strong>
                "{creatorName}"
              </strong>
            </div>

            <div className="chapter-counter">
              เส้นเรื่องของ{' '}
              <strong>
                "{playerName}"
              </strong>
            </div>

          </div>

          <div className="reader-empty">

            <div>

              <span>📖</span>

              <h2>
                ยังไม่มีเนื้อเรื่อง
              </h2>

              <p>
                ไม่พบเนื้อหาในเส้นเรื่องนี้
              </p>

            </div>

          </div>

        </main>

      </div>
    );
  }

  /* =========================
     Main Reader
  ========================= */

  return (
    <div
      className={`reader-wrapper font-size-${fontSize}`}
    >

      {/* =========================
          Header
      ========================= */}

      <header className="reader-header branches-reader-header">

        <div className="branches-header-inner">

          <button
            className="btn-back"
            onClick={handleBack}
          >
            ‹ ย้อนกลับ
          </button>

          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
            }}
          >

            <VisibilityButton />

            <FontSizeControls />

          </div>

        </div>

      </header>

      {/* =========================
          Main Reader
      ========================= */}

      <main className="reader-content">

        {/* =========================
            Story Info
        ========================= */}

        <div className="story-meta-banner">

          <h1 className="story-main-title">
            {storyTitle}
          </h1>

          <div className="story-badges">

            {genre && (
              <span className="badge">
                {genre}
              </span>
            )}

            {tone && (
              <span className="badge">
                {tone}
              </span>
            )}

          </div>

          {synopsis && (
            <p className="premise font-serif">
              "{synopsis}"
            </p>
          )}

          <div className="chapter-counter">
            ผู้เขียน{' '}
            <strong>
              {creatorName}
            </strong>{' '}
            ร่วมกับ AI
          </div>

          <div className="chapter-counter">
            เส้นเรื่องของ{' '}
            <strong>
              "{playerName}"
            </strong>
          </div>

          <div className="chapter-counter">
            บทที่{' '}
            {
              currentChapter.chapterNumber
            }
            {' / '}
            {totalChapters}
          </div>

        </div>

        {/* =========================
            Current Chapter
        ========================= */}

        <article
          className="chapter-block"
          key={currentChapter.id}
        >

          {currentChapter.userPromptChoice && (
            <div className="user-choice-badge">

              🎯 การตัดสินใจของคุณ:{' '}

              <span>
                "
                {
                  currentChapter.userPromptChoice
                }
                "
              </span>

            </div>
          )}

          <div className="chapter-heading">

            <span>
              บทที่{' '}
              {
                currentChapter.chapterNumber
              }
            </span>

            <h1 className="chapter-title">
              {currentChapter.title}
            </h1>

          </div>

          <div className="chapter-text font-serif">

            {currentChapter.content
              .split('\n')
              .map(
                (
                  paragraph,
                  idx
                ) =>
                  paragraph.trim() ? (
                    <p key={idx}>
                      {paragraph}
                    </p>
                  ) : null
              )}

          </div>

        </article>

        {/* =========================
            Navigation
        ========================= */}

        <div className="chapter-navigation">

          <button
            className="chapter-nav-button"
            disabled={
              selectedChapter <= 1
            }
            onClick={() => {

              setSelectedChapter(
                selectedChapter - 1
              );

              scrollToTop();

            }}
          >
            ‹ บทก่อนหน้า
          </button>

          <span>
            {selectedChapter} /{' '}
            {totalChapters}
          </span>

          <button
            className="chapter-nav-button"
            disabled={
              selectedChapter >=
              chapters.length
            }
            onClick={() => {

              setSelectedChapter(
                selectedChapter + 1
              );

              scrollToTop();

            }}
          >
            บทถัดไป ›
          </button>

        </div>

      </main>

    </div>
  );
}