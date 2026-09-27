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

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { createSupabaseClient } from '@/lib/supabaseClient';

import { ReaderView } from '@/components/ReaderView';

import {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

/* =========================================================
   Loading Skeleton
========================================================= */
function StoryDetailLoading() {
  return (
    <div className="reader-loading">
      <div className="reader-loading-content">

        {/* Header */}
        <header className="reader-header story-reader-header">
          <div className="story-reader-header-inner">
            <div className="reader-loading-back" />

            <div className="reader-loading-header-actions">
              <div className="reader-loading-branch" />

              <div className="reader-loading-font">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </header>

        {/* Reader */}
        <main className="reader-content">

          {/* Story Meta */}
          <div className="story-meta-banner">

            <div className="reader-loading-title" />

            <div className="reader-loading-badges">
              <span />
              <span />
            </div>

            <div className="reader-loading-premise">
              <span />
              <span />
            </div>

            <div className="reader-loading-author" />

            <div className="reader-loading-counter" />

          </div>

          {/* Chapter */}
          <article className="chapter-block">

            <div className="chapter-heading">
              <div className="reader-loading-chapter-number" />

              <div className="reader-loading-chapter-title" />
            </div>

            <div className="chapter-text">
              <div className="reader-loading-lines">
                <span />
                <span />
                <span />
                <span />
                <span />

                <span />
                <span />
                <span />
                <span />

                <span />
                <span />
                <span />
              </div>
            </div>

          </article>

          {/* Navigation */}
          <div className="chapter-navigation">
            <div className="reader-loading-nav-button" />

            <div className="reader-loading-nav-counter" />

            <div className="reader-loading-nav-button" />
          </div>

        </main>

        {/* Bottom Interaction */}
        <div className="reader-interactive-bar">
          <div className="interactive-container">

            <div className="reader-loading-interactive-label" />

            <div className="reader-loading-input-group">
              <div className="reader-loading-input" />
              <div className="reader-loading-submit" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();

  const { user, isLoaded } = useUser();
  const { session } = useSession();
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

  const rawId = params?.id;

  const storyId = Array.isArray(rawId)
    ? rawId[0]
    : rawId;

  const [story, setStory] =
    useState<Story | null>(null);

  const [sessionId, setSessionId] =
    useState<string | null>(null);

  const [
    sessionCharacters,
    setSessionCharacters,
  ] = useState<any[]>([]);

  const [
    sessionRelationships,
    setSessionRelationships,
  ] = useState<any[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  /* =========================
     Open Login
  ========================= */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      openSignIn();
    }
  }, [
    isLoaded,
    user,
    openSignIn,
  ]);

  /* =========================
     Load Story
  ========================= */

  useEffect(() => {
    if (!isLoaded || !session) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    if (!storyId) {
      console.error(
        'Story ID is missing'
      );

      setIsLoading(false);
      return;
    }

    const loadStory = async () => {
      try {
        /* =========================
           Load Story
        ========================= */

        const {
          data: storyData,
          error: storyError,
        } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .maybeSingle();

        if (storyError) {
          console.error(
            'Error loading story:',
            storyError
          );

          return;
        }

        if (!storyData) {
          console.error(
            'Story not found'
          );

          return;
        }

        /* =========================
           Check Story Visibility
        ========================= */

        const isOwner =
          storyData.user_id === user.id;

        const isPublished =
          storyData.is_published === true;

        console.log(
          'Story Published:',
          isPublished
        );

        console.log(
          'Story Owner:',
          storyData.user_id
        );

        console.log(
          'Current User:',
          user.id
        );

        console.log(
          'Is Owner:',
          isOwner
        );

        if (!isOwner && !isPublished) {
          console.warn(
            'Access denied: story is not published'
          );

          setStory(null);
          return;
        }

        /* =========================
           Load Creator Username
        ========================= */

        let creatorName =
          'ไม่ระบุชื่อ';

        try {
          const creatorResponse =
            await fetch(
              `/api/stories/${storyId}/creator`,
              {
                cache: 'no-store',
              }
            );

          const creatorData =
            await creatorResponse.json();

          if (
            creatorResponse.ok &&
            creatorData.success &&
            typeof creatorData.creatorName ===
              'string' &&
            creatorData.creatorName.trim()
          ) {
            creatorName =
              creatorData.creatorName.trim();
          }
        } catch (error) {
          console.error(
            'Error loading creator username:',
            error
          );
        }

        console.log(
          'Story creator username:',
          creatorName
        );

        /* =========================
           Load Shared Chapters
        ========================= */

        const {
          data: chapterData,
          error: chapterError,
        } = await supabase
          .from('chapters')
          .select(`
            id,
            story_id,
            chapter_number,
            title,
            content,
            created_at
          `)
          .eq(
            'story_id',
            storyId
          )
          .order(
            'chapter_number',
            {
              ascending: true,
            }
          );

        if (chapterError) {
          console.error(
            'Error loading chapters:',
            chapterError
          );

          return;
        }

        const sharedChapters: Chapter[] =
          (
            chapterData || []
          ).map(
            (chapter) => ({
              id: chapter.id,

              chapterNumber:
                chapter.chapter_number,

              title:
                chapter.title ||
                `บทที่ ${chapter.chapter_number}`,

              content:
                chapter.content,

              createdAt:
                chapter.created_at,
            })
          );

        const latestSharedChapter =
          sharedChapters.length > 0
            ? Math.max(
                ...sharedChapters.map(
                  (chapter) =>
                    chapter.chapterNumber
                )
              )
            : 1;

        /* =========================
           Load / Create Game Session
        ========================= */

        const {
          data: existingSession,
          error: sessionError,
        } = await supabase
          .from('game_sessions')
          .select(`
            id,
            user_id,
            story_id,
            current_chapter,
            status,
            current_inventory,
            is_public
          `)
          .eq(
            'user_id',
            user.id
          )
          .eq(
            'story_id',
            storyId
          )
          .maybeSingle();

        if (sessionError) {
          console.error(
            'Error loading game session:',
            sessionError
          );

          return;
        }

        let currentSession =
          existingSession;

        /* =========================
           Create New Session
        ========================= */

        if (!currentSession) {
          const {
            data: newSession,
            error:
              createSessionError,
          } = await supabase
            .from('game_sessions')
            .insert({
              user_id:
                user.id,

              story_id:
                storyId,

              current_chapter:
                latestSharedChapter,

              status:
                'in_progress',

              current_inventory:
                [],

              is_public:
                false,
            })
            .select(`
              id,
              user_id,
              story_id,
              current_chapter,
              status,
              current_inventory,
              is_public
            `)
            .single();

          if (
            createSessionError
          ) {
            if (
              createSessionError.code ===
              '23505'
            ) {
              console.log(
                'Session already exists, loading existing session...'
              );

              const {
                data:
                  existingSessionAfterConflict,
                error:
                  reloadSessionError,
              } = await supabase
                .from(
                  'game_sessions'
                )
                .select(`
                  id,
                  user_id,
                  story_id,
                  current_chapter,
                  status,
                  current_inventory,
                  is_public
                `)
                .eq(
                  'user_id',
                  user.id
                )
                .eq(
                  'story_id',
                  storyId
                )
                .maybeSingle();

              if (
                reloadSessionError
              ) {
                console.error(
                  'Error reloading existing game session:',
                  reloadSessionError
                );

                return;
              }

              if (
                !existingSessionAfterConflict
              ) {
                console.error(
                  'Game session conflict occurred but existing session was not found'
                );

                return;
              }

              currentSession =
                existingSessionAfterConflict;

              console.log(
                'Using existing game session after conflict:',
                currentSession.id
              );
            } else {
              console.error(
                'Error creating game session:',
                createSessionError
              );

              return;
            }
          } else {
            if (!newSession) {
              console.error(
                'Game session was not created'
              );

              return;
            }

            currentSession =
              newSession;

            console.log(
              'Game session created:',
              newSession.id
            );
          }
        }

        /* =========================
           Save Session ID
        ========================= */

        setSessionId(
          currentSession.id
        );

        console.log(
          'Using game session:',
          currentSession.id
        );

        console.log(
          'Session current chapter:',
          currentSession.current_chapter
        );

        console.log(
          'Session is public:',
          currentSession.is_public
        );

        /* =========================
           Load Session Characters
        ========================= */

        try {
          const charactersResponse =
            await fetch(
              `/api/session-characters?storyId=${encodeURIComponent(
                storyId
              )}`,
              {
                cache: 'no-store',
              }
            );

          const charactersData =
            await charactersResponse.json();

          if (
            charactersResponse.ok &&
            charactersData.success
          ) {
            const loadedCharacters =
              charactersData.characters ||
              [];

            const loadedRelationships =
              charactersData.relationships ||
              [];

            setSessionCharacters(
              loadedCharacters
            );

            setSessionRelationships(
              loadedRelationships
            );

            console.log(
              'Session Characters:',
              loadedCharacters.length
            );

            console.log(
              'Session Relationships:',
              loadedRelationships.length
            );
          } else {
            console.error(
              'Error loading session characters:',
              charactersData.error
            );
          }
        } catch (error) {
          console.error(
            'Error fetching session characters:',
            error
          );
        }

        /* =========================
           Load Session Chapters
        ========================= */

        const {
          data:
            sessionChapterData,
          error:
            sessionChapterError,
        } = await supabase
          .from(
            'session_chapters'
          )
          .select(`
            id,
            session_id,
            chapter_number,
            title,
            content,
            user_choice,
            created_at
          `)
          .eq(
            'session_id',
            currentSession.id
          )
          .order(
            'chapter_number',
            {
              ascending: true,
            }
          );

        if (sessionChapterError) {
          console.error(
            'Error loading session chapters:',
            sessionChapterError
          );

          return;
        }

        const sessionChapters: Chapter[] =
          (
            sessionChapterData ||
            []
          ).map(
            (chapter) => ({
              id: chapter.id,

              chapterNumber:
                chapter.chapter_number,

              title:
                chapter.title ||
                `บทที่ ${chapter.chapter_number}`,

              content:
                chapter.content,

              userPromptChoice:
                chapter.user_choice ||
                undefined,

              createdAt:
                chapter.created_at,
            })
          );

        /* =========================
           Merge Chapters
        ========================= */

        const chapterMap =
          new Map<
            number,
            Chapter
          >();

        for (
          const chapter of
          sharedChapters
        ) {
          chapterMap.set(
            chapter.chapterNumber,
            chapter
          );
        }

        for (
          const chapter of
          sessionChapters
        ) {
          chapterMap.set(
            chapter.chapterNumber,
            chapter
          );
        }

        const chapters =
          Array.from(
            chapterMap.values()
          ).sort(
            (a, b) =>
              a.chapterNumber -
              b.chapterNumber
          );

        const latestLoadedChapter =
          chapters.length > 0
            ? chapters[
                chapters.length - 1
              ].chapterNumber
            : 1;

        const sessionCurrentChapter =
          Number(
            currentSession.current_chapter ||
              1
          );

        const currentChapter =
          Math.max(
            sessionCurrentChapter,
            latestLoadedChapter
          );

        console.log(
          'Session current chapter:',
          sessionCurrentChapter
        );

        console.log(
          'Latest loaded chapter:',
          latestLoadedChapter
        );

        console.log(
          'Final current chapter:',
          currentChapter
        );

        /* =========================
           Sync Session Chapter
        ========================= */

        if (
          currentChapter >
          sessionCurrentChapter
        ) {
          const {
            error:
              updateSessionError,
          } = await supabase
            .from(
              'game_sessions'
            )
            .update({
              current_chapter:
                currentChapter,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              currentSession.id
            );

          if (updateSessionError) {
            console.error(
              'Error syncing game session:',
              updateSessionError
            );
          }
        }

        /* =========================
           Build Story Object
        ========================= */

        const totalChapters =
          storyData.total_chapters ||
          5;

        const loadedStory: Story = {
          id:
            storyData.id,

          title:
            storyData.title ||
            'นิยายไม่มีชื่อ',

          author:
            creatorName,

          isPublished:
            storyData.is_published ?? false,

          genre: (
            storyData.genre ||
            'แฟนตาซี'
          ) as Genre,

          tone: (
            storyData.tone ||
            'สดใสและจินตนาการ'
          ) as NarrativeTone,

          length:
            totalChapters <= 5
              ? 'เรื่องสั้น'
              : totalChapters <= 15
                ? 'นวนิยายขนาดกลาง'
                : 'นวนิยายยาว',

          corePremise:
            storyData.synopsis ||
            '',

          protagonist:
            '',

          worldSetting:
            '',

          coverUrl:
            storyData.cover_image_url ||
            '',

          totalChapters,

          currentChapter,

          wordCount:
            chapters.reduce(
              (
                total,
                chapter
              ) =>
                total +
                chapter.content.length,
              0
            ),

          isFavorite:
            storyData.is_favorite ||
            false,

          chapters,
        };

        /* =========================
           Debug Information
        ========================= */

        console.log(
          '========================================'
        );

        console.log(
          'STORY LOADED'
        );

        console.log(
          'Story ID:',
          storyId
        );

        console.log(
          'Current User ID:',
          user.id
        );

        console.log(
          'Story Owner ID:',
          storyData.user_id
        );

        console.log(
          'Story Creator Name:',
          creatorName
        );

        console.log(
          'Session ID:',
          currentSession.id
        );

        console.log(
          'Session Public:',
          currentSession.is_public
        );

        console.log(
          'Session Current Chapter:',
          sessionCurrentChapter
        );

        console.log(
          'Latest Loaded Chapter:',
          latestLoadedChapter
        );

        console.log(
          'Final Current Chapter:',
          currentChapter
        );

        console.log(
          'Shared Chapters:',
          sharedChapters.length
        );

        console.log(
          'Session Chapters:',
          sessionChapters.length
        );

        console.log(
          'Total Loaded Chapters:',
          chapters.length
        );

        console.log(
          'Session Characters:',
          sessionCharacters.length
        );

        console.log(
          'Session Relationships:',
          sessionRelationships.length
        );

        console.log(
          '========================================'
        );

        setStory(
          loadedStory
        );
      } catch (error) {
        console.error(
          'Unexpected error loading story:',
          error
        );

        console.error(
          'Story ID:',
          storyId
        );

        console.error(
          'Clerk User ID:',
          user.id
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [
    storyId,
    user,
    isLoaded,
    session,
    supabase,
  ]);

  /* =========================
     Update Story
  ========================= */

  const handleUpdateStory =
    async (
      updatedStory: Story
    ) => {
      setStory(
        updatedStory
      );

      if (
        !user ||
        !storyId
      ) {
        return;
      }

      const {
        error,
      } = await supabase
        .from(
          'game_sessions'
        )
        .update({
          current_chapter:
            updatedStory.currentChapter,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'user_id',
          user.id
        )
        .eq(
          'story_id',
          storyId
        );

      if (error) {
        console.error(
          'Error updating game session:',
          error
        );
      }
    };

  /* =========================
     Loading
  ========================= */

  if (!isLoaded || isLoading) {
    return <StoryDetailLoading />;
  }

  /* =========================
     Not Logged In
  ========================= */

  if (!user) {
    return null;
  }

  /* =========================
     Story Not Found
  ========================= */

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <h2 className="text-xl font-bold">
          ไม่พบเนื้อเรื่องที่คุณต้องการ
        </h2>

        <p className="text-sm text-gray-500">
          Story ID: {storyId}
        </p>

        <button
          type="button"
          className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800"
          onClick={() =>
            router.push('/')
          }
        >
          ย้อนกลับหน้าหลัก
        </button>
      </div>
    );
  }

  /* =========================
     Reader
  ========================= */

  return (
    <ReaderView
      story={story}
      sessionId={sessionId ?? ''}
      onBack={() =>
        router.push('/')
      }
      onUpdateStory={
        handleUpdateStory
      }
    />
  );
}