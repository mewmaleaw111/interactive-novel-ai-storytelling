import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing storyId',
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 1. ตรวจสอบว่า Story มีอยู่จริง
    // ==================================================

    const {
      data: story,
      error: storyError,
    } = await supabaseAdmin
      .from('stories')
      .select(
        'id, title, cover_image_url, genre, tone, synopsis, is_banned'
      )
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      console.error('Story error:', storyError);

      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
        },
        { status: 404 }
      );
    }

    if (story.is_banned) {
      return NextResponse.json(
        {
          success: false,
          error: 'นิยายเรื่องนี้ถูกระงับการใช้งาน',
        },
        { status: 403 }
      );
    }

    // ==================================================
    // 2. ดึงเฉพาะ Session ที่เป็น Public และไม่ถูก Ban
    // ==================================================

    const {
      data: sessions,
      error: sessionError,
    } = await supabaseAdmin
      .from('game_sessions')
      .select(
        `
        id,
        user_id,
        current_chapter,
        status,
        is_public,
        is_banned,
        created_at,
        updated_at
        `
      )
      .eq('story_id', storyId)
      .eq('is_public', true)
      .eq('is_banned', false)
      .order('created_at', {
        ascending: true,
      });

    if (sessionError) {
      console.error(
        'Error loading story branches:',
        sessionError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load branches',
        },
        { status: 500 }
      );
    }

    // ==================================================
    // 3. ดึงจำนวน Chapter ของแต่ละ Branch
    // ==================================================

    const sessionIds =
      (sessions ?? []).map(
        (session) => session.id
      );

    const chapterCounts: Record<string, number> = {};

    if (sessionIds.length > 0) {
      const {
        data: sessionChapters,
        error: chapterError,
      } = await supabaseAdmin
        .from('session_chapters')
        .select('session_id, chapter_number')
        .in('session_id', sessionIds);

      if (chapterError) {
        console.error(
          'Error loading branch chapters:',
          chapterError
        );
      } else {
        for (
          const chapter of sessionChapters ?? []
        ) {
          chapterCounts[chapter.session_id] =
            (chapterCounts[chapter.session_id] ?? 0) + 1;
        }
      }
    }

    // ==================================================
    // 4. ดึงชื่อผู้เล่นจาก profiles
    // ==================================================

    const playerNames: Record<string, string> = {};

    const userIds =
      (sessions ?? [])
        .map(
          (session) => session.user_id
        )
        .filter(
          (
            userId
          ): userId is string =>
            Boolean(userId)
        );

    if (userIds.length > 0) {
      const {
        data: profiles,
        error: profileError,
      } = await supabaseAdmin
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      if (profileError) {
        console.error(
          'Error loading player profiles:',
          profileError
        );
      } else {
        for (
          const profile of profiles ?? []
        ) {
          playerNames[profile.user_id] =
            profile.display_name || 'ผู้เล่น';
        }
      }
    }

    // ==================================================
    // 5. สร้างข้อมูล Branches
    // ==================================================

    const branches =
      (sessions ?? []).map(
        (session) => ({
          sessionId: session.id,

          userId: session.user_id,

          userName:
            playerNames[
              session.user_id
            ] ?? 'ผู้เล่น',

          currentChapter:
            session.current_chapter ?? 1,

          status: session.status,

          isPublic: session.is_public,

          generatedChapters:
            chapterCounts[
              session.id
            ] ?? 0,

          createdAt: session.created_at,

          updatedAt: session.updated_at,
        })
      );

    // ==================================================
    // 6. Response
    // ==================================================

    return NextResponse.json({
      success: true,

      story: {
        id: story.id,

        title: story.title,

        coverImageUrl:
          story.cover_image_url ?? '',

        genre: story.genre ?? '',

        tone: story.tone ?? '',

        synopsis: story.synopsis ?? '',
      },

      branches,
    });
  } catch (error) {
    console.error(
      'Unexpected error loading branches:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}