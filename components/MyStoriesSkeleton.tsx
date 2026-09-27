'use client';

import React from 'react';

const MyStorySkeletonItem = () => {
  return (
    <div className="my-story-item my-story-skeleton-item">
      {/* ==========================================
          COVER
      ========================================== */}
      <div className="my-story-cover-wrapper">
        <div className="my-story-cover-skeleton">
          <div className="my-story-cover-shimmer" />
        </div>
      </div>

      {/* ==========================================
          STORY DETAILS
      ========================================== */}
      <div className="my-story-details">
        {/* Title + Genre */}
        <div className="my-story-top">
          <div className="my-story-skeleton-title" />
          <div className="my-story-skeleton-genre" />
        </div>

        {/* Premise */}
        <div className="my-story-skeleton-premise">
          <span />
          <span />
          <span />
        </div>

        {/* Meta */}
        <div className="my-story-skeleton-meta">
          <span />
          <span />
          <span />
        </div>

        {/* Progress */}
        <div className="my-story-skeleton-progress">
          <div className="my-story-skeleton-progress-top">
            <div className="my-story-skeleton-progress-text" />
            <div className="my-story-skeleton-progress-percent" />
          </div>

          <div className="my-story-skeleton-progress-bg">
            <div className="my-story-skeleton-progress-fill" />
          </div>
        </div>
      </div>

      {/* ==========================================
          ACTIONS
      ========================================== */}
      <div className="my-story-action">
        <div className="my-story-skeleton-actions">
          <div className="my-story-skeleton-action continue" />
          <div className="my-story-skeleton-action edit" />
          <div className="my-story-skeleton-action publish" />
          <div className="my-story-skeleton-action delete" />
        </div>
      </div>
    </div>
  );
};

export default function MyStoriesSkeleton() {
  return (
    <div className="view-container my-stories-skeleton-page">

      {/* ==========================================
          HEADER
      ========================================== */}
      <div className="mystories-header">
        <div>
          <div className="my-story-skeleton-subtitle" />

          <div className="my-story-skeleton-main-title" />

          <div className="my-story-skeleton-description" />
        </div>

        <div className="my-story-skeleton-create-button" />
      </div>

      {/* ==========================================
          STATS
      ========================================== */}
      <div className="author-stats-banner my-story-skeleton-stats">

        {/* Stat 1 */}
        <div className="stat-box">
          <div className="my-story-skeleton-stat-icon" />
          <div className="my-story-skeleton-stat-value" />
          <div className="my-story-skeleton-stat-label" />
        </div>

        {/* Stat 2 */}
        <div className="stat-box">
          <div className="my-story-skeleton-stat-icon" />
          <div className="my-story-skeleton-stat-value short" />
          <div className="my-story-skeleton-stat-label" />
        </div>

        {/* Stat 3 */}
        <div className="stat-box">
          <div className="my-story-skeleton-stat-icon" />
          <div className="my-story-skeleton-stat-value short" />
          <div className="my-story-skeleton-stat-label" />
        </div>

      </div>

      {/* ==========================================
          STORY LIST
      ========================================== */}
      <div className="my-stories-list">

        <MyStorySkeletonItem />

        <MyStorySkeletonItem />

      </div>
    </div>
  );
}