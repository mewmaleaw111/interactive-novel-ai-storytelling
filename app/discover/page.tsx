'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useClerk,
  useSession,
  useUser,
} from '@clerk/nextjs';

import { useRouter } from 'next/navigation';

import { DiscoverView } from '@/components/DiscoverView';
import { createSupabaseClient } from '@/lib/supabaseClient';

import type {
  Story,
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

  const { openSignIn } = useClerk();

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

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const loadStories = async () => {
      setIsLoading(true);

      try {
        let favoriteStoryIds: string[] = [];

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
        }

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

        const mappedStories: Story[] =
          storyData.map(
            (story: any) => {
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
                  'นักเขียน',

                totalChapters:
                  story.total_chapters ||
                  0,

                currentChapter:
                  0,

                wordCount:
                  0,

                chapters:
                  [],

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
    user,
    supabase,
  ]);

  const handleSelectStory = (
    id: string
  ) => {
    /*
     * ยังไม่ได้ Login
     * เปิด Login Modal แต่ไม่เปลี่ยนหน้า
     */
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    /*
     * Login แล้ว
     * เข้าอ่านนิยายได้ตามปกติ
     */
    router.push(
      `/story/${id}?from=discover`
    );
  };

  return (
    <DiscoverView
      stories={stories}
      isLoading={isLoading}
      onSelectStory={
        handleSelectStory
      }
    />
  );
}