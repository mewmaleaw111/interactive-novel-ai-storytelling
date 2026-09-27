'use client';

import React from 'react';
import { Story } from '../types/story';
import { StoryCard } from './StoryCard';
import LibrarySkeleton from './LibrarySkeleton';

interface LibraryViewProps {
  stories: Story[];
  isLoading?: boolean;
  isGuest?: boolean;

  onSelectStory: (id: string) => void;
  onOpenCreateModal: () => void;
  onGoToDiscover: () => void;

  onFavoriteChange: (
    storyId: string,
    isFavorite: boolean
  ) => void;
}

/*
 * =========================================
 * Skeleton Card
 * =========================================
 */

const SkeletonCard = () => {
  return (
    <div className="story-card skeleton-story-card">
      <div className="card-cover-wrapper">
        <div className="card-cover-skeleton">
          <div className="card-cover-shimmer" />
        </div>
      </div>

      <div className="card-info">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-author" />
        <div className="skeleton-line skeleton-stats" />
      </div>
    </div>
  );
};

/*
 * =========================================
 * Skeleton Grid
 * =========================================
 */

const SkeletonGrid = ({
  count = 6,
}: {
  count?: number;
}) => {
  return (
    <div className="story-grid">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

/*
 * =========================================
 * Empty State
 * =========================================
 */

const EmptyStories = ({
  isGuest,
  onGoToDiscover,
}: {
  isGuest: boolean;
  onGoToDiscover: () => void;
}) => {
  return (
    <section className="story-section">
      <div className="home-empty-state">

        <div
          className="home-empty-icon"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
            <path d="M4 5.5v16" />
            <path d="M8 7h8" />
            <path d="M8 11h7" />
          </svg>
        </div>

        <h2>
          {isGuest
            ? 'ยังไม่มีนิยายในระบบ'
            : 'ยังไม่มีเรื่องราวของคุณ'}
        </h2>

        <p>
          {isGuest
            ? 'ลองกลับมาใหม่อีกครั้งเพื่อค้นพบเรื่องราวใหม่ ๆ'
            : 'เริ่มสร้างนิยายเรื่องแรกของคุณได้เลย'}
        </p>

        {isGuest && (
          <button
            type="button"
            className="btn-hero-secondary"
            onClick={onGoToDiscover}
          >
            <span
              className="home-button-icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </span>

            สำรวจนิยาย
          </button>
        )}

      </div>
    </section>
  );
};

/*
 * =========================================
 * Section Heading
 * =========================================
 */

const HomeSectionHeading = ({
  icon,
  eyebrow,
  title,
}: {
  icon: 'book' | 'star' | 'compass';
  eyebrow: string;
  title: string;
}) => {
  return (
    <div className="home-section-heading">

      <div
        className="home-section-icon"
        aria-hidden="true"
      >
        {icon === 'book' && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
            <path d="M4 5.5V22" />
            <path d="M8 7h8" />
            <path d="M8 11h7" />
          </svg>
        )}

        {icon === 'star' && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="m12 3.8 2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.82l-5.1 2.68.97-5.68-4.12-4.02 5.7-.83L12 3.8Z" />
          </svg>
        )}

        {icon === 'compass' && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle cx="12" cy="12" r="8.5" />
            <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" />
          </svg>
        )}
      </div>

      <div className="home-section-heading-content">

        <span className="home-section-eyebrow">
          {eyebrow}
        </span>

        <h2 className="home-section-title">
          {title}
        </h2>

      </div>

    </div>
  );
};

/*
 * =========================================
 * Hero Decoration
 * =========================================
 */

const HomeHeroDecoration = () => {
  return (
    <div
      className="home-hero-decoration"
      aria-hidden="true"
    >

      <div className="home-hero-orbit home-hero-orbit-one" />
      <div className="home-hero-orbit home-hero-orbit-two" />

      <div className="home-hero-glow" />

      <div className="home-hero-icon-card">

        <img
          src="/images/hero.png"
          alt=""
          className="home-hero-image"
        />

        <span className="home-hero-star home-hero-star-one">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="m12 3.5 1.9 4.6 4.6 1.9-4.6 1.9-1.9 4.6-1.9-4.6-4.6-1.9 4.6-1.9L12 3.5Z" />
          </svg>
        </span>

        <span className="home-hero-star home-hero-star-two">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="m12 3.5 1.9 4.6 4.6 1.9-4.6 1.9-1.9 4.6-4.6-1.9 4.6-1.9L12 3.5Z" />
          </svg>
        </span>

      </div>

      <div className="home-hero-caption">
        <span>GONNATALES</span>
        <i />
        <span>STORIES</span>
      </div>

    </div>
  );
};

/*
 * =========================================
 * Library View
 * =========================================
 */

export const LibraryView: React.FC<
  LibraryViewProps
> = ({
  stories,
  isLoading = false,
  isGuest = false,

  onSelectStory,
  onOpenCreateModal,
  onGoToDiscover,
  onFavoriteChange,
}) => {

  /*
   * =========================================
   * Continue Reading
   * =========================================
   */

  const continueReadingList =
    stories.filter(
      (story) =>
        story.currentChapter > 0 &&
        story.currentChapter <
        story.totalChapters
    );

  /*
   * =========================================
   * Favorites
   * =========================================
   */

  const favoriteList =
    stories.filter(
      (story) => story.isFavorite
    );

  /*
   * =========================================
   * Discover
   * =========================================
   */

  const discoverList =
    stories.slice(0, 6);

  /*
   * =========================================
   * Guest Stories
   * =========================================
   */

  const guestStoryList =
    stories.slice(0, 8);

  /*
   * =========================================
   * Loading
   * =========================================
   */

  if (isLoading) {
    return <LibrarySkeleton />;
  }

  return (
    <div className="view-container">

      {/* =================================
          HOME HERO
      ================================= */}

      <section className="nook-header home-hero">

        <div className="nook-title-area home-hero-content">

          <span className="home-eyebrow">
            {isGuest
              ? 'WELCOME TO GONNATALES'
              : 'WELCOME BACK'}
          </span>

          <h1 className="home-main-title">
            {isGuest
              ? 'YOUR NEXT STORY AWAITS'
              : 'CONTINUE YOUR STORY'}
          </h1>

          <p className="nook-desc">
            {isGuest
              ? 'ค้นพบเรื่องราวใหม่ ๆ จากนักเขียนใน GonnaTales และเริ่มต้นการเดินทางของคุณ'
              : 'กลับมาอ่านเรื่องราวที่คุณชื่นชอบ หรือสร้างสรรค์โลกใบใหม่ไปพร้อมกับ AI'}
          </p>

          <div className="nook-actions">

            {isGuest ? (
              <>
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={onGoToDiscover}
                >
                  <span
                    className="home-button-icon"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="6.5"
                      />
                      <path d="m16 16 4.5 4.5" />
                    </svg>
                  </span>

                  สำรวจนิยาย
                </button>

                <button
                  type="button"
                  className="btn-hero-secondary"
                  onClick={onOpenCreateModal}
                >
                  <span
                    className="home-button-icon"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>

                  เริ่มสร้างเรื่อง
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={onOpenCreateModal}
                >
                  <span
                    className="home-button-icon"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>

                  เริ่มสร้างเรื่องใหม่
                </button>

                <button
                  type="button"
                  className="btn-hero-secondary"
                  onClick={onGoToDiscover}
                >
                  <span
                    className="home-button-icon"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="6.5"
                      />
                      <path d="m16 16 4.5 4.5" />
                    </svg>
                  </span>

                  สำรวจคลังนิยาย
                </button>
              </>
            )}

          </div>

        </div>

        <HomeHeroDecoration />

      </section>


      {/* =================================
          GUEST
      ================================= */}

      {isGuest ? (
        <>
          {guestStoryList.length > 0 ? (
            <section className="story-section">

              <div className="section-header">

                <HomeSectionHeading
                  icon="compass"
                  eyebrow="DISCOVER NEW WORLDS"
                  title="เรื่องราวจากนักเขียนใน GonnaTales"
                />

                <button
                  type="button"
                  className="section-link"
                  onClick={onGoToDiscover}
                >
                  ดูทั้งหมด →
                </button>

              </div>

              <div className="story-grid">

                {guestStoryList.map(
                  (story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={onSelectStory}
                      onFavoriteChange={
                        onFavoriteChange
                      }
                      branchFrom="home"
                    />
                  )
                )}

              </div>

            </section>
          ) : (
            <EmptyStories
              isGuest={true}
              onGoToDiscover={onGoToDiscover}
            />
          )}
        </>
      ) : (

        <>
          {/* =================================
              CONTINUE READING
          ================================= */}

          {continueReadingList.length > 0 && (
            <section className="story-section">

              <div className="section-header">

                <HomeSectionHeading
                  icon="book"
                  eyebrow="CONTINUE READING"
                  title="อ่านต่อจากที่ค้างไว้"
                />

              </div>

              <div className="story-grid">

                {continueReadingList.map(
                  (story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={onSelectStory}
                      onFavoriteChange={
                        onFavoriteChange
                      }
                      showProgress
                      branchFrom="home"
                    />
                  )
                )}

              </div>

            </section>
          )}


          {/* =================================
              FAVORITES
          ================================= */}

          {favoriteList.length > 0 && (
            <section className="story-section">

              <div className="section-header">

                <HomeSectionHeading
                  icon="star"
                  eyebrow="YOUR FAVORITES"
                  title="เรื่องโปรดของคุณ"
                />

              </div>

              <div className="story-grid">

                {favoriteList.map(
                  (story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={onSelectStory}
                      onFavoriteChange={
                        onFavoriteChange
                      }
                      branchFrom="home"
                    />
                  )
                )}

              </div>

            </section>
          )}


          {/* =================================
              DISCOVER
          ================================= */}

          {discoverList.length > 0 && (
            <section className="story-section">

              <div className="section-header">

                <HomeSectionHeading
                  icon="compass"
                  eyebrow="DISCOVER MORE"
                  title="ค้นพบเรื่องราวเพิ่มเติม"
                />

                <button
                  type="button"
                  className="section-link"
                  onClick={onGoToDiscover}
                >
                  ดูทั้งหมด →
                </button>

              </div>

              <div className="story-grid">

                {discoverList.map(
                  (story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={onSelectStory}
                      onFavoriteChange={
                        onFavoriteChange
                      }
                      branchFrom="home"
                    />
                  )
                )}

              </div>

            </section>
          )}


          {/* =================================
              NO STORIES
          ================================= */}

          {stories.length === 0 && (
            <EmptyStories
              isGuest={false}
              onGoToDiscover={onGoToDiscover}
            />
          )}

        </>
      )}


      {/* =================================
          QUOTE
      ================================= */}

      <div className="quote-banner">

        <p className="quote-text">
          "A reader lives a thousand lives
          before he dies. The man who never
          reads lives only one."
        </p>

        <span className="quote-author">
          — George R.R. Martin
        </span>

      </div>

    </div>
  );
};