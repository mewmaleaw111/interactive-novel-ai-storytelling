'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useSession,
  useUser,
} from '@clerk/nextjs';

import { useRouter } from 'next/navigation';
import LoginRequiredModal from '@/components/LoginRequiredModal';

import { DiscoverView } from '@/components/DiscoverView';
import { createSupabaseClient } from '@/lib/supabaseClient';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

export default function DiscoverPage() {
  const router = useRouter();

  const { session } = useSession();

  const {
    user,
    isLoaded,
    isSignedIn,
  } = useUser();

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

  const [showLoginModal, setShowLoginModal] =
    useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // ถ้า login แล้วแต่ session ยังไม่พร้อม ให้รอก่อน
    // ไม่งั้น query chapters จะไม่มี token (เหมือนหน้าแรก)
    if (isSignedIn && !session) {
      return;
    }

    const loadStories = async () => {
      setIsLoading(true);

      try {
        // ==================================================
        // 1. โหลด Story public
        // ==================================================

        const storyResponse =
          await fetch(
            '/api/stories/public',
            {
              cache: 'no-store',
            }
          );

        const storyResult =
          await storyResponse.json();

        if (
          !storyResponse.ok ||
          !storyResult.success
        ) {
          console.error(
            'Discover Stories API Error:',
            storyResult.error
          );

          setStories([]);
          return;
        }

        const storyData =
          storyResult.stories ?? [];

        if (
          storyData.length === 0
        ) {
          setStories([]);
          return;
        }

        const storyIds: string[] =
          storyData.map(
            (story: { id: string }) =>
              story.id
          );

        // ==================================================
        // 2. โหลด Chapters จาก Supabase (ใช้นับจำนวนคำ)
        // ==================================================

        const {
          data: chapterData,
          error: chapterError,
        } = await supabase
          .from('chapters')
          .select('*')
          .in('story_id', storyIds)
          .order('chapter_number', {
            ascending: true,
          });

        if (chapterError) {
          console.error(
            'Supabase Chapter Error:',
            chapterError
          );

          setStories([]);
          return;
        }

        const chapters: any[] =
          chapterData || [];

        // ==================================================
        // 3. โหลด Favorites + ชื่อผู้แต่ง (ต้อง login)
        // ==================================================

        let favoriteStoryIds: string[] = [];

        let creatorMap: Record<
          string,
          string
        > = {};

        if (isSignedIn && user) {
          try {
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
              favoriteResponse.ok &&
              favoriteData.success
            ) {
              favoriteStoryIds =
                favoriteData.favoriteStoryIds ||
                [];
            }
          } catch (error) {
            console.error(
              'Load Favorites Error:',
              error
            );
          }

          try {
            const creatorResponse =
              await fetch(
                '/api/stories/creators',
                {
                  cache: 'no-store',
                }
              );

            const creatorData =
              await creatorResponse.json();

            if (
              creatorResponse.ok &&
              creatorData.success
            ) {
              creatorMap =
                creatorData.creators ||
                {};
            }
          } catch (error) {
            console.error(
              'Load Creators Error:',
              error
            );
          }
        }

        // ==================================================
        // 4. แปลงเป็น Story (ตรรกะเดียวกับหน้าแรก)
        // ==================================================

        const mappedStories: Story[] =
          storyData.map(
            (story: any) => {
              const storyChapters: Chapter[] =
                chapters
                  .filter(
                    (chapter) =>
                      chapter.story_id ===
                      story.id
                  )
                  .map((chapter) => ({
                    id: chapter.id,

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
                  }));

              const wordCount =
                storyChapters.reduce(
                  (total, chapter) =>
                    total +
                    chapter.content.length,
                  0
                );

              const isFresh =
                Date.now() -
                new Date(
                  story.created_at
                ).getTime() <
                7 *
                24 *
                60 *
                60 *
                1000;

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
                  story.total_chapters <= 5
                    ? 'เรื่องสั้น'
                    : story.total_chapters <= 15
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
                  creatorMap[story.id] ||
                  'ไม่ระบุชื่อ',

                totalChapters:
                  story.total_chapters ||
                  0,

                currentChapter:
                  0,

                wordCount,

                chapters:
                  storyChapters,

                isFavorite:
                  favoriteStoryIds.includes(
                    story.id
                  ),

                isPublished:
                  story.is_published ??
                  false,

                isFresh,

                isTrending:
                  false,
              };
            }
          );

        setStories(
          mappedStories
        );
      } catch (error) {
        console.error(
          'Discover Load Error:',
          error
        );

        setStories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [
    isLoaded,
    isSignedIn,
    session,
    user,
    supabase,
  ]);

  const handleSelectStory = (
    id: string
  ) => {
    if (!isSignedIn) {
      setShowLoginModal(true);
      return;
    }

    router.push(
      `/story/${id}?from=discover`
    );
  };

  return (
    <>
      <DiscoverView
        stories={stories}
        isLoading={isLoading}
        onSelectStory={
          handleSelectStory
        }
      />

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() =>
          setShowLoginModal(false)
        }
      />
    </>
  );
}