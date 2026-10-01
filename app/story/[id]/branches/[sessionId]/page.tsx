'use client';

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import '@/styles/reader.css';
import '@/styles/story-reader.css';

/* =========================================================
   TYPES
========================================================= */

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

interface Character {
  id: string;
  name: string;
  gender?: string;
  role: 'player' | 'npc' | string;
  appearance?: string;
  personality?: string;
  initial_items?: string[];
}

interface CurrentStatus {
  location: string;
  physicalCondition: string;
  inventory: string[];
  importantSituation: string;
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
    coverImageUrl?: string | null;
  };
  branch?: Branch;
  currentStatus?: CurrentStatus;
  characters?: Character[];
  chapters?: Chapter[];
  error?: string;
}

/* =========================================================
   SVG ICONS
========================================================= */

const Icon = ({
  children,
  size = 20,
}: {
  children: React.ReactNode;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const BranchIcon = () => (
  <Icon>
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 6h5a5 5 0 0 1 5 5v1" />
    <path d="M8 6h5a5 5 0 0 0 5-5" />
    <path d="M8 6h2a8 8 0 0 1 8 8v2" />
  </Icon>
);

const LocationIcon = () => (
  <Icon>
    <path d="M12 21s7-6.2 7-11A7 7 0 0 0 5 10c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

const CharactersIcon = () => (
  <Icon>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5" />
    <path d="M16 5.5a3 3 0 0 1 0 5.8" />
    <path d="M17 15c2.1.3 3.4 1.9 3.8 4" />
  </Icon>
);

const PathIcon = () => (
  <Icon>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 18c4 0 4-4 4-6s0-6 4-6" />
  </Icon>
);

const ChoiceIcon = () => (
  <Icon size={24}>
    <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    <path d="M8 10h8" />
    <path d="M8 13h5" />
  </Icon>
);

/* =========================================================
   STORY CONTENT
========================================================= */

type StoryParagraphType =
  | 'narration'
  | 'dialogue'
  | 'thought'
  | 'action'
  | 'important';

interface StoryParagraph {
  type: StoryParagraphType;
  text: string;
}

const parseStoryContent = (
  content: string
): StoryParagraph[] => {
  if (!content?.trim()) {
    return [];
  }

  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((rawText): StoryParagraph => {
      const text = rawText.trim();

      /* [dialogue] */
      if (/^\[dialogue\]\s*/i.test(text)) {
        return {
          type: 'dialogue',
          text: text
            .replace(/^\[dialogue\]\s*/i, '')
            .trim(),
        };
      }

      /* [thought] */
      if (/^\[thought\]\s*/i.test(text)) {
        return {
          type: 'thought',
          text: text
            .replace(/^\[thought\]\s*/i, '')
            .trim(),
        };
      }

      /* [action] */
      if (/^\[action\]\s*/i.test(text)) {
        return {
          type: 'action',
          text: text
            .replace(/^\[action\]\s*/i, '')
            .trim(),
        };
      }

      /* [important] */
      if (/^\[important\]\s*/i.test(text)) {
        return {
          type: 'important',
          text: text
            .replace(/^\[important\]\s*/i, '')
            .trim(),
        };
      }

      /* รองรับ marker ภาษาไทยจาก content เก่า */
      if (/^เหตุการณ์สำคัญ\s*[:：]\s*/i.test(text)) {
        return {
          type: 'important',
          text: text
            .replace(
              /^เหตุการณ์สำคัญ\s*[:：]\s*/i,
              ''
            )
            .trim(),
        };
      }

      if (/^การกระทำ\s*[:：]\s*/i.test(text)) {
        return {
          type: 'action',
          text: text
            .replace(
              /^การกระทำ\s*[:：]\s*/i,
              ''
            )
            .trim(),
        };
      }

      if (/^ความคิด\s*[:：]\s*/i.test(text)) {
        return {
          type: 'thought',
          text: text
            .replace(
              /^ความคิด\s*[:：]\s*/i,
              ''
            )
            .trim(),
        };
      }

      /* รองรับความคิดแบบ *ข้อความ* */
      if (
        text.startsWith('*') &&
        text.endsWith('*') &&
        text.length > 2
      ) {
        return {
          type: 'thought',
          text: text.slice(1, -1).trim(),
        };
      }

      /* รองรับความคิดแบบ (ข้อความ) */
      if (
        text.startsWith('(') &&
        text.endsWith(')') &&
        text.length > 2
      ) {
        return {
          type: 'thought',
          text: text.slice(1, -1).trim(),
        };
      }

      /* รองรับบทพูดที่ไม่มี marker */
      const isDialogue =
        /^["“「『].*["”」』]$/.test(text);

      if (isDialogue) {
        return {
          type: 'dialogue',
          text,
        };
      }

      /* ปกติ = narration */
      return {
        type: 'narration',
        text,
      };
    });
};

/* =========================================================
   PAGE
========================================================= */

export default function BranchReaderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const storyId = params.id as string;
  const sessionId = params.sessionId as string;
  const from = searchParams.get('from');

  /* =========================================================
     STATE
  ========================================================= */

  const [storyTitle, setStoryTitle] = useState('');
  const [totalChapters, setTotalChapters] = useState(0);
  const [genre, setGenre] = useState('');
  const [tone, setTone] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [coverImageUrl, setCoverImageUrl] =
    useState<string | null>(null);

  const [playerName, setPlayerName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] =
    useState(false);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] =
    useState<Character[]>([]);

  const [currentStatus, setCurrentStatus] =
    useState<CurrentStatus>({
      location: '',
      physicalCondition: '',
      inventory: [],
      importantSituation: '',
    });

  const [fontSize, setFontSize] =
    useState<'sm' | 'md' | 'lg'>('md');

  const [selectedChapter, setSelectedChapter] =
    useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* =========================================================
     BACK
  ========================================================= */

  const handleBack = () => {
    router.push(
      `/story/${storyId}/branches${
        from ? `?from=${from}` : ''
      }`
    );
  };

  /* =========================================================
     TOGGLE PUBLIC / PRIVATE
  ========================================================= */

  const handleToggleVisibility = async () => {
    if (
      updatingVisibility ||
      !isOwner
    ) {
      return;
    }

    try {
      setUpdatingVisibility(true);

      const nextValue = !isPublic;

      const response = await fetch(
        `/api/game-sessions/${sessionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_public: nextValue,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'ไม่สามารถเปลี่ยนสถานะเส้นเรื่องได้'
        );
      }

      setIsPublic(nextValue);
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
      setUpdatingVisibility(false);
    }
  };

  /* =========================================================
     LOAD BRANCH
  ========================================================= */

  useEffect(() => {
    if (!storyId || !sessionId) {
      return;
    }

    async function loadBranch() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(
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

        /* Story */
        setStoryTitle(
          data.story?.title ?? ''
        );

        setTotalChapters(
          data.story?.totalChapters ?? 0
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
          data.story?.creatorName ??
            'ไม่ระบุชื่อ'
        );

        setCoverImageUrl(
          data.story?.coverImageUrl ?? null
        );

        /* Branch */
        setPlayerName(
          data.branch?.userName ??
            'ผู้เล่น'
        );

        setIsPublic(
          data.branch?.isPublic ?? false
        );

        setIsOwner(
          data.branch?.isOwner ?? false
        );

        /* Current Status */
        setCurrentStatus(
          data.currentStatus ?? {
            location: '',
            physicalCondition: '',
            inventory: [],
            importantSituation: '',
          }
        );

        /* Characters */
        setCharacters(
          data.characters ?? []
        );

        /* Chapters */
        const loadedChapters =
          data.chapters ?? [];

        setChapters(
          loadedChapters
        );

        setSelectedChapter(
          loadedChapters[0]?.chapterNumber ?? 1
        );
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

  /* =========================================================
     CURRENT CHAPTER
  ========================================================= */

  const currentChapter =
    chapters.find(
      (chapter) =>
        chapter.chapterNumber ===
        selectedChapter
    ) ||
    chapters[chapters.length - 1];

  /* =========================================================
     PROGRESS
  ========================================================= */

  const progressPercent = useMemo(() => {
    if (!totalChapters) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (selectedChapter /
          totalChapters) *
          100
      )
    );
  }, [
    selectedChapter,
    totalChapters,
  ]);

  /* =========================================================
     PARAGRAPHS
  ========================================================= */

  const storyParagraphs = useMemo(() => {
    if (!currentChapter) {
      return [];
    }

    return parseStoryContent(
      currentChapter.content
    );
  }, [currentChapter]);

  /* =========================================================
     GENRE CLASS
  ========================================================= */

  const genreClassMap: Record<
    string,
    string
  > = {
    'แฟนตาซี': 'genre-fantasy',
    'โรแมนติก': 'genre-romance',
    'สืบสวนสอบสวน': 'genre-mystery',
    'สืบสวน': 'genre-mystery',
    'ไซไฟ': 'genre-sci-fi',
    'ประวัติศาสตร์': 'genre-history',
    'สยองขวัญ': 'genre-horror',
    'ดราม่า': 'genre-drama',
    'แอ็กชัน': 'genre-action',
    'แอคชัน': 'genre-action',
    'ผจญภัย': 'genre-adventure',
  };

  const genreClass =
    genreClassMap[
      genre.trim()
    ] || 'genre-default';

  /*
   * ใส่ genre class ไว้ที่ root ด้วย
   * เพื่อให้ background ของ genre
   * ครอบคลุมทั้ง viewport ของ Branch Reader
   */

  const pageClassName = [
    'story-reader-page',
    'branches-reader-page',
    genreClass,
    `font-size-${fontSize}`,
  ].join(' ');

  /* =========================================================
     SCROLL
  ========================================================= */

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =========================================================
     CHAPTER NAVIGATION
  ========================================================= */

  const handlePreviousChapter = () => {
    if (selectedChapter <= 1) {
      return;
    }

    setSelectedChapter(
      selectedChapter - 1
    );

    scrollToTop();
  };

  const handleNextChapter = () => {
    if (
      selectedChapter >=
      chapters.length
    ) {
      return;
    }

    setSelectedChapter(
      selectedChapter + 1
    );

    scrollToTop();
  };

  /* =========================================================
     VISIBILITY BUTTON
  ========================================================= */

  const VisibilityButton = () => {
    if (!isOwner) {
      return null;
    }

    return (
      <button
        type="button"
        className={`visibility-toggle ${
          isPublic
            ? 'is-public'
            : 'is-private'
        } ${
          updatingVisibility
            ? 'is-updating'
            : ''
        }`}
        onClick={
          handleToggleVisibility
        }
        disabled={
          updatingVisibility
        }
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

  /* =========================================================
     FONT CONTROLS
  ========================================================= */

  const FontControls = () => (
    <div className="story-reader-font-controls">
      <button
        type="button"
        onClick={() =>
          setFontSize('sm')
        }
        className={
          fontSize === 'sm'
            ? 'active'
            : ''
        }
        aria-label="ตัวอักษรเล็ก"
      >
        A-
      </button>

      <button
        type="button"
        onClick={() =>
          setFontSize('md')
        }
        className={
          fontSize === 'md'
            ? 'active'
            : ''
        }
        aria-label="ตัวอักษรปกติ"
      >
        A
      </button>

      <button
        type="button"
        onClick={() =>
          setFontSize('lg')
        }
        className={
          fontSize === 'lg'
            ? 'active'
            : ''
        }
        aria-label="ตัวอักษรใหญ่"
      >
        A+
      </button>
    </div>
  );

  /* =========================================================
     READER INNER HEADER
  ========================================================= */

  const ReaderInnerHeader = () => (
    <div className="story-reader-inner-header">
      <button
        className="story-reader-back"
        onClick={handleBack}
        type="button"
      >
        ‹ กลับสู่เส้นเรื่อง
      </button>

      <div className="story-reader-top-actions">
        <VisibilityButton />
        <FontControls />
      </div>
    </div>
  );

  /* =========================================================
     CHAPTER NAVIGATION UI
  ========================================================= */

  const ChapterNavigation = () => (
    <div className="story-reader-navigation">
      <button
        type="button"
        className="story-reader-nav-button"
        disabled={
          selectedChapter <= 1
        }
        onClick={
          handlePreviousChapter
        }
      >
        ‹ บทก่อนหน้า
      </button>

      <span>
        {selectedChapter}
        {' / '}
        {chapters.length}
      </span>

      <button
        type="button"
        className="story-reader-nav-button"
        disabled={
          selectedChapter >=
          chapters.length
        }
        onClick={
          handleNextChapter
        }
      >
        บทถัดไป ›
      </button>
    </div>
  );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className={pageClassName}>
        <main className="story-reader-layout">
          <section className="story-reader-main">
            <article className="story-reader-article">
              <ReaderInnerHeader />

              <div className="story-reader-chapter-header">
                <div className="story-reader-chapter-top">
                  <div className="reader-loading-chapter-number" />

                  <div className="story-reader-progress">
                    <div className="story-reader-progress-track">
                      <div className="reader-loading-progress" />
                    </div>

                    <span className="reader-loading-progress-text" />
                  </div>
                </div>

                <div className="reader-loading-chapter-title" />

                <div className="story-reader-chapter-divider" />
              </div>

              <div className="story-reader-text font-serif">
                <div className="reader-loading-story">
                  {Array.from(
                    { length: 15 },
                    (_, index) => (
                      <span key={index} />
                    )
                  )}
                </div>
              </div>

              {/* Navigation อยู่ใน article เดียวกัน */}
              <div className="story-reader-navigation">
                <div className="reader-loading-nav-button" />
                <div className="reader-loading-nav-counter" />
                <div className="reader-loading-nav-button" />
              </div>
            </article>
          </section>

          <aside className="story-reader-sidebar">
            {/* Story info */}
            <section className="story-sidebar-card story-sidebar-story">
              <div className="reader-loading-cover" />

              <div className="story-sidebar-story-info">
                <div className="reader-loading-story-title" />

                <div className="reader-loading-story-tags">
                  <span />
                  <span />
                </div>

                <div className="reader-loading-synopsis">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="reader-loading-author" />
              </div>
            </section>

            {/* Branch info */}
            <section className="story-sidebar-card">
              <div className="reader-loading-section-title" />

              {Array.from(
                { length: 3 },
                (_, index) => (
                  <div
                    className="reader-loading-status-item"
                    key={index}
                  >
                    <span />

                    <div>
                      <small />
                      <strong />
                    </div>
                  </div>
                )
              )}
            </section>

            {/* Current status */}
            <section className="story-sidebar-card">
              <div className="reader-loading-section-title" />

              {Array.from(
                { length: 3 },
                (_, index) => (
                  <div
                    className="reader-loading-status-item"
                    key={index}
                  >
                    <span />

                    <div>
                      <small />
                      <strong />
                    </div>
                  </div>
                )
              )}
            </section>

            {/* Characters */}
            <section className="story-sidebar-card">
              <div className="reader-loading-section-title" />

              {Array.from(
                { length: 3 },
                (_, index) => (
                  <div
                    className="reader-loading-character"
                    key={index}
                  >
                    <span />

                    <div>
                      <strong />
                      <small />
                    </div>
                  </div>
                )
              )}
            </section>

            {/* Story path */}
            <section className="story-sidebar-card">
              <div className="reader-loading-section-title" />

              <div className="reader-loading-path">
                {Array.from(
                  { length: 5 },
                  (_, index) => (
                    <span key={index} />
                  )
                )}
              </div>
            </section>
          </aside>
        </main>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className={pageClassName}>
        <main className="story-reader-layout">
          <section className="story-reader-main">
            <article className="story-reader-article">
              <ReaderInnerHeader />

              <div className="story-reader-empty">
                <div>
                  <div className="story-reader-empty-icon">
                    <Icon size={42}>
                      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" />
                      <path d="M5 6h11" />
                      <path d="M9 10h6" />
                      <path d="M9 13h6" />
                    </Icon>
                  </div>

                  <h2>
                    ไม่สามารถโหลดเส้นเรื่องได้
                  </h2>

                  <p>{error}</p>

                  <button
                    type="button"
                    className="story-reader-submit"
                    onClick={() =>
                      window.location.reload()
                    }
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              </div>
            </article>
          </section>
        </main>
      </div>
    );
  }

  /* =========================================================
     EMPTY BRANCH
  ========================================================= */

  if (!currentChapter) {
    return (
      <div className={pageClassName}>
        <main className="story-reader-layout">
          <section className="story-reader-main">
            <article
              className={`story-reader-article ${genreClass}`}
            >
              <ReaderInnerHeader />

              <div className="story-reader-chapter-header">
                <div className="story-reader-chapter-top">
                  <div className="story-reader-chapter-count">
                    เส้นเรื่อง
                  </div>
                </div>

                <h1 className="story-reader-chapter-title">
                  {storyTitle}
                </h1>

                <div className="story-reader-chapter-divider" />
              </div>

              <div className="story-reader-empty">
                <div>
                  <div className="story-reader-empty-icon">
                    <Icon size={42}>
                      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" />
                      <path d="M5 6h11" />
                      <path d="M9 10h6" />
                      <path d="M9 13h6" />
                    </Icon>
                  </div>

                  <h2>
                    ยังไม่มีเนื้อเรื่อง
                  </h2>

                  <p>
                    ไม่พบเนื้อหาในเส้นเรื่องนี้
                  </p>
                </div>
              </div>
            </article>
          </section>

          <aside className="story-reader-sidebar">
            {/* Story info */}
            <section className="story-sidebar-card story-sidebar-story">
              {coverImageUrl && (
                <div className="story-sidebar-cover">
                  <img
                    src={coverImageUrl}
                    alt={`ปก ${storyTitle}`}
                  />
                </div>
              )}

              <div className="story-sidebar-story-info">
                <h2>
                  {storyTitle}
                </h2>

                <div className="story-sidebar-tags">
                  {genre && (
                    <span>{genre}</span>
                  )}

                  {tone && (
                    <span>{tone}</span>
                  )}
                </div>

                {synopsis && (
                  <p>{synopsis}</p>
                )}

                <div className="story-sidebar-author">
                  ผู้เขียน {creatorName}
                </div>
              </div>
            </section>

            {/* Branch info */}
            <section className="story-sidebar-card">
              <div className="story-sidebar-section-title">
                <span className="sidebar-section-icon">
                  <BranchIcon />
                </span>
                เส้นเรื่อง
              </div>

              <div className="story-sidebar-status-list">
                <div className="story-sidebar-status-item">
                  <span className="status-icon">
                    <CharactersIcon />
                  </span>

                  <div>
                    <small>
                      ผู้เล่น
                    </small>

                    <strong>
                      {playerName}
                    </strong>
                  </div>
                </div>

                <div className="story-sidebar-status-item">
                  <span className="status-icon">
                    <PathIcon />
                  </span>

                  <div>
                    <small>
                      ความคืบหน้า
                    </small>

                    <strong>
                      0 / {totalChapters}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Current status */}
            <section className="story-sidebar-card">
              <div className="story-sidebar-section-title">
                <span className="sidebar-section-icon">
                  <LocationIcon />
                </span>
                สถานะปัจจุบัน
              </div>

              <div className="story-sidebar-status-list">
                {currentStatus.location && (
                  <div className="story-sidebar-status-item">
                    <span className="status-icon">
                      <LocationIcon />
                    </span>

                    <div>
                      <small>
                        สถานที่
                      </small>

                      <strong>
                        {currentStatus.location}
                      </strong>
                    </div>
                  </div>
                )}

                {currentStatus.physicalCondition && (
                  <div className="story-sidebar-status-item">
                    <span className="status-icon">
                      <Icon>
                        <path d="M12 3v18" />
                        <path d="M5 8h14" />
                        <path d="M7 8v5a5 5 0 0 0 10 0V8" />
                      </Icon>
                    </span>

                    <div>
                      <small>
                        สภาพร่างกาย
                      </small>

                      <strong>
                        {
                          currentStatus.physicalCondition
                        }
                      </strong>
                    </div>
                  </div>
                )}

                {currentStatus.importantSituation && (
                  <div className="story-sidebar-status-item">
                    <span className="status-icon">
                      <ChoiceIcon />
                    </span>

                    <div>
                      <small>
                        สถานการณ์สำคัญ
                      </small>

                      <strong>
                        {
                          currentStatus.importantSituation
                        }
                      </strong>
                    </div>
                  </div>
                )}

                {currentStatus.inventory.length > 0 && (
                  <div className="story-sidebar-status-item">
                    <span className="status-icon">
                      <Icon>
                        <rect
                          x="3"
                          y="6"
                          width="18"
                          height="14"
                          rx="2"
                        />
                        <path d="M8 6V4h8v2" />
                        <path d="M3 11h18" />
                      </Icon>
                    </span>

                    <div>
                      <small>
                        สิ่งของ
                      </small>

                      <div className="story-sidebar-inventory-list">
                        {currentStatus.inventory.map(
                          (
                            item,
                            index
                          ) => (
                            <span
                              key={`${item}-${index}`}
                              className="story-sidebar-inventory-item"
                            >
                              {item}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!currentStatus.location &&
                !currentStatus.physicalCondition &&
                !currentStatus.importantSituation &&
                currentStatus.inventory.length === 0 && (
                  <div className="story-sidebar-empty">
                    ยังไม่มีข้อมูลสถานะ
                  </div>
                )}
            </section>

            {/* Characters */}
            <section className="story-sidebar-card">
              <div className="story-sidebar-section-title">
                <span className="sidebar-section-icon">
                  <CharactersIcon />
                </span>

                ตัวละคร

                <small>
                  ({characters.length})
                </small>
              </div>

              {characters.length > 0 ? (
                <div className="story-sidebar-characters">
                  {characters.map(
                    (character) => (
                      <div
                        key={character.id}
                        className="story-sidebar-character"
                      >
                        <span className="story-sidebar-character-icon">
                          <CharactersIcon />
                        </span>

                        <div className="story-sidebar-character-info">
                          <strong>
                            {character.name}
                          </strong>

                          <small>
                            {character.role ===
                            'player'
                              ? 'ผู้เล่น'
                              : 'ตัวละคร'}

                            {character.gender
                              ? ` · ${character.gender}`
                              : ''}
                          </small>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="story-sidebar-empty">
                  ยังไม่มีข้อมูลตัวละคร
                </div>
              )}
            </section>
          </aside>
        </main>
      </div>
    );
  }

  /* =========================================================
     MAIN READER
  ========================================================= */

  return (
    <div className={pageClassName}>
      <main className="story-reader-layout">
        {/* ===================================================
            MAIN STORY
        =================================================== */}

        <section className="story-reader-main">
          <article
            className={`story-reader-article ${genreClass}`}
            key={currentChapter.id}
          >
            {/* =================================================
                TOP CONTROLS
            ================================================= */}

            <ReaderInnerHeader />

            {/* =================================================
                CHAPTER HEADER
            ================================================= */}

            <div className="story-reader-chapter-header">
              <div className="story-reader-chapter-top">
                <div className="story-reader-chapter-count">
                  บทที่{' '}
                  {currentChapter.chapterNumber}
                  {' / '}
                  {totalChapters}
                </div>

                <div className="story-reader-progress">
                  <div className="story-reader-progress-track">
                    <div
                      className="story-reader-progress-value"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>

                  <span>
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <h1 className="story-reader-chapter-title">
                {currentChapter.title}
              </h1>

              <div className="story-reader-chapter-divider" />
            </div>

            {/* =================================================
                USER DECISION
            ================================================= */}

            {currentChapter.userPromptChoice && (
              <div className="story-reader-user-choice">
                <span className="story-reader-user-choice-icon">
                  <Icon size={20}>
                    <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
                  </Icon>
                </span>

                <div>
                  <span className="story-reader-user-choice-label">
                    การตัดสินใจของผู้เล่น
                  </span>

                  <p>
                    “
                    {
                      currentChapter.userPromptChoice
                    }
                    ”
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                STORY CONTENT
            ================================================= */}

            <div className="story-reader-text font-serif">
              {storyParagraphs.map(
                (
                  paragraph,
                  index
                ) => (
                  <div
                    key={`${currentChapter.id}-${index}`}
                    className={`story-reader-content-block story-reader-content-${paragraph.type}`}
                  >
                    <div className="story-reader-content-body">
                      <p>
                        {paragraph.text}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* =================================================
                CHAPTER NAVIGATION

                สำคัญ:
                Navigation อยู่ "ข้างใน article"
                เพื่อให้เป็นก้อนเดียวกับเนื้อหา
            ================================================= */}

            <ChapterNavigation />
          </article>
        </section>

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="story-reader-sidebar">
          {/* Story Info */}
          <section className="story-sidebar-card story-sidebar-story">
            {coverImageUrl && (
              <div className="story-sidebar-cover">
                <img
                  src={coverImageUrl}
                  alt={`ปก ${storyTitle}`}
                />
              </div>
            )}

            <div className="story-sidebar-story-info">
              <h2>
                {storyTitle}
              </h2>

              <div className="story-sidebar-tags">
                {genre && (
                  <span>{genre}</span>
                )}

                {tone && (
                  <span>{tone}</span>
                )}
              </div>

              {synopsis && (
                <p>
                  {synopsis}
                </p>
              )}

              <div className="story-sidebar-author">
                ผู้เขียน {creatorName}
              </div>
            </div>
          </section>

          {/* Branch Info */}
          <section className="story-sidebar-card">
            <div className="story-sidebar-section-title">
              <span className="sidebar-section-icon">
                <BranchIcon />
              </span>

              ข้อมูลเส้นเรื่อง
            </div>

            <div className="story-sidebar-status-list">
              {/* Player */}
              <div className="story-sidebar-status-item">
                <span className="status-icon">
                  <CharactersIcon />
                </span>

                <div>
                  <small>
                    ผู้เล่น
                  </small>

                  <strong>
                    {playerName}
                  </strong>
                </div>
              </div>

              {/* Current Chapter */}
              <div className="story-sidebar-status-item">
                <span className="status-icon">
                  <PathIcon />
                </span>

                <div>
                  <small>
                    บทปัจจุบัน
                  </small>

                  <strong>
                    บทที่{' '}
                    {
                      currentChapter.chapterNumber
                    }
                  </strong>
                </div>
              </div>

              {/* Visibility */}
              <div className="story-sidebar-status-item">
                <span className="status-icon">
                  <LocationIcon />
                </span>

                <div>
                  <small>
                    การมองเห็น
                  </small>

                  <strong>
                    {isPublic
                      ? 'Public'
                      : 'Private'}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {/* Current Status */}
          <section className="story-sidebar-card">
            <div className="story-sidebar-section-title">
              <span className="sidebar-section-icon">
                <LocationIcon />
              </span>

              สถานะปัจจุบัน
            </div>

            <div className="story-sidebar-status-list">
              {currentStatus.location && (
                <div className="story-sidebar-status-item">
                  <span className="status-icon">
                    <LocationIcon />
                  </span>

                  <div>
                    <small>
                      สถานที่
                    </small>

                    <strong>
                      {currentStatus.location}
                    </strong>
                  </div>
                </div>
              )}

              {currentStatus.physicalCondition && (
                <div className="story-sidebar-status-item">
                  <span className="status-icon">
                    <Icon>
                      <path d="M12 3v18" />
                      <path d="M5 8h14" />
                      <path d="M7 8v5a5 5 0 0 0 10 0V8" />
                    </Icon>
                  </span>

                  <div>
                    <small>
                      สภาพร่างกาย
                    </small>

                    <strong>
                      {
                        currentStatus.physicalCondition
                      }
                    </strong>
                  </div>
                </div>
              )}

              {currentStatus.importantSituation && (
                <div className="story-sidebar-status-item">
                  <span className="status-icon">
                    <ChoiceIcon />
                  </span>

                  <div>
                    <small>
                      สถานการณ์สำคัญ
                    </small>

                    <strong>
                      {
                        currentStatus.importantSituation
                      }
                    </strong>
                  </div>
                </div>
              )}

              {currentStatus.inventory.length > 0 && (
                <div className="story-sidebar-status-item">
                  <span className="status-icon">
                    <Icon>
                      <rect
                        x="3"
                        y="6"
                        width="18"
                        height="14"
                        rx="2"
                      />
                      <path d="M8 6V4h8v2" />
                      <path d="M3 11h18" />
                    </Icon>
                  </span>

                  <div>
                    <small>
                      สิ่งของ
                    </small>

                    <div className="story-sidebar-inventory-list">
                      {currentStatus.inventory.map(
                        (
                          item,
                          index
                        ) => (
                          <span
                            key={`${item}-${index}`}
                            className="story-sidebar-inventory-item"
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!currentStatus.location &&
              !currentStatus.physicalCondition &&
              !currentStatus.importantSituation &&
              currentStatus.inventory.length === 0 && (
                <div className="story-sidebar-empty">
                  ยังไม่มีข้อมูลสถานะ
                </div>
              )}
          </section>

          {/* Characters */}
          <section className="story-sidebar-card">
            <div className="story-sidebar-section-title">
              <span className="sidebar-section-icon">
                <CharactersIcon />
              </span>

              ตัวละคร

              <small>
                ({characters.length})
              </small>
            </div>

            {characters.length > 0 ? (
              <div className="story-sidebar-characters">
                {characters.map(
                  (character) => (
                    <div
                      key={character.id}
                      className="story-sidebar-character"
                    >
                      <span className="story-sidebar-character-icon">
                        <CharactersIcon />
                      </span>

                      <div className="story-sidebar-character-info">
                        <strong>
                          {character.name}
                        </strong>

                        <small>
                          {character.role ===
                          'player'
                            ? 'ผู้เล่น'
                            : 'ตัวละคร'}

                          {character.gender
                            ? ` · ${character.gender}`
                            : ''}
                        </small>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="story-sidebar-empty">
                ยังไม่มีข้อมูลตัวละคร
              </div>
            )}
          </section>

          {/* Story Path */}
          <section className="story-sidebar-card">
            <div className="story-sidebar-section-title">
              <span className="sidebar-section-icon">
                <PathIcon />
              </span>

              เส้นทางเรื่อง

              <small>
                ({selectedChapter} /{' '}
                {totalChapters})
              </small>
            </div>

            <div className="story-path">
              {chapters.map(
                (chapter) => {
                  const isCurrent =
                    chapter.chapterNumber ===
                    selectedChapter;

                  const isCompleted =
                    chapter.chapterNumber <
                    selectedChapter;

                  return (
                    <button
                      type="button"
                      key={chapter.id}
                      className={`story-path-item ${
                        isCurrent
                          ? 'current'
                          : ''
                      } ${
                        isCompleted
                          ? 'completed'
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedChapter(
                          chapter.chapterNumber
                        );

                        scrollToTop();
                      }}
                    >
                      <div className="story-path-number">
                        {
                          chapter.chapterNumber
                        }
                      </div>

                      <div className="story-path-line" />

                      <span>
                        {isCurrent
                          ? 'ปัจจุบัน'
                          : isCompleted
                            ? 'อ่านแล้ว'
                            : 'อ่านได้'}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}