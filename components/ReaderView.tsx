'use client';

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import type {
  Story,
  Chapter,
} from '@/types/story';

import '@/styles/reader.css';
import '@/styles/story-reader.css';

interface ReaderViewProps {
  story: Story;
  sessionId: string;
  sessionCharacters: any[];
  onBack: () => void;
  onUpdateStory: (updatedStory: Story) => void;

  // ใช้แสดง Skeleton ตอนกำลังโหลดข้อมูล
  loading?: boolean;
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

const LocationIcon = () => (
  <Icon>
    <path d="M12 21s7-6.2 7-11A7 7 0 0 0 5 10c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

const HealthIcon = () => (
  <Icon>
    <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.8 4.8 0 0 1 8 4.2c1.6 0 3.1.8 4 2 0.9-1.2 2.4-2 4-2a4.8 4.8 0 0 1 4.8 4.6Z" />
    <path d="M8 10h2l1.2-2.2L13 13l1.3-2H16" />
  </Icon>
);

const InventoryIcon = () => (
  <Icon>
    <path d="M5 8.5h14l-1 11H6l-1-11Z" />
    <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    <path d="M8 12h8" />
  </Icon>
);

const WarningIcon = () => (
  <Icon>
    <path d="M12 3 21 20H3L12 3Z" />
    <path d="M12 9v4" />
    <path d="M12 16h.01" />
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

const NarrationIcon = () => (
  <Icon size={18}>
    <path d="M5 5h14" />
    <path d="M5 10h14" />
    <path d="M5 15h9" />
    <path d="M5 20h6" />
  </Icon>
);

const DialogueIcon = () => (
  <Icon size={18}>
    <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
  </Icon>
);

const ThoughtIcon = () => (
  <Icon size={18}>
    <path d="M7 17.5a4 4 0 1 1 1.2-7.8A5.5 5.5 0 0 1 19 11a4 4 0 0 1-1 7.8H9" />
    <circle cx="5" cy="20" r="1" />
    <circle cx="9" cy="21" r=".8" />
  </Icon>
);

const ActionIcon = () => (
  <Icon size={18}>
    <path d="m14 3-9 10h7l-2 8 9-11h-7l2-7Z" />
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

      if (/^\[dialogue\]\s*/i.test(text)) {
        return {
          type: 'dialogue',
          text: text
            .replace(/^\[dialogue\]\s*/i, '')
            .trim(),
        };
      }

      if (/^\[thought\]\s*/i.test(text)) {
        return {
          type: 'thought',
          text: text
            .replace(/^\[thought\]\s*/i, '')
            .trim(),
        };
      }

      if (/^\[action\]\s*/i.test(text)) {
        return {
          type: 'action',
          text: text
            .replace(/^\[action\]\s*/i, '')
            .trim(),
        };
      }

      if (/^\[important\]\s*/i.test(text)) {
        return {
          type: 'important',
          text: text
            .replace(/^\[important\]\s*/i, '')
            .trim(),
        };
      }

      if (
        /^เหตุการณ์สำคัญ\s*[:：]\s*/i.test(text)
      ) {
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

      if (
        /^การกระทำ\s*[:：]\s*/i.test(text)
      ) {
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

      if (
        /^ความคิด\s*[:：]\s*/i.test(text)
      ) {
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

      const isDialogue =
        /^["“「『].*["”」』]$/.test(text);

      if (isDialogue) {
        return {
          type: 'dialogue',
          text,
        };
      }

      return {
        type: 'narration',
        text,
      };
    });
};

const getParagraphIcon = (
  type: StoryParagraphType
) => {
  switch (type) {
    case 'dialogue':
      return <DialogueIcon />;

    case 'thought':
      return <ThoughtIcon />;

    case 'action':
      return <ActionIcon />;

    case 'important':
      return <WarningIcon />;

    default:
      return <NarrationIcon />;
  }
};

/* =========================================================
   READER
========================================================= */

export const ReaderView: React.FC<
  ReaderViewProps
> = ({
  story,
  sessionId,
  sessionCharacters,
  onBack,
  onUpdateStory,
  loading = false,
}) => {
  const router = useRouter();

  const [userPrompt, setUserPrompt] =
    useState('');

  const [selectedChoice, setSelectedChoice] =
    useState<string | null>(null);

  const [isGeneratingNext, setIsGeneratingNext] =
    useState(false);

  const [fontSize, setFontSize] =
    useState<'sm' | 'md' | 'lg'>('md');

  const [selectedChapter, setSelectedChapter] =
    useState(story.currentChapter);

  useEffect(() => {
    setSelectedChapter(story.currentChapter);
    setSelectedChoice(null);
    setUserPrompt('');
  }, [story.currentChapter]);

  const currentChapter =
    story.chapters.find(
      (chapter) =>
        chapter.chapterNumber ===
        selectedChapter
    ) ||
    story.chapters[
      story.chapters.length - 1
    ];

  const isLatestChapter =
    selectedChapter === story.currentChapter;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const genreClassMap: Record<
    string,
    string
  > = {
    แฟนตาซี: 'genre-fantasy',
    โรแมนติก: 'genre-romance',
    สืบสวนสอบสวน: 'genre-mystery',
    สืบสวน: 'genre-mystery',
    ไซไฟ: 'genre-sci-fi',
    ประวัติศาสตร์: 'genre-history',
    สยองขวัญ: 'genre-horror',
    ดราม่า: 'genre-drama',
    แอ็กชัน: 'genre-action',
    แอคชัน: 'genre-action',
    ผจญภัย: 'genre-adventure',
  };

  const genreClass =
    genreClassMap[
      story.genre?.trim()
    ] || 'genre-default';

  const progressPercent = useMemo(() => {
    if (!story.totalChapters) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (story.currentChapter /
          story.totalChapters) *
          100
      )
    );
  }, [
    story.currentChapter,
    story.totalChapters,
  ]);

  const chapterChoices =
    Array.isArray(
      (
        currentChapter as Chapter & {
          choices?: string[];
        }
      ).choices
    )
      ? (
          currentChapter as Chapter & {
            choices?: string[];
          }
        ).choices?.slice(0, 3) || []
      : [];

  const storyParagraphs = useMemo(() => {
    if (!currentChapter) {
      return [];
    }

    return parseStoryContent(
      currentChapter.content
    );
  }, [currentChapter]);

  /* =========================================================
     SORT CHARACTERS
  ========================================================= */

  const sortedSessionCharacters = useMemo(() => {
    return sessionCharacters
      .map((character, originalIndex) => ({
        character,
        originalIndex,
      }))
      .sort((a, b) => {
        const getCharacterOrder = (
          character: any,
          originalIndex: number
        ) => {
          const role = String(
            character?.role || ''
          )
            .trim()
            .toLowerCase();

          const name = String(
            character?.name || ''
          ).trim();

          if (
            role === 'player' ||
            role === 'ผู้เล่น' ||
            role === 'protagonist' ||
            name.toLowerCase() === 'player'
          ) {
            return 0;
          }

          const supportingMatch =
            name.match(
              /ตัวประกอบ\s*(\d+)/i
            );

          if (supportingMatch) {
            return Number(
              supportingMatch[1]
            );
          }

          const supportingEnglishMatch =
            name.match(
              /(?:supporting|side\s*character)\s*(\d+)/i
            );

          if (supportingEnglishMatch) {
            return Number(
              supportingEnglishMatch[1]
            );
          }

          if (
            role.includes('ตัวประกอบ') ||
            role.includes('supporting')
          ) {
            const numberMatch =
              name.match(/\d+/);

            if (numberMatch) {
              return Number(
                numberMatch[0]
              );
            }
          }

          return 1000 + originalIndex;
        };

        return (
          getCharacterOrder(
            a.character,
            a.originalIndex
          ) -
          getCharacterOrder(
            b.character,
            b.originalIndex
          )
        );
      })
      .map((item) => item.character);
  }, [sessionCharacters]);

  const handleOpenBranchReader = () => {
    router.push(
      `/story/${story.id}/branches/${sessionId}`
    );
  };

  const handlePreviousChapter = () => {
    if (selectedChapter <= 1) {
      return;
    }

    setSelectedChapter(
      selectedChapter - 1
    );

    setSelectedChoice(null);
    setUserPrompt('');

    scrollToTop();
  };

  const handleNextChapter = () => {
    if (
      selectedChapter >=
      story.currentChapter
    ) {
      return;
    }

    setSelectedChapter(
      selectedChapter + 1
    );

    setSelectedChoice(null);
    setUserPrompt('');

    scrollToTop();
  };

  const handleGenerateNextChapter = async (
    choice?: string
  ) => {
    const selectedDecision =
      choice?.trim() ||
      selectedChoice?.trim() ||
      userPrompt.trim();

    if (
      !selectedDecision ||
      isGeneratingNext ||
      story.currentChapter >=
        story.totalChapters
    ) {
      return;
    }

    setIsGeneratingNext(true);

    try {
      const res = await fetch(
        '/api/generate-story',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            actionType:
              'next_chapter',

            storyId:
              story.id,

            storyTitle:
              story.title,

            genre:
              story.genre,

            tone:
              story.tone,

            previousChapters:
              story.chapters,

            userChoice:
              selectedDecision,
          }),
        }
      );

      const data =
        await res.json();

      if (
        !res.ok ||
        !data.success ||
        !data.chapter
      ) {
        throw new Error(
          data.error ||
            'ไม่สามารถสร้างบทถัดไปได้'
        );
      }

      const newChapter: Chapter & {
        choices?: string[];
      } = {
        id:
          data.chapter.id,

        chapterNumber:
          data.chapter.chapterNumber,

        title:
          data.chapter.title ||
          `บทที่ ${data.chapter.chapterNumber}`,

        content:
          data.chapter.content || '',

        choices:
          Array.isArray(
            data.chapter.choices
          )
            ? data.chapter.choices.slice(
                0,
                3
              )
            : [],

        userPromptChoice:
          selectedDecision,

        createdAt:
          data.chapter.createdAt,
      };

      const updatedStory: Story = {
        ...story,

        currentChapter:
          newChapter.chapterNumber,

        chapters: [
          ...story.chapters,
          newChapter,
        ],

        wordCount:
          story.wordCount +
          newChapter.content.length,
      };

      onUpdateStory(
        updatedStory
      );

      setSelectedChapter(
        newChapter.chapterNumber
      );

      setSelectedChoice(null);
      setUserPrompt('');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error(
        'generate next chapter error:',
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถสร้างบทใหม่ได้'
      );
    } finally {
      setIsGeneratingNext(false);
    }
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="story-reader-page reader-loading">
        <main className="story-reader-layout">

          {/* =========================
              MAIN SKELETON
          ========================= */}

          <section className="story-reader-main">

            <article className="story-reader-article">

              <div className="story-reader-inner-header">

                <div className="reader-loading-back" />

                <div className="story-reader-top-actions">

                  <div className="reader-loading-branch" />

                  <div className="reader-loading-font">
                    <span />
                    <span />
                    <span />
                  </div>

                </div>
              </div>

              <div className="story-reader-chapter-header">

                <div className="story-reader-chapter-top">

                  <div className="reader-loading-chapter-count" />

                  <div className="story-reader-progress">

                    <div className="story-reader-progress-track">
                      <div className="reader-loading-progress-value" />
                    </div>

                    <span className="reader-loading-progress-text" />

                  </div>
                </div>

                <div className="reader-loading-chapter-title" />

                <div className="story-reader-chapter-divider" />

              </div>

              <div className="reader-loading-story">

                {Array.from({
                  length: 14,
                }).map((_, index) => (
                  <div
                    key={index}
                    className={
                      index % 5 === 4
                        ? 'reader-loading-line short'
                        : 'reader-loading-line'
                    }
                  />
                ))}

              </div>

              <div className="story-reader-navigation">

                <div className="reader-loading-nav-button" />

                <div className="reader-loading-nav-counter" />

                <div className="reader-loading-nav-button" />

              </div>

              <section className="story-reader-choice-section">

                <div className="story-reader-choice-heading">

                  <div className="reader-loading-choice-icon" />

                  <div className="reader-loading-choice-heading-content">
                    <div className="reader-loading-choice-title" />
                    <div className="reader-loading-choice-description" />
                  </div>

                </div>

                <div className="reader-loading-choice-list">

                  <div className="reader-loading-choice" />
                  <div className="reader-loading-choice" />
                  <div className="reader-loading-choice" />

                </div>

                <div className="reader-loading-input-group">
                  <div className="reader-loading-input" />
                  <div className="reader-loading-submit" />
                </div>

              </section>

            </article>

          </section>

          {/* =========================
              SIDEBAR SKELETON
          ========================= */}

          <aside className="story-reader-sidebar">

            {/* Story Info */}

            <section className="story-sidebar-card story-sidebar-story">

              <div className="story-sidebar-cover">
                <div className="reader-loading-cover" />
              </div>

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

            {/* Current Status */}

            <section className="story-sidebar-card">

              <div className="reader-loading-section-title" />

              <div className="reader-loading-status-item">
                <span />
                <div>
                  <small />
                  <strong />
                </div>
              </div>

              <div className="reader-loading-status-item">
                <span />
                <div>
                  <small />
                  <strong />
                </div>
              </div>

              <div className="reader-loading-status-item">
                <span />
                <div>
                  <small />
                  <strong />
                </div>
              </div>

            </section>

            {/* Characters */}

            <section className="story-sidebar-card">

              <div className="reader-loading-section-title" />

              <div className="reader-loading-character">
                <span />
                <div>
                  <strong />
                  <small />
                </div>
              </div>

              <div className="reader-loading-character">
                <span />
                <div>
                  <strong />
                  <small />
                </div>
              </div>

              <div className="reader-loading-character">
                <span />
                <div>
                  <strong />
                  <small />
                </div>
              </div>

            </section>

            {/* Story Path */}

            <section className="story-sidebar-card">

              <div className="reader-loading-section-title" />

              <div className="reader-loading-path">
                <span />
                <span />
                <span />
                <span />
              </div>

            </section>

          </aside>

        </main>
      </div>
    );
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (!currentChapter) {
    return (
      <div className="story-reader-page">
        <main className="story-reader-empty">

          <div className="story-reader-empty-card">

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
              เรื่องราวกำลังจะเริ่มต้นขึ้น
            </p>

            <button
              type="button"
              className="story-reader-back"
              onClick={onBack}
            >
              ‹ กลับสู่หน้าหลัก
            </button>

          </div>

        </main>
      </div>
    );
  }

  /* =========================================================
     MAIN READER
  ========================================================= */

  return (
    <div
      className={`story-reader-page font-size-${fontSize}`}
    >
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
                INNER TOPBAR
            ================================================= */}

            <div className="story-reader-inner-header">

              <button
                type="button"
                className="story-reader-back"
                onClick={onBack}
              >
                ‹ กลับสู่หน้าหลัก
              </button>

              <div className="story-reader-top-actions">

                <button
                  type="button"
                  onClick={
                    handleOpenBranchReader
                  }
                  className="story-reader-branch-button"
                >
                  <BranchIcon />

                  <span>
                    จัดการเส้นเรื่อง
                  </span>
                </button>

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

              </div>
            </div>

            {/* =================================================
                CHAPTER HEADER
            ================================================= */}

            <div className="story-reader-chapter-header">

              <div className="story-reader-chapter-top">

                <div className="story-reader-chapter-count">
                  บทที่{' '}
                  {currentChapter.chapterNumber}
                  {' / '}
                  {story.totalChapters}
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
                    การตัดสินใจของคุณ
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
            ================================================= */}

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
                {story.currentChapter}
              </span>

              <button
                type="button"
                className="story-reader-nav-button"
                disabled={
                  selectedChapter >=
                  story.currentChapter
                }
                onClick={
                  handleNextChapter
                }
              >
                บทถัดไป ›
              </button>

            </div>

            {/* =================================================
                CHOICES
            ================================================= */}

            {isLatestChapter && (
              <section className="story-reader-choice-section">

                <div className="story-reader-choice-heading">

                  <span className="story-reader-choice-icon">
                    <ChoiceIcon />
                  </span>

                  <div>

                    <h2>
                      คุณจะทำอย่างไรต่อ?
                    </h2>

                    <p>
                      เลือกแนวทางที่ต้องการ
                      หรือพิมพ์การตัดสินใจของคุณเอง
                    </p>

                  </div>

                </div>

                {story.currentChapter <
                story.totalChapters ? (
                  <>
                    {chapterChoices.length >
                      0 && (
                        <div className="story-reader-choice-list">

                          {chapterChoices.map(
                            (
                              choice,
                              index
                            ) => {

                              const isSelected =
                                selectedChoice ===
                                choice;

                              return (
                                <button
                                  key={`${choice}-${index}`}
                                  type="button"
                                  className={`story-reader-choice-button ${
                                    isSelected
                                      ? 'selected'
                                      : ''
                                  }`}
                                  onClick={() => {

                                    if (
                                      isSelected
                                    ) {
                                      setSelectedChoice(
                                        null
                                      );

                                      return;
                                    }

                                    setSelectedChoice(
                                      choice
                                    );

                                    setUserPrompt(
                                      ''
                                    );
                                  }}
                                  disabled={
                                    isGeneratingNext
                                  }
                                >

                                  <span className="story-reader-choice-number">
                                    {isSelected
                                      ? '✓'
                                      : index +
                                        1}
                                  </span>

                                  <span className="story-reader-choice-text">
                                    {choice}
                                  </span>

                                  <span className="story-reader-choice-arrow">
                                    →
                                  </span>

                                </button>
                              );
                            }
                          )}

                        </div>
                      )}

                    <div className="story-reader-choice-fallback">

                      <input
                        id="user-action"
                        type="text"
                        placeholder={
                          selectedChoice
                            ? 'เลือกตัวเลือกด้านบนแล้วกด "ดำเนินเรื่องต่อ"'
                            : 'พิมพ์การตัดสินใจของคุณ...'
                        }
                        value={userPrompt}
                        onChange={(e) => {

                          setUserPrompt(
                            e.target.value
                          );

                          if (
                            e.target.value.trim()
                          ) {
                            setSelectedChoice(
                              null
                            );
                          }
                        }}
                        onKeyDown={(e) => {

                          if (
                            e.key === 'Enter' &&
                            !e.shiftKey &&
                            !selectedChoice &&
                            userPrompt.trim()
                          ) {
                            e.preventDefault();

                            handleGenerateNextChapter();
                          }
                        }}
                        disabled={
                          !!selectedChoice ||
                          isGeneratingNext
                        }
                      />

                      <button
                        type="button"
                        className="story-reader-submit"
                        onClick={() =>
                          handleGenerateNextChapter()
                        }
                        disabled={
                          (!selectedChoice &&
                            !userPrompt.trim()) ||
                          isGeneratingNext
                        }
                      >
                        {isGeneratingNext
                          ? 'กำลังสร้าง...'
                          : 'ดำเนินเรื่องต่อ →'}
                      </button>

                    </div>
                  </>
                ) : (
                  <div className="story-reader-finished">
                    เรื่องราวจบลงแล้ว
                  </div>
                )}

              </section>
            )}

            {/* =================================================
                GENERATING
            ================================================= */}

            {isGeneratingNext && (
              <div className="story-reader-generating">

                <div className="story-reader-writing-icon">
                  <span />
                  <span />
                  <span />
                </div>

                <div>

                  <strong>
                    กำลังเรียบเรียงเรื่องราวบทต่อไป
                  </strong>

                  <span>
                    ตามการตัดสินใจของคุณ
                  </span>

                </div>

              </div>
            )}

          </article>

        </section>

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="story-reader-sidebar">

          {/* Story Info */}

          <section className="story-sidebar-card story-sidebar-story">

            <div className="story-sidebar-cover">

              <img
                src={
                  story.coverUrl ||
                  '/images/default-cover.png'
                }
                alt={story.title}
              />

            </div>

            <div className="story-sidebar-story-info">

              <h2>
                {story.title}
              </h2>

              <div className="story-sidebar-tags">

                <span>
                  {story.genre}
                </span>

                <span>
                  {story.tone}
                </span>

              </div>

              <p>
                {story.corePremise}
              </p>

              <div className="story-sidebar-author">
                ผู้เขียน {story.author}
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

              <div className="story-sidebar-status-item">

                <span className="status-icon">
                  <LocationIcon />
                </span>

                <div>

                  <small>
                    สถานที่
                  </small>

                  <strong>
                    {story.currentLocation ||
                      'ไม่ระบุ'}
                  </strong>

                </div>

              </div>

              <div className="story-sidebar-status-item">

                <span className="status-icon">
                  <HealthIcon />
                </span>

                <div>

                  <small>
                    สภาพร่างกาย
                  </small>

                  <strong>
                    {story.physicalCondition ||
                      'ไม่ระบุ'}
                  </strong>

                </div>

              </div>

              <div className="story-sidebar-status-item">

                <span className="status-icon">
                  <InventoryIcon />
                </span>

                <div>

                  <small>
                    ของติดตัว
                  </small>

                  <strong>
                    {story.currentInventory
                      ?.length
                      ? story.currentInventory.join(
                          ', '
                        )
                      : 'ไม่มี'}
                  </strong>

                </div>

              </div>

              <div className="story-sidebar-status-item">

                <span className="status-icon">
                  <WarningIcon />
                </span>

                <div>

                  <small>
                    สถานการณ์สำคัญ
                  </small>

                  <strong>
                    {story.importantSituation ||
                      'ไม่มี'}
                  </strong>

                </div>

              </div>

            </div>

          </section>

          {/* Characters */}

          <section className="story-sidebar-card">

            <div className="story-sidebar-section-title">

              <span className="sidebar-section-icon">
                <CharactersIcon />
              </span>

              ตัวละคร

              <small>
                ({sortedSessionCharacters.length})
              </small>

            </div>

            {sortedSessionCharacters.length > 0 ? (
              <div className="story-sidebar-characters">

                {sortedSessionCharacters.map(
                  (
                    character,
                    index
                  ) => (
                    <div
                      key={
                        character.id ||
                        `${character.name}-${index}`
                      }
                      className="story-sidebar-character"
                    >

                      <span className="story-sidebar-character-icon">
                        <CharactersIcon />
                      </span>

                      <div className="story-sidebar-character-info">

                        <strong>
                          {character.name ||
                            'ไม่ระบุชื่อ'}
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
                ({story.currentChapter} /{' '}
                {story.totalChapters})
              </small>

            </div>

            <div className="story-path">

              {story.chapters.map(
                (chapter) => {

                  const isCurrent =
                    chapter.chapterNumber ===
                    story.currentChapter;

                  const isCompleted =
                    chapter.chapterNumber <
                    story.currentChapter;

                  return (
                    <div
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
                            : 'ล็อก'}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </section>

        </aside>

      </main>
    </div>
  );
};

export default ReaderView;