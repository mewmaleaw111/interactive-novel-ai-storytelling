'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSession } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { StoryCard } from '@/components/StoryCard';
import { createSupabaseClient } from '@/lib/supabaseClient';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

import '@/styles/favorites.css';

export default function FavoritesPage() {
  const router = useRouter();

  const { session } =
    useSession();

  const supabase = useMemo(
    () =>
      createSupabaseClient(
        () =>
          session?.getToken() ??
          Promise.resolve(null)
      ),
    [session]
  );

  const [stories, setStories] =
    useState<Story[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  // ==========================================
  // LOAD FAVORITES
  // ==========================================
  useEffect(() => {
    if (!session) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    const loadFavorites =
      async () => {
        setIsLoading(true);

        try {
          // ==========================================
          // LOAD FAVORITE STORY IDS
          // ==========================================
          const favoriteResponse =
            await fetch(
              '/api/favorites',
              {
                cache: 'no-store',
              }
            );

          const favoriteData =
            await favoriteResponse.json();

          if (
            !favoriteResponse.ok ||
            !favoriteData.success
          ) {
            setStories([]);
            return;
          }

          const favoriteStoryIds: string[] =
            favoriteData.favoriteStoryIds ||
            [];

          // ==========================================
          // NO FAVORITES
          // ==========================================
          if (
            favoriteStoryIds.length ===
            0
          ) {
            setStories([]);
            return;
          }

          // ==========================================
          // LOAD STORIES
          // ==========================================
          const {
            data: storyData,
            error: storyError,
          } = await supabase
            .from('stories')
            .select('*')
            .in(
              'id',
              favoriteStoryIds
            )
            .eq(
              'is_banned',
              false
            )
            .order(
              'created_at',
              {
                ascending: false,
              }
            );

          if (storyError) {
            console.error(
              'Favorite Stories Error:',
              storyError
            );

            setStories([]);
            return;
          }

          if (
            !storyData ||
            storyData.length === 0
          ) {
            setStories([]);
            return;
          }

          // ==========================================
          // STORY IDS
          // ==========================================
          const storyIds =
            storyData.map(
              (story) =>
                story.id
            );

          // ==========================================
          // LOAD CHAPTERS
          // ==========================================
          const {
            data: chapterData,
            error: chapterError,
          } = await supabase
            .from('chapters')
            .select('*')
            .in(
              'story_id',
              storyIds
            )
            .order(
              'chapter_number',
              {
                ascending: true,
              }
            );

          if (chapterError) {
            console.error(
              'Favorite Chapters Error:',
              chapterError
            );

            setStories([]);
            return;
          }

          const chapters =
            chapterData || [];

          // ==========================================
          // MAP SUPABASE DATA → STORY TYPE
          // ==========================================
          const mappedStories: Story[] =
            storyData.map(
              (story) => {
                const storyChapters: Chapter[] =
                  chapters
                    .filter(
                      (chapter) =>
                        chapter.story_id ===
                        story.id
                    )
                    .map(
                      (chapter) => ({
                        id:
                          chapter.id,

                        chapterNumber:
                          chapter.chapter_number,

                        title:
                          chapter.title ||
                          `บทที่ ${chapter.chapter_number}`,

                        content:
                          chapter.content ||
                          '',

                        createdAt:
                          chapter.created_at,
                      })
                    );

                // ==========================================
                // CURRENT CHAPTER
                // ==========================================
                const currentChapter =
                  storyChapters.length >
                  0
                    ? storyChapters[
                        storyChapters.length -
                          1
                      ]
                        .chapterNumber
                    : 0;

                // ==========================================
                // WORD COUNT
                // ==========================================
                const wordCount =
                  storyChapters.reduce(
                    (
                      total,
                      chapter
                    ) =>
                      total +
                      chapter.content
                        .length,
                    0
                  );

                // ==========================================
                // RETURN STORY
                // ==========================================
                return {
                  id:
                    story.id,

                  title:
                    story.title ||
                    'นิยายไม่มีชื่อ',

                  corePremise:
                    story.synopsis ||
                    '',

                  genre:
                    (story.genre ||
                      'แฟนตาซี') as Genre,

                  tone:
                    (story.tone ||
                      'มืดมนและสมจริง') as NarrativeTone,

                  length:
                    story.total_chapters <=
                    5
                      ? 'เรื่องสั้น'
                      : story.total_chapters <=
                          15
                        ? 'นวนิยายขนาดกลาง'
                        : 'นวนิยายยาว',

                  protagonist:
                    '',

                  worldSetting:
                    '',

                  coverUrl:
                    story.cover_image_url ||
                    '',

                  author:
                    'นักเขียน',

                  totalChapters:
                    story.total_chapters ||
                    0,

                  currentChapter,

                  wordCount,

                  isFavorite:
                    true,

                  isTrending:
                    false,

                  isFresh:
                    false,

                  isBanned:
                    story.is_banned ??
                    false,

                  isPublished:
                    story.is_published ??
                    false,

                  chapters:
                    storyChapters,
                };
              }
            );

          setStories(
            mappedStories
          );
        } catch (error) {
          console.error(
            'Favorites Load Error:',
            error
          );

          setStories([]);
        } finally {
          setIsLoading(false);
        }
      };

    loadFavorites();
  }, [
    session,
    supabase,
  ]);

  // ==========================================
  // FAVORITE CHANGE
  // ==========================================
  const handleFavoriteChange = (
    storyId: string,
    isFavorite: boolean
  ) => {
    if (!isFavorite) {
      setStories(
        (currentStories) =>
          currentStories.filter(
            (story) =>
              story.id !==
              storyId
          )
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (isLoading) {
    return (
      <main className="favorites-page">
        <div className="favorites-container">
          <div className="favorites-loading">
            กำลังโหลดเรื่องโปรด...
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <main className="favorites-page">
      <div className="favorites-container">

        {/* Back to Profile */}
        <button
          type="button"
          className="favorites-back-button"
          onClick={() =>
            router.push(
              '/profile'
            )
          }
        >
          ‹ กลับสู่โปรไฟล์
        </button>

        {/* Header */}
        <header className="favorites-header">
          <div className="favorites-heading">
            <span className="favorites-eyebrow">
              เรื่องราวที่คุณเลือกเก็บไว้
            </span>

            <h1>
              เรื่องโปรด
            </h1>

            <p>
              รวมเรื่องที่คุณบันทึกไว้
              สำหรับกลับมาอ่านต่อเมื่อไหร่ก็ได้
            </p>
          </div>

          <div className="favorites-count">
            <strong>
              {stories.length}
            </strong>

            <span>
              เรื่องที่บันทึกไว้
            </span>
          </div>
        </header>

        {/* Divider */}
        <div className="favorites-divider" />

        {/* Empty */}
        {stories.length ===
        0 ? (
          <section className="favorites-empty">
            <div className="favorites-empty-line" />

            <span className="favorites-empty-label">
              YOUR LIBRARY
            </span>

            <h2>
              ยังไม่มีเรื่องโปรด
            </h2>

            <p>
              เมื่อคุณพบเรื่องที่ชอบ
              กดดาวเพื่อบันทึกไว้ที่นี่
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/discover'
                )
              }
            >
              ไปสำรวจนิยาย
            </button>
          </section>
        ) : (
          <section className="favorites-list-section">

            {/* List Header */}
            <div className="favorites-list-header">
              <div>
                <h2>
                  เรื่องโปรดของคุณ
                </h2>

                <p>
                  เรื่องที่คุณเลือกเก็บไว้สำหรับอ่าน
                </p>
              </div>

              <button
                type="button"
                className="favorites-discover-button"
                onClick={() =>
                  router.push(
                    '/discover'
                  )
                }
              >
                ค้นหาเรื่องอื่น
              </button>
            </div>

            {/* Story Grid */}
            <div className="favorites-story-grid">
              {stories.map(
                (story) => (
                  <StoryCard
                    key={
                      story.id
                    }
                    story={
                      story
                    }
                    onClick={(
                      id
                    ) =>
                      router.push(
                        `/story/${id}`
                      )
                    }
                    onFavoriteChange={
                      handleFavoriteChange
                    }
                  />
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}