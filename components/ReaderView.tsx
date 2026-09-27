'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import type {
  Story,
  Chapter,
} from '@/types/story';

import '@/styles/reader.css';

interface ReaderViewProps {
  story: Story;
  sessionId: string;
  onBack: () => void;
  onUpdateStory: (
    updatedStory: Story
  ) => void;
}

export const ReaderView: React.FC<
  ReaderViewProps
> = ({
  story,
  sessionId,
  onBack,
  onUpdateStory,
}) => {
    const router = useRouter();

    const [userPrompt, setUserPrompt] =
      useState('');

    const [
      isGeneratingNext,
      setIsGeneratingNext,
    ] = useState(false);

    const [fontSize, setFontSize] =
      useState<'sm' | 'md' | 'lg'>('md');

    const [
      selectedChapter,
      setSelectedChapter,
    ] = useState(story.currentChapter);

    useEffect(() => {
      setSelectedChapter(
        story.currentChapter
      );
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

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

    const isLatestChapter =
      selectedChapter ===
      story.currentChapter;

    const handleOpenBranchReader = () => {
      router.push(
        `/story/${story.id}/branches/${sessionId}`
      );
    };

    const handleGenerateNextChapter =
      async () => {
        if (
          !userPrompt.trim() ||
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
                storyId: story.id,
                storyTitle:
                  story.title,
                genre: story.genre,
                tone: story.tone,
                previousChapters:
                  story.chapters,
                userChoice:
                  userPrompt,
              }),
            }
          );

          const data = await res.json();

          if (
            !res.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
              'ไม่สามารถสร้างบทถัดไปได้'
            );
          }

          const newChapter: Chapter = {
            id: data.chapter.id,

            chapterNumber:
              data.chapter
                .chapterNumber,

            title:
              data.chapter.title ||
              `บทที่ ${data.chapter.chapterNumber}`,

            content:
              data.chapter.content,

            userPromptChoice:
              userPrompt,

            createdAt:
              data.chapter.createdAt,
          };

          const updatedStory: Story = {
            ...story,

            currentChapter:
              newChapter.chapterNumber,

            totalChapters:
              story.totalChapters,

            wordCount:
              story.wordCount +
              newChapter.content.length,

            chapters: [
              ...story.chapters,
              newChapter,
            ],
          };

          onUpdateStory(
            updatedStory
          );

          setSelectedChapter(
            newChapter.chapterNumber
          );

          setUserPrompt('');

          setTimeout(() => {
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }, 100);
        } catch (err) {
          console.error(err);

          alert(
            err instanceof Error
              ? err.message
              : 'ไม่สามารถสร้างบทใหม่ได้'
          );
        } finally {
          setIsGeneratingNext(false);
        }
      };

    if (!currentChapter) {
      return (
        <div className="reader-wrapper">
          <header className="reader-header story-reader-header">
            <div className="story-reader-header-inner">
              <button
                className="btn-back"
                onClick={onBack}
              >
                ‹ กลับสู่หน้าหลัก
              </button>
            </div>
          </header>

          <main className="reader-empty">
            <div>
              <span>📖</span>

              <h2>
                ยังไม่มีเนื้อเรื่อง
              </h2>

              <p>
                เรื่องราวกำลังจะเริ่มต้นขึ้น
              </p>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div
        className={`reader-wrapper font-size-${fontSize}`}
      >
        {/* Header */}
        <header className="reader-header story-reader-header">
          <div className="story-reader-header-inner">
            <button
              className="btn-back"
              onClick={onBack}
            >
              ‹ กลับสู่หน้าหลัก
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {/* จัดการเส้นเรื่อง */}
              <button
                onClick={handleOpenBranchReader}
                title="จัดการเส้นเรื่อง"
                className="branch-settings-button"
              >
                จัดการเส้นเรื่อง
              </button>

              {/* Font Size */}
              <div className="font-size-controls">
                <button
                  onClick={() =>
                    setFontSize('sm')
                  }
                  className={
                    fontSize === 'sm'
                      ? 'active'
                      : ''
                  }
                >
                  A-
                </button>

                <button
                  onClick={() =>
                    setFontSize('md')
                  }
                  className={
                    fontSize === 'md'
                      ? 'active'
                      : ''
                  }
                >
                  A
                </button>

                <button
                  onClick={() =>
                    setFontSize('lg')
                  }
                  className={
                    fontSize === 'lg'
                      ? 'active'
                      : ''
                  }
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Reader */}
        <main className="reader-content">

          {/* Story Info */}
          <div className="story-meta-banner">

            <h1 className="story-main-title">
              {story.title}
            </h1>

            <div className="story-badges">
              <span className="badge">
                {story.genre}
              </span>

              <span className="badge">
                {story.tone}
              </span>
            </div>

            <p className="premise font-serif">
              "{story.corePremise}"
            </p>

            <div className="chapter-counter">
              ผู้เขียน {story.author} ร่วมกับ AI
            </div>

            <div className="chapter-counter">
              บทที่{' '}
              {currentChapter.chapterNumber}
              {' / '}
              {story.totalChapters}
            </div>
          </div>

          {/* Current Chapter */}
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
                {currentChapter.chapterNumber}
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

          {/* Navigation */}
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
              {story.currentChapter}
            </span>

            <button
              className="chapter-nav-button"
              disabled={
                selectedChapter >=
                story.currentChapter
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

          {/* Story Generation Loading */}
          {isGeneratingNext && (
            <div className="ai-generating-card">
              <div className="story-writing-animation">
                <span className="writing-line line-1" />
                <span className="writing-line line-2" />
                <span className="writing-line line-3" />

                <span className="writing-cursor" />
              </div>

              <div className="ai-generating-content">
                <p>
                  กำลังเรียบเรียงเรื่องราวบทต่อไป
                </p>

                <span>
                  ตามการตัดสินใจของคุณ
                </span>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Interaction */}
        {isLatestChapter && (
          <div className="reader-interactive-bar">
            <div className="interactive-container">
              <label htmlFor="user-action">
                {story.currentChapter >=
                  story.totalChapters
                  ? 'เรื่องราวจบลงแล้ว'
                  : 'คุณต้องการให้ตัวละครทำอะไรต่อไป?'}
              </label>

              {story.currentChapter <
                story.totalChapters && (
                  <div className="input-group">
                    <input
                      id="user-action"
                      type="text"
                      placeholder="เช่น เดินเข้าไปสำรวจประตูไม้เก่า..."
                      value={userPrompt}
                      onChange={(e) =>
                        setUserPrompt(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter'
                        ) {
                          handleGenerateNextChapter();
                        }
                      }}
                      disabled={
                        isGeneratingNext
                      }
                    />

                    <button
                      className="btn-next-chapter"
                      onClick={
                        handleGenerateNextChapter
                      }
                      disabled={
                        !userPrompt.trim() ||
                        isGeneratingNext
                      }
                    >
                      {isGeneratingNext
                        ? 'กำลังแต่ง...'
                        : 'ดำเนินเรื่องต่อ ›'}
                    </button>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    );
  };