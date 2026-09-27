'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';
import {
  useSession,
  useUser,
} from '@clerk/nextjs';

import { createSupabaseClient } from '@/lib/supabaseClient';

import { MyStoriesView } from '@/components/MyStoriesView';
import MyStoriesSkeleton from '@/components/MyStoriesSkeleton';
import { EditStoryModal } from '@/components/EditStoryModal';
import { DeleteStoryModal } from '@/components/DeleteStoryModal';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

import '@/styles/mystories.css';

export default function MyStoriesPage() {
  const { user, isLoaded } =
    useUser();

  const { session } =
    useSession();

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

  // ==========================================
  // EDIT MODAL
  // ==========================================
  const [editingStory, setEditingStory] =
    useState<Story | null>(null);

  // ==========================================
  // DELETE MODAL
  // ==========================================
  const [deletingStory, setDeletingStory] =
    useState<Story | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  // ==========================================
  // PUBLISH / UNPUBLISH MODAL
  // ==========================================
  const [publishTarget, setPublishTarget] =
    useState<Story | null>(null);

  // ==========================================
  // LOAD MY STORIES
  // ==========================================
  useEffect(() => {
    if (!isLoaded) return;

    if (!user || !session) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    const loadStories = async () => {
      setIsLoading(true);

      try {
        // ==========================================
        // LOAD STORIES
        // ==========================================
        const {
          data: storyData,
          error: storyError,
        } = await supabase
          .from('stories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          });

        if (storyError) {
          console.error(
            'My Stories Error:',
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
            (story) => story.id
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
            'My Stories Chapter Error:',
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
          storyData.map((story) => {
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
                    chapter.content || '',

                  createdAt:
                    chapter.created_at,
                }));

            // ==========================================
            // CURRENT CHAPTER
            // ==========================================
            const currentChapter =
              storyChapters.length > 0
                ? storyChapters[
                    storyChapters.length - 1
                  ].chapterNumber
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
                  chapter.content.length,
                0
              );

            // ==========================================
            // RETURN STORY
            // ==========================================
            return {
              id: story.id,

              title:
                story.title ||
                'นิยายไม่มีชื่อ',

              corePremise:
                story.synopsis || '',

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

              protagonist: '',
              worldSetting: '',

              coverUrl:
                story.cover_image_url ||
                '',

              author:
                user.fullName ||
                'ไม่ระบุชื่อ',

              totalChapters:
                story.total_chapters || 0,

              currentChapter,

              wordCount,

              chapters:
                storyChapters,

              isFavorite:
                story.is_favorite ??
                false,

              // ==========================================
              // PUBLISH STATUS
              // ==========================================
              isPublished:
                story.is_published ??
                false,

              // ==========================================
              // BAN STATUS
              // ==========================================
              isBanned:
                story.is_banned ??
                false,

              isFresh:
                Date.now() -
                  new Date(
                    story.created_at
                  ).getTime() <
                7 *
                  24 *
                  60 *
                  60 *
                  1000,

              isTrending: false,
            };
          });

        setStories(
          mappedStories
        );
      } catch (error) {
        console.error(
          'Load My Stories Error:',
          error
        );

        setStories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [
    user,
    isLoaded,
    session,
    supabase,
  ]);

  // ==========================================
  // CREATE NEW STORY
  // ==========================================
  const handleCreateStory = () => {
    sessionStorage.removeItem(
      'GonnaTales_create_story_draft'
    );

    router.push(
      '/story/create'
    );
  };

  // ==========================================
  // EDIT STORY
  // ==========================================
  const handleEditStory = (
    story: Story
  ) => {
    setEditingStory(story);
  };

  // ==========================================
  // EDIT SAVED
  // ==========================================
  const handleStorySaved = (
    updatedStory: Story
  ) => {
    setStories(
      (prevStories) =>
        prevStories.map(
          (story) =>
            story.id ===
            updatedStory.id
              ? {
                  ...story,

                  title:
                    updatedStory.title,

                  corePremise:
                    updatedStory.corePremise,

                  genre:
                    updatedStory.genre,

                  tone:
                    updatedStory.tone,

                  coverUrl:
                    updatedStory.coverUrl,
                }
              : story
        )
    );

    setEditingStory(null);
  };

  // ==========================================
  // OPEN PUBLISH / UNPUBLISH MODAL
  // ==========================================
  const handleTogglePublish = (
    story: Story
  ) => {
    setPublishTarget(story);
  };

  // ==========================================
  // CONFIRM PUBLISH / UNPUBLISH
  // ==========================================
  const handleConfirmPublish =
    async () => {
      if (!publishTarget) return;

      const story =
        publishTarget;

      const newPublishedState =
        !story.isPublished;

      try {
        const response =
          await fetch(
            `/api/stories/${story.id}/publish`,
            {
              method: 'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                isPublished:
                  newPublishedState,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              'ไม่สามารถเปลี่ยนสถานะนิยายได้'
          );
        }

        // ==========================================
        // UPDATE UI
        // ==========================================
        setStories(
          (prevStories) =>
            prevStories.map(
              (item) =>
                item.id === story.id
                  ? {
                      ...item,
                      isPublished:
                        data.isPublished,
                    }
                  : item
            )
        );

        // ปิด Modal
        setPublishTarget(null);
      } catch (error) {
        console.error(
          'Toggle Publish Error:',
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : 'ไม่สามารถเปลี่ยนสถานะนิยายได้'
        );
      }
    };

  // ==========================================
  // DELETE STORY
  // ==========================================
  const handleDeleteStory = (
    id: string
  ) => {
    const story =
      stories.find(
        (item) =>
          item.id === id
      );

    if (!story) return;

    setDeletingStory(
      story
    );
  };

  // ==========================================
  // CONFIRM DELETE
  // ==========================================
  const handleConfirmDelete =
    async () => {
      if (!deletingStory) return;

      setIsDeleting(true);

      try {
        const response =
          await fetch(
            `/api/stories/${deletingStory.id}`,
            {
              method: 'DELETE',
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              'ไม่สามารถลบนิยายได้'
          );
        }

        // เอานิยายออกจาก UI ทันที
        setStories(
          (prevStories) =>
            prevStories.filter(
              (story) =>
                story.id !==
                deletingStory.id
            )
        );

        setDeletingStory(null);
      } catch (error) {
        console.error(
          'Delete Story Error:',
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : 'ไม่สามารถลบนิยายได้'
        );
      } finally {
        setIsDeleting(false);
      }
    };

  // ==========================================
  // CLERK LOADING
  // ==========================================
  if (!isLoaded) {
    return (
      <MyStoriesSkeleton />
    );
  }

  // ==========================================
  // SUPABASE LOADING
  // ==========================================
  if (isLoading) {
    return (
      <MyStoriesSkeleton />
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <MyStoriesView
        myStories={stories}

        onSelectStory={(id) =>
          router.push(
            `/story/${id}`
          )
        }

        onCreateStory={
          handleCreateStory
        }

        onEditStory={
          handleEditStory
        }

        onDeleteStory={
          handleDeleteStory
        }

        onTogglePublish={
          handleTogglePublish
        }
      />

      {/* EDIT */}
      <EditStoryModal
        isOpen={
          editingStory !== null
        }
        story={editingStory}
        onClose={() =>
          setEditingStory(null)
        }
        onSaved={
          handleStorySaved
        }
      />

      {/* DELETE */}
      <DeleteStoryModal
        isOpen={
          deletingStory !== null
        }
        story={deletingStory}
        isDeleting={isDeleting}
        onClose={() =>
          setDeletingStory(null)
        }
        onConfirm={
          handleConfirmDelete
        }
      />

      {/* PUBLISH / UNPUBLISH */}
      {publishTarget && (
        <div
          className="publish-modal-overlay"
          onClick={() =>
            setPublishTarget(null)
          }
        >
          <div
            className="publish-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* ICON */}
            <div
              className={`publish-modal-icon ${
                publishTarget.isPublished
                  ? 'is-unpublish'
                  : 'is-publish'
              }`}
            >
              {publishTarget.isPublished ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4.1 9.7 6a11.7 11.7 0 0 1-2.2 2.8" />
                  <path d="M6.6 6.6C4.6 7.8 3.4 9.7 2.3 12c1.2 2.5 4.5 6 9.7 6 1.5 0 2.8-.3 4-.8" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v12" />
                  <path d="M7 8l5-5 5 5" />
                  <path d="M5 14v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" />
                </svg>
              )}
            </div>

            {/* CONTENT */}
            <div className="publish-modal-content">
              <h2>
                {publishTarget.isPublished
                  ? 'ซ่อนนิยายเรื่องนี้?'
                  : 'เผยแพร่นิยายเรื่องนี้?'}
              </h2>

              <p className="publish-modal-story-title">
                {publishTarget.title}
              </p>

              <p className="publish-modal-description">
                {publishTarget.isPublished
                  ? 'เมื่อซ่อนนิยายแล้ว ผู้ใช้อื่นจะไม่สามารถเข้าอ่านหรือเล่นนิยายเรื่องนี้ได้ แต่คุณยังสามารถเล่นต่อได้ตามปกติ'
                  : 'เมื่อเผยแพร่แล้ว ผู้ใช้อื่นจะสามารถค้นหา อ่าน และเล่นนิยายเรื่องนี้ได้'}
              </p>
            </div>

            {/* ACTIONS */}
            <div className="publish-modal-actions">
              <button
                type="button"
                className="publish-modal-cancel"
                onClick={() =>
                  setPublishTarget(null)
                }
              >
                ยกเลิก
              </button>

              <button
                type="button"
                className={`publish-modal-confirm ${
                  publishTarget.isPublished
                    ? 'confirm-unpublish'
                    : 'confirm-publish'
                }`}
                onClick={
                  handleConfirmPublish
                }
              >
                {publishTarget.isPublished
                  ? 'ซ่อนนิยาย'
                  : 'เผยแพร่นิยาย'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}