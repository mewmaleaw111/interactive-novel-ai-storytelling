import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const {
      data: stories,
      error: storiesError,
    } = await supabaseAdmin
      .from('stories')
      .select('id, user_id, is_published')
      .eq('is_published', true)
      .eq('is_banned', false);

    if (storiesError) {
      console.error(
        'Error loading story owners:',
        storiesError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load story owners',
        },
        { status: 500 }
      );
    }

    if (!stories || stories.length === 0) {
      return NextResponse.json({
        success: true,
        creators: {},
      });
    }

    const userIds = [
      ...new Set(
        stories
          .map((story) => story.user_id)
          .filter(Boolean)
      ),
    ];

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        creators: {},
      });
    }

    const {
      data: profiles,
      error: profilesError,
    } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    if (profilesError) {
      console.error(
        'Error loading creator profiles:',
        profilesError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load creator profiles',
        },
        { status: 500 }
      );
    }

    const profileMap: Record<string, string> = {};

    profiles?.forEach((profile) => {
      profileMap[profile.user_id] =
        profile.display_name?.trim() ||
        'ไม่ระบุชื่อ';
    });

    const creators: Record<string, string> = {};

    stories.forEach((story) => {
      if (!story.user_id) {
        creators[story.id] = 'ไม่ระบุชื่อ';
        return;
      }

      creators[story.id] =
        profileMap[story.user_id] ||
        'ไม่ระบุชื่อ';
    });

    return NextResponse.json({
      success: true,
      creators,
    });
  } catch (error) {
    console.error(
      'Unexpected error loading creators:',
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