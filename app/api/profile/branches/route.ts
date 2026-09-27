import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // ==================================================
    // 1. โหลดเส้นเรื่องของ User
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
        story_id,
        current_chapter,
        status,
        created_at,
        updated_at
        `
      )
      .eq('user_id', userId)
      .order('updated_at', {
        ascending: false,
      });

    if (sessionError) {
      console.error(
        'Error loading user branches:',
        sessionError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to load branches',
        },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        branches: [],
      });
    }

    // ==================================================
    // 2. โหลด Story ที่เกี่ยวข้อง
    // ==================================================

    const storyIds = [
      ...new Set(
        sessions.map(
          (session) => session.story_id
        )
      ),
    ];

    const {
      data: stories,
      error: storyError,
    } = await supabaseAdmin
      .from('stories')
      .select(
        `
        id,
        title,
        synopsis,
        genre,
        tone,
        total_chapters,
        cover_image_url,
        is_banned
        `
      )
      .in('id', storyIds);

    if (storyError) {
      console.error(
        'Error loading branch stories:',
        storyError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to load branch stories',
        },
        { status: 500 }
      );
    }

    // ==================================================
    // 3. โหลด Username จาก Profile
    // ==================================================

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from('profiles')
      .select(
        'user_id, display_name'
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error(
        'Error loading profile:',
        profileError
      );
    }

    const userName =
      profile?.display_name?.trim() ||
      'ไม่ระบุชื่อ';

    // ==================================================
    // 4. รวมข้อมูล
    // ==================================================

    const storyMap = new Map(
      (stories ?? []).map(
        (story) => [
          story.id,
          story,
        ]
      )
    );

    const branches = sessions
      .map((session) => {
        const story =
          storyMap.get(
            session.story_id
          );

        if (!story || story.is_banned) {
          return null;
        }

        return {
          sessionId: session.id,
          userId: session.user_id,
          userName,

          storyId: story.id,
          title: story.title,

          synopsis:
            story.synopsis ?? '',

          genre:
            story.genre ?? '',

          tone:
            story.tone ?? '',

          totalChapters:
            story.total_chapters ?? 1,

          currentChapter:
            session.current_chapter ?? 1,

          status:
            session.status,

          coverImageUrl:
            story.cover_image_url ?? '',

          createdAt:
            session.created_at,

          updatedAt:
            session.updated_at,
        };
      })
      .filter(
        (
          branch
        ): branch is NonNullable<
          typeof branch
        > => branch !== null
      );

    // ==================================================
    // 5. Response
    // ==================================================

    return NextResponse.json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error(
      'Unexpected error loading profile branches:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}