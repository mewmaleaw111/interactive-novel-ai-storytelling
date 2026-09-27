'use client';

import React, { useState } from 'react';

import { Story } from '../types/story';

interface MyStoriesViewProps {
  myStories: Story[];

  onSelectStory: (id: string) => void;

  onCreateStory: () => void;

  onEditStory: (story: Story) => void;

  onDeleteStory: (id: string) => void;

  onTogglePublish: (story: Story) => void;
}

export const MyStoriesView: React.FC<
  MyStoriesViewProps
> = ({
  myStories,
  onSelectStory,
  onCreateStory,
  onEditStory,
  onDeleteStory,
  onTogglePublish,
}) => {
  /*
   * ==========================================
   * TOTAL WORDS
   * ==========================================
   */

  const totalWords = myStories.reduce(
    (acc, curr) => acc + curr.wordCount,
    0
  );

  /*
   * ==========================================
   * CREATE
   * ==========================================
   */

  const handleCreateClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onCreateStory();
  };

  /*
   * ==========================================
   * EDIT
   * ==========================================
   */

  const handleEditClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onEditStory(story);
  };

  /*
   * ==========================================
   * DELETE
   * ==========================================
   */

  const handleDeleteClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onDeleteStory(story.id);
  };

  /*
   * ==========================================
   * PUBLISH / UNPUBLISH
   * ==========================================
   */

  const handleTogglePublishClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onTogglePublish(story);
  };

  /*
   * ==========================================
   * CONTINUE
   * ==========================================
   */

  const handleContinueClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onSelectStory(story.id);
  };

  return (
    <div className="view-container">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="mystories-header">

        <div>

          <span className="mystories-eyebrow">
            ผลงานของคุณ
          </span>

          <h1 className="mystories-title">
            My Stories
          </h1>

          <p className="mystories-description">
            จัดการนิยายที่คุณสร้าง
            และกลับมาแต่งต่อได้ทุกเมื่อ
          </p>

        </div>

        <button
          type="button"
          className="btn-hero-primary"
          onClick={handleCreateClick}
        >
          <span
            className="create-story-icon"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
          </span>

          <span>
            สร้างเรื่องใหม่
          </span>
        </button>

      </div>


      {/* ======================================
          AUTHOR DASHBOARD STATS
      ======================================= */}

      <div className="author-stats-banner font-serif">

        {/* Total Words */}

        <div className="stat-box">

          <span className="stat-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              <path d="M8 6h8" />
              <path d="M8 10h8" />
            </svg>
          </span>

          <span className="stat-val">
            {totalWords.toLocaleString()}
          </span>

          <span className="stat-lbl">
            คำที่แต่งทั้งหมด
          </span>

        </div>


        {/* Total Stories */}

        <div className="stat-box">

          <span className="stat-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              <path d="M8 6h8" />
              <path d="M8 10h6" />
              <path d="M8 14h5" />
            </svg>
          </span>

          <span className="stat-val">
            {myStories.length}
          </span>

          <span className="stat-lbl">
            เรื่องราวที่สร้าง
          </span>

        </div>


        {/* Completed Stories */}

        <div className="stat-box">

          <span className="stat-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 4h8" />
              <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
              <path d="M9 17h6" />
              <path d="M12 13v4" />
              <path d="M7 6H4v1a4 4 0 0 0 4 4" />
              <path d="M17 6h3v1a4 4 0 0 1-4 4" />
              <path d="M8 20h8" />
            </svg>
          </span>

          <span className="stat-val">
            {
              myStories.filter(
                (story) =>
                  story.totalChapters > 0 &&
                  story.currentChapter >= story.totalChapters
              ).length
            }
          </span>

          <span className="stat-lbl">
            เรื่องที่แต่งจบแล้ว
          </span>

        </div>

      </div>


      {/* ======================================
          STORY LIST
      ======================================= */}

      <div className="my-stories-list">

        {myStories.length === 0 ? (

          <div className="my-stories-empty">

            <div className="my-stories-empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                <path d="M8 7h8" />
                <path d="M8 11h6" />
              </svg>
            </div>

            <h2>
              ยังไม่มีนิยายของคุณ
            </h2>

            <p>
              เริ่มต้นสร้างเรื่องราวแรก
              ของคุณได้เลย
            </p>

            <button
              type="button"
              className="btn-hero-primary"
              onClick={handleCreateClick}
            >
              <span className="story-action-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                </svg>
              </span>

              สร้างนิยายเรื่องแรก
            </button>

          </div>

        ) : (

          myStories.map((story) => (
            <MyStoryItem
              key={story.id}
              story={story}
              onContinue={handleContinueClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onTogglePublish={handleTogglePublishClick}
            />
          ))

        )}

      </div>

    </div>
  );
};


/*
 * ==========================================
 * STORY ITEM
 * ==========================================
 */

interface MyStoryItemProps {
  story: Story;

  onContinue: (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => void;

  onEdit: (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => void;

  onDelete: (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => void;

  onTogglePublish: (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => void;
}


const MyStoryItem: React.FC<
  MyStoryItemProps
> = ({
  story,
  onContinue,
  onEdit,
  onDelete,
  onTogglePublish,
}) => {

  const [isCoverLoaded, setIsCoverLoaded] =
    useState(false);

  const [coverError, setCoverError] =
    useState(false);

  const coverSrc =
    story.coverUrl && !coverError
      ? story.coverUrl
      : '/images/default-cover.png';

  return (
    <div
      className={`my-story-item ${
        story.isBanned ? 'is-banned' : ''
      }`}
    >

      {/* ==================================
          COVER
      ================================== */}

      <div className="my-story-cover-wrapper">

        {story.coverUrl &&
          !isCoverLoaded &&
          !coverError && (
            <div className="my-story-cover-skeleton">
              <div className="my-story-cover-shimmer" />
            </div>
          )}

        <img
          src={coverSrc}
          alt={story.title}
          className={`my-story-cover ${
            isCoverLoaded
              ? 'my-story-cover-loaded'
              : 'my-story-cover-loading'
          }`}
          onLoad={() => {
            setIsCoverLoaded(true);
          }}
          onError={() => {
            if (
              story.coverUrl &&
              !coverError
            ) {
              setIsCoverLoaded(false);
              setCoverError(true);
              return;
            }

            setIsCoverLoaded(true);
          }}
        />

      </div>


      {/* ==================================
          STORY DETAILS
      ================================== */}

      <div className="my-story-details">

        <div className="my-story-top">

          <h3>
            {story.title}
          </h3>

          <span className="genre-tag">
            {story.genre}
          </span>

        </div>


        <p className="my-story-premise">
          {story.corePremise ||
            'ยังไม่มีคำโปรยสำหรับนิยายเรื่องนี้'}
        </p>


        <div className="my-story-meta">

          <span>
            {story.totalChapters} บท
          </span>

          <span>
            •
          </span>

          <span>
            {story.wordCount.toLocaleString()} คำ
          </span>

          <span>
            •
          </span>

          <span>
            แต่งเมื่อ{' '}

            {story.chapters[0]?.createdAt
              ? new Date(
                  story.chapters[0].createdAt
                ).toLocaleDateString(
                  'th-TH',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                )
              : 'ไม่นานมานี้'}
          </span>

        </div>


        {/* Progress */}

        {story.totalChapters > 0 && (
          <div className="my-story-progress">

            <div className="my-story-progress-top">

              <span>
                ความคืบหน้า
              </span>

              <span>
                {Math.min(
                  Math.round(
                    (story.currentChapter /
                      story.totalChapters) *
                    100
                  ),
                  100
                )}
                %
              </span>

            </div>

            <div className="my-story-progress-bg">

              <div
                className="my-story-progress-fill"
                style={{
                  width: `${Math.min(
                    (story.currentChapter /
                      story.totalChapters) *
                      100,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>
        )}

      </div>


      {/* ==================================
          ACTIONS
      ================================== */}

      <div
        className="my-story-action"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="story-card-actions">

          {story.isBanned ? (
            <>
              {/* BANNED STATUS */}

              <div className="story-banned-status">

                <span
                  className="story-banned-icon"
                  aria-hidden="true"
                >
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
                    <path d="M5.6 5.6l12.8 12.8" />
                  </svg>
                </span>

                <span className="story-action-label">
                  นิยายถูกแบน
                </span>

              </div>

              {/* DELETE */}

              <button
                type="button"
                className="story-action-btn story-action-delete"
                onClick={(e) =>
                  onDelete(e, story)
                }
              >

                <span className="story-action-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 7h16" />
                    <path d="M9 7V4h6v3" />
                    <path d="M7 7l1 13h8l1-13" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </span>

                <span className="story-action-label">
                  ลบ
                </span>

              </button>
            </>
          ) : (
            <>
              {/* Continue */}

              <button
                type="button"
                className="story-action-btn story-action-continue"
                onClick={(e) =>
                  onContinue(e, story)
                }
              >

                <span className="story-action-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 5l11 7-11 7V5Z" />
                  </svg>
                </span>

                <span className="story-action-label">
                  แต่งต่อ
                </span>

              </button>


              {/* Edit */}

              <button
                type="button"
                className="story-action-btn story-action-edit"
                onClick={(e) =>
                  onEdit(e, story)
                }
              >

                <span className="story-action-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
                  </svg>
                </span>

                <span className="story-action-label">
                  แก้ไข
                </span>

              </button>


              {/* Publish / Unpublish */}

              <button
                type="button"
                className={`story-action-btn ${
                  story.isPublished
                    ? 'story-action-unpublish'
                    : 'story-action-publish'
                }`}
                onClick={(e) =>
                  onTogglePublish(e, story)
                }
              >

                <span className="story-action-icon">

                  {story.isPublished ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4.1 9.7 6a11.7 11.7 0 0 1-2.2 2.8" />
                      <path d="M6.6 6.6C4.6 7.8 3.4 9.7 2.3 12c1.2 2.5 4.5 6 9.7 6 1.5 0 2.8-.3 4-.8" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 3v12" />
                      <path d="M7 8l5-5 5 5" />
                      <path d="M5 14v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" />
                    </svg>
                  )}

                </span>

                <span className="story-action-label">
                  {story.isPublished
                    ? 'ซ่อนนิยาย'
                    : 'เผยแพร่นิยาย'}
                </span>

              </button>


              {/* Delete */}

              <button
                type="button"
                className="story-action-btn story-action-delete"
                onClick={(e) =>
                  onDelete(e, story)
                }
              >

                <span className="story-action-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 7h16" />
                    <path d="M9 7V4h6v3" />
                    <path d="M7 7l1 13h8l1-13" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </span>

                <span className="story-action-label">
                  ลบ
                </span>

              </button>

            </>
          )}

        </div>

      </div>

    </div>
  );
};