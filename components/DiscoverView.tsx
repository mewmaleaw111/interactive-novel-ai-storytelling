'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Story,
  Genre,
} from '../types/story';

import { StoryCard } from './StoryCard';

import DiscoverSkeleton from '@/components/DiscoverSkeleton';

interface DiscoverViewProps {
  stories: Story[];
  isLoading?: boolean;
  onSelectStory: (id: string) => void;
}

const CATEGORIES: ('ทั้งหมด' | Genre)[] = [
  'ทั้งหมด',
  'แฟนตาซี',
  'โรแมนติก',
  'สืบสวนสอบสวน',
  'ไซไฟ',
  'ประวัติศาสตร์',
  'สยองขวัญ',
  'ดราม่า',
  'แอ็กชัน',
  'ผจญภัย',
];

export const DiscoverView: React.FC<
  DiscoverViewProps
> = ({
  stories,
  isLoading = false,
  onSelectStory,
}) => {
    const [
      selectedCategory,
      setSelectedCategory,
    ] = useState<string>('ทั้งหมด');

    const [
      searchQuery,
      setSearchQuery,
    ] = useState('');

    const [
      isCategoryOpen,
      setIsCategoryOpen,
    ] = useState(false);

    const dropdownRef =
      useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (
        event: MouseEvent
      ) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(
            event.target as Node
          )
        ) {
          setIsCategoryOpen(false);
        }
      };

      document.addEventListener(
        'mousedown',
        handleClickOutside
      );

      return () => {
        document.removeEventListener(
          'mousedown',
          handleClickOutside
        );
      };
    }, []);

    const filteredStories =
      stories.filter((story) => {
        const matchesCategory =
          selectedCategory === 'ทั้งหมด' ||
          story.genre === selectedCategory;

        const matchesSearch =
          story.title
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            ) ||
          story.corePremise
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            );

        return (
          matchesCategory &&
          matchesSearch
        );
      });

    // ==========================================
    // FULL PAGE LOADING
    // ==========================================

    if (isLoading) {
      return <DiscoverSkeleton />;
    }

    return (
      <div className="view-container">

        {/* ======================================
          TITLE & SEARCH BAR
      ======================================= */}

        <div className="discover-header">

          <div className="discover-title">

            <span className="discover-eyebrow">
              ค้นพบโลกใบใหม่
            </span>

            <h1 className="discover-main-title">
              Discover Stories
            </h1>

          </div>

          <div className="search-input-wrapper">

            <span
              className="search-icon"
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
                  r="7"
                />

                <path d="m20 20-4-4" />
              </svg>
            </span>

            <input
              type="text"
              placeholder="ค้นหาชื่อเรื่อง..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
            />

          </div>

        </div>


        {/* ======================================
          DESKTOP - CATEGORY PILLS
      ======================================= */}

        <div className="category-scroll">

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cat-pill ${selectedCategory === cat
                  ? 'active'
                  : ''
                }`}
              onClick={() =>
                setSelectedCategory(cat)
              }
            >
              {cat}
            </button>
          ))}

        </div>


        {/* ======================================
          MOBILE - CUSTOM CATEGORY DROPDOWN
      ======================================= */}

        <div className="discover-filters">

          <div
            className="filter-group"
            ref={dropdownRef}
          >

            <label>
              หมวดหมู่
            </label>

            <button
              type="button"
              className={`category-select ${isCategoryOpen
                  ? 'open'
                  : ''
                }`}
              onClick={() =>
                setIsCategoryOpen(
                  (prev) => !prev
                )
              }
              aria-expanded={
                isCategoryOpen
              }
            >

              <span>
                {selectedCategory}
              </span>

              <span
                className={`category-arrow ${isCategoryOpen
                    ? 'open'
                    : ''
                  }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>

            </button>

            {isCategoryOpen && (
              <div className="category-menu">

                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-option ${selectedCategory === cat
                        ? 'selected'
                        : ''
                      }`}
                    onClick={() => {
                      setSelectedCategory(
                        cat
                      );

                      setIsCategoryOpen(
                        false
                      );
                    }}
                  >

                    <span>
                      {cat}
                    </span>

                    {selectedCategory ===
                      cat && (
                        <span className="category-check">
                          ✓
                        </span>
                      )}

                  </button>
                ))}

              </div>
            )}

          </div>

        </div>


        {/* ======================================
          STORIES GRID
      ======================================= */}

        <div className="story-grid">

          {filteredStories.map(
            (story) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={
                  onSelectStory
                }
                branchFrom="discover"
              />
            )
          )}

        </div>

      </div>
    );
  };