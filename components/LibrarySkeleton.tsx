'use client';

import React from 'react';

/*
 * =========================================
 * Skeleton Line
 * =========================================
 */

const SkeletonLine = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div
      className={`library-skeleton-line ${className}`}
    />
  );
};


/*
 * =========================================
 * Skeleton Card
 * =========================================
 */

const SkeletonCard = () => {
  return (
    <div className="library-skeleton-card">

      <div className="library-skeleton-cover">
        <div className="library-skeleton-shimmer" />
      </div>

      <div className="library-skeleton-card-content">
        <SkeletonLine className="library-skeleton-title" />
        <SkeletonLine className="library-skeleton-author" />
        <SkeletonLine className="library-skeleton-meta" />
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
    <div className="library-skeleton-grid">
      {Array.from(
        { length: count },
        (_, index) => (
          <SkeletonCard key={index} />
        )
      )}
    </div>
  );
};


/*
 * =========================================
 * Hero Decoration Skeleton
 * =========================================
 */

const HeroDecorationSkeleton = () => {
  return (
    <div
      className="library-skeleton-hero-decoration"
      aria-hidden="true"
    >
      <div className="library-skeleton-hero-orbit orbit-one" />
      <div className="library-skeleton-hero-orbit orbit-two" />

      <div className="library-skeleton-hero-icon">
        <div className="library-skeleton-hero-icon-inner" />
      </div>

      <div className="library-skeleton-hero-star star-one" />
      <div className="library-skeleton-hero-star star-two" />

      <div className="library-skeleton-hero-caption">
        <SkeletonLine />
        <SkeletonLine />
      </div>
    </div>
  );
};


/*
 * =========================================
 * Section Header Skeleton
 * =========================================
 */

const SectionHeaderSkeleton = ({
  showLink = true,
}: {
  showLink?: boolean;
}) => {
  return (
    <div className="library-skeleton-section-header">

      <div className="library-skeleton-section-heading">

        <div className="library-skeleton-section-icon" />

        <div>
          <SkeletonLine className="section-small" />
          <SkeletonLine className="section-title" />
        </div>

      </div>

      {showLink && (
        <SkeletonLine className="section-link" />
      )}

    </div>
  );
};


/*
 * =========================================
 * Library Skeleton
 * =========================================
 */

export default function LibrarySkeleton() {
  return (
    <div className="library-loading-page">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="library-skeleton-hero">

        <div className="library-skeleton-hero-content">

          <SkeletonLine className="hero-small" />

          <SkeletonLine className="hero-title" />
          <SkeletonLine className="hero-title short" />

          <SkeletonLine className="hero-description" />
          <SkeletonLine className="hero-description short" />

          <div className="library-skeleton-buttons">
            <SkeletonLine className="hero-button" />
            <SkeletonLine className="hero-button secondary" />
          </div>

        </div>

        <HeroDecorationSkeleton />

      </section>


      {/* =========================================
          SECTION 1
      ========================================= */}

      <section className="library-skeleton-section">

        <SectionHeaderSkeleton showLink />

        <SkeletonGrid count={6} />

      </section>


      {/* =========================================
          SECTION 2
      ========================================= */}

      <section className="library-skeleton-section">

        <SectionHeaderSkeleton showLink={false} />

        <SkeletonGrid count={6} />

      </section>


      {/* =========================================
          SECTION 3
      ========================================= */}

      <section className="library-skeleton-section">

        <SectionHeaderSkeleton showLink />

        <SkeletonGrid count={6} />

      </section>

    </div>
  );
}