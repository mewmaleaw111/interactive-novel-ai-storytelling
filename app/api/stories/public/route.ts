import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: stories, error } =
      await supabaseAdmin
        .from('stories')
        .select(`
          id,
          title,
          synopsis,
          genre,
          tone,
          total_chapters,
          cover_image_url,
          created_at,
          is_published,
          is_banned,
          user_id
        `)
        .eq('is_published', true)
        .eq('is_banned', false)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      console.error(
        'Public Stories Error:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดนิยายได้',
        },
        { status: 500 }
      );
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json({
        success: true,
        stories: [],
      });
    }

    const userIds = [
      ...new Set(
        stories
          .map((story) => story.user_id)
          .filter(
            (
              userId
            ): userId is string =>
              Boolean(userId)
          )
      ),
    ];

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        stories,
      });
    }

    const {
      data: profiles,
      error: profileError,
    } =
      await supabaseAdmin
        .from('profiles')
        .select(
          'user_id, is_banned'
        )
        .in(
          'user_id',
          userIds
        );

    if (profileError) {
      console.error(
        'Public Stories Profile Error:',
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบสถานะผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    const bannedUserIds =
      new Set(
        (profiles ?? [])
          .filter(
            (profile) =>
              profile.is_banned === true
          )
          .map(
            (profile) =>
              profile.user_id
          )
      );

    const visibleStories =
      stories.filter(
        (story) =>
          !story.user_id ||
          !bannedUserIds.has(
            story.user_id
          )
      );

    return NextResponse.json({
      success: true,
      stories: visibleStories,
    });
  } catch (error) {
    console.error(
      'Public Stories API Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}