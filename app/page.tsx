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

import WelcomeGuideModal from '../components/WelcomeGuideModal';
import LoginRequiredModal from '../components/LoginRequiredModal';

import { useRouter } from 'next/navigation';

import '@/styles/story-login.css';

import { createSupabaseClient } from '@/lib/supabaseClient';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

import { LibraryView } from '@/components/LibraryView';

export default function HomePage() {
  const { user, isLoaded } = useUser();

  const { session } = useSession();

  const { openSignIn } = useClerk();

  const router = useRouter();

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

  const [showWelcomeGuide, setShowWelcomeGuide] =
    useState(false);

  const [showLoginRequired, setShowLoginRequired] =
    useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setShowWelcomeGuide(false);
      return;
    }

    if (!session) {
      return;
    }

    const checkGuideStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_seen_guide')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error(
            'Check Guide Status Error:',
            error
          );
          return;
        }

        if (!data) {
          return;
        }

        setShowWelcomeGuide(
          data.has_seen_guide === false
        );
      } catch (error) {
        console.error(
          'Guide Status Error:',
          error
        );
      }
    };

    checkGuideStatus();
  }, [
    user,
    isLoaded,
    session,
    supabase,
  ]);

  const handleWelcomeGuideClose =
    async () => {
      setShowWelcomeGuide(false);

      if (!user) {
        return;
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            has_seen_guide: true,
          })
          .eq('user_id', user.id);

        if (error) {
          console.error(
            'Update Guide Status Error:',
            error
          );
        }
      } catch (error) {
        console.error(
          'Guide Status Error:',
          error
        );
      }
    };

  useEffect(() => {
    if (!isLoaded) return;

    if (user && !session) {
      return;
    }

    const loadStories =
      async () => {
        setIsLoading(true);

        try {
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
              'Public Stories API Error:',
              storyResult.error
            );

            setStories([]);
            return;
          }

          const allStoryData =
            storyResult.stories ?? [];

          const storyData =
            allStoryData.slice(
              0,
              user ? 100 : 8
            );

          if (
            storyData.length === 0
          ) {
            setStories([]);
            return;
          }

          const storyIds =
            storyData.map(
              (story: {
                id: string;
              }) =>
                story.id
            );

          const {
            data: chapterData,
            error: chapterError,
          } =
            await supabase
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
              'Supabase Chapter Error:',
              chapterError
            );

            setStories([]);
            return;
          }

          const chapters =
            chapterData || [];

          let sessions: {
            story_id: string;
            current_chapter: number;
            status: string;
          }[] = [];

          let favoriteStoryIds: string[] =
            [];

          let creatorMap: Record<
            string,
            string
          > = {};

          if (user) {
            const {
              data: sessionData,
              error: sessionError,
            } =
              await supabase
                .from(
                  'game_sessions'
                )
                .select(
                  'story_id, current_chapter, status'
                )
                .eq(
                  'user_id',
                  user.id
                );

            if (sessionError) {
              console.error(
                'Supabase Session Error:',
                sessionError
              );
            }

            sessions =
              sessionData || [];

            try {
              const favoriteResponse =
                await fetch(
                  '/api/favorites',
                  {
                    cache:
                      'no-store',
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
                    cache:
                      'no-store',
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

                const userSession =
                  user
                    ? sessions.find(
                      (session) =>
                        session.story_id ===
                        story.id
                    )
                    : undefined;

                const currentChapter =
                  userSession?.current_chapter ||
                  0;

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
                    creatorMap[
                    story.id
                    ] ||
                    'ไม่ระบุชื่อ',

                  totalChapters:
                    story.total_chapters ||
                    0,

                  currentChapter,

                  wordCount,

                  chapters:
                    storyChapters,

                  isFavorite:
                    user
                      ? favoriteStoryIds.includes(
                        story.id
                      )
                      : false,

                  isFresh,

                  isTrending:
                    false,

                  isPublished:
                    story.is_published ??
                    false,
                };
              }
            );

          setStories(
            mappedStories
          );
        } catch (error) {
          console.error(
            'Load stories error:',
            error
          );

          setStories([]);
        } finally {
          setIsLoading(
            false
          );
        }
      };

    loadStories();
  }, [
    user,
    isLoaded,
    session,
    supabase,
  ]);

  const handleFavoriteChange = (
    storyId: string,
    isFavorite: boolean
  ) => {
    setStories(
      (prevStories) =>
        prevStories.map(
          (story) =>
            story.id ===
              storyId
              ? {
                ...story,
                isFavorite,
              }
              : story
        )
    );
  };

  const handleSelectStory = (
    storyId: string
  ) => {
    if (!user) {
      setShowLoginRequired(true);
      return;
    }

    router.push(
      `/story/${storyId}`
    );
  };

  const handleCreateStory =
    () => {
      if (!user) {
        setShowLoginRequired(true);
        return;
      }

      sessionStorage.removeItem(
        'GonnaTales_create_story_draft'
      );

      router.push(
        '/story/create'
      );
    };

  return (
    <>
      <LibraryView
        stories={stories}
        isLoading={
          !isLoaded ||
          isLoading
        }
        isGuest={!user}
        onSelectStory={
          handleSelectStory
        }
        onOpenCreateModal={
          handleCreateStory
        }
        onGoToDiscover={() => {
          router.push(
            '/discover'
          );
        }}
        onFavoriteChange={
          handleFavoriteChange
        }
      />

      <WelcomeGuideModal
        isOpen={
          showWelcomeGuide
        }
        onClose={
          handleWelcomeGuideClose
        }
      />
      <LoginRequiredModal
        isOpen={showLoginRequired}
        onClose={() =>
          setShowLoginRequired(false)
        }
      />
    </>
  );
}