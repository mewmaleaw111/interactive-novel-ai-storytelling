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
   Mirror ReaderView DOM structure
========================================================= */
function StoryDetailLoading() {
  return (
    <div className="story-reader-page">
      <main className="story-reader-layout">

        {/* =====================================================
            MAIN READER
        ===================================================== */}
        <section className="story-reader-main">

          <article className="story-reader-article">

            {/* =================================================
                SAME HEADER POSITION AS ReaderView
            ================================================= */}
            <div className="story-reader-inner-header">

              <div className="reader-loading-back" />

              <div className="story-reader-top-actions">

                <div className="reader-loading-branch" />

                <div className="story-reader-font-controls reader-loading-font">
                  <span />
                  <span />
                  <span />
                </div>

              </div>
            </div>

            {/* =================================================
                CHAPTER HEADER
            ================================================= */}
            <div className="story-reader-chapter-header">

              <div className="story-reader-chapter-top">

                <div className="reader-loading-chapter-number" />

                <div className="story-reader-progress">

                  <div className="story-reader-progress-track">
                    <div className="reader-loading-progress" />
                  </div>

                  <span className="reader-loading-progress-text" />

                </div>

              </div>

              <div className="reader-loading-chapter-title" />

              <div className="story-reader-chapter-divider" />

            </div>

            {/* =================================================
                STORY CONTENT
            ================================================= */}
            <div className="story-reader-text font-serif">

              <div className="reader-loading-story">

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
                <span />
                <span />

              </div>

            </div>

            {/* =================================================
                CHAPTER NAVIGATION
            ================================================= */}
            <div className="story-reader-navigation">

              <div className="reader-loading-nav-button" />

              <div className="reader-loading-nav-counter" />

              <div className="reader-loading-nav-button" />

            </div>

            {/* =================================================
                CHOICE SECTION
            ================================================= */}
            <section className="story-reader-choice-section">

              <div className="story-reader-choice-heading">

                <div className="reader-loading-choice-icon" />

                <div className="reader-loading-choice-heading">

                  <div className="reader-loading-choice-title" />

                  <div className="reader-loading-choice-subtitle" />

                </div>

              </div>

              <div className="story-reader-choice-list">

                <div className="reader-loading-choice-button">
                  <span className="reader-loading-choice-number" />
                  <span className="reader-loading-choice-text" />
                </div>

                <div className="reader-loading-choice-button">
                  <span className="reader-loading-choice-number" />
                  <span className="reader-loading-choice-text" />
                </div>

                <div className="reader-loading-choice-button">
                  <span className="reader-loading-choice-number" />
                  <span className="reader-loading-choice-text" />
                </div>

              </div>

              <div className="reader-loading-choice-fallback">

                <div className="reader-loading-choice-input" />

                <div className="reader-loading-choice-submit" />

              </div>

            </section>

          </article>

        </section>

        {/* =====================================================
            SAME SIDEBAR POSITION AS ReaderView
        ===================================================== */}
        <aside className="story-reader-sidebar">

          {/* =================================================
              STORY INFO
          ================================================= */}
          <section className="story-sidebar-card story-sidebar-story">

            <div className="story-sidebar-cover">
              <div className="reader-loading-cover" />
            </div>

            <div className="story-sidebar-story-info">

              <div className="reader-loading-story-title" />

              <div className="reader-loading-story-tags">
                <span />
                <span />
              </div>

              <div className="reader-loading-synopsis">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="reader-loading-author" />

            </div>

          </section>

          {/* =================================================
              CURRENT STATUS
          ================================================= */}
          <section className="story-sidebar-card">

            <div className="story-sidebar-section-title">

              <span className="sidebar-section-icon">
                <span className="reader-loading-section-icon" />
              </span>

              <span className="reader-loading-section-title" />

            </div>

            <div className="story-sidebar-status-list">

              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="story-sidebar-status-item reader-loading-status-item"
                  >
                    <span className="status-icon">
                      <span className="reader-loading-status-icon" />
                    </span>

                    <div>
                      <small />
                      <strong />
                    </div>
                  </div>
                )
              )}

            </div>

          </section>

          {/* =================================================
              CHARACTERS
          ================================================= */}
          <section className="story-sidebar-card">

            <div className="story-sidebar-section-title">

              <span className="sidebar-section-icon">
                <span className="reader-loading-section-icon" />
              </span>

              <span className="reader-loading-section-title" />

            </div>

            <div className="story-sidebar-characters">

              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="story-sidebar-character reader-loading-character"
                  >
                    <div>
                      <strong />
                      <small />
                    </div>
                  </div>
                )
              )}

            </div>

          </section>

          {/* =================================================
              STORY PATH
          ================================================= */}
          <section className="story-sidebar-card">

            <div className="story-sidebar-section-title">

              <span className="sidebar-section-icon">
                <span className="reader-loading-section-icon" />
              </span>

              <span className="reader-loading-section-title" />

            </div>

            <div className="story-path">

              <div className="reader-loading-path">

                <span />
                <span />
                <span />
                <span />
                <span />

              </div>

            </div>

          </section>

        </aside>

      </main>
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
            choices,
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

              choices:
                Array.isArray(
                  chapter.choices
                )
                  ? chapter.choices
                  : undefined,

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
            current_location,
            physical_condition,
            important_situation,
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

              current_location:
                '',

              physical_condition:
                '',

              important_situation:
                '',

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
              current_location,
              physical_condition,
              important_situation,
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
                  current_location,
                  physical_condition,
                  important_situation,
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
          }
        }

        /* =========================
           Save Session ID
        ========================= */

        setSessionId(
          currentSession.id
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
            choices,
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

              choices:
                Array.isArray(
                  chapter.choices
                )
                  ? chapter.choices
                  : undefined,

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

          /* =========================
             Current Story Status
          ========================= */

          currentLocation:
            currentSession.current_location ||
            '',

          physicalCondition:
            currentSession.physical_condition ||
            '',

          currentInventory:
            Array.isArray(
              currentSession.current_inventory
            )
              ? currentSession.current_inventory
              : [],

          importantSituation:
            currentSession.important_situation ||
            '',

          isFavorite:
            storyData.is_favorite ||
            false,

          chapters,
        };

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

          current_location:
            updatedStory.currentLocation ||
            '',

          physical_condition:
            updatedStory.physicalCondition ||
            '',

          current_inventory:
            updatedStory.currentInventory ||
            [],

          important_situation:
            updatedStory.importantSituation ||
            '',

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
      sessionCharacters={
        sessionCharacters
      }
      onBack={() =>
        router.push('/')
      }
      onUpdateStory={
        handleUpdateStory
      }
    />
  );
}