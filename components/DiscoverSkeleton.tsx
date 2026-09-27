'use client';

import React from 'react';

const SkeletonLine = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div
      className={`discover-skeleton-line ${className}`}
    />
  );
};

const SkeletonCard = () => {
  return (
    <div className="discover-skeleton-card">
      <div className="discover-skeleton-cover">
        <div className="discover-skeleton-shimmer" />
      </div>

      <div className="discover-skeleton-card-content">
        <SkeletonLine className="discover-skeleton-title" />
        <SkeletonLine className="discover-skeleton-author" />
        <SkeletonLine className="discover-skeleton-meta" />
      </div>
    </div>
  );
};

export default function DiscoverSkeleton() {
  return (
    <div className="view-container discover-loading-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="discover-loading-header">

        <div className="discover-loading-title">
          <SkeletonLine className="discover-loading-subtitle" />

          <SkeletonLine className="discover-loading-heading" />
        </div>

        <SkeletonLine className="discover-loading-search" />

      </div>


      {/* ==========================================
          CATEGORY
      ========================================== */}

      <div className="discover-loading-categories">

        {Array.from(
          { length: 7 },
          (_, index) => (
            <SkeletonLine
              key={index}
              className={`discover-loading-pill pill-${index}`}
            />
          )
        )}

      </div>


      {/* ==========================================
          STORY SECTION
      ========================================== */}

      <div className="discover-loading-section">

        <div className="discover-loading-section-header">

          <SkeletonLine className="discover-loading-section-title" />

          <SkeletonLine className="discover-loading-link" />

        </div>


        <div className="story-grid discover-loading-grid">

          {Array.from(
            { length: 8 },
            (_, index) => (
              <SkeletonCard key={index} />
            )
          )}

        </div>

      </div>

    </div>
  );
}