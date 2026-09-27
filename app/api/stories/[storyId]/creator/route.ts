import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      storyId: string;
    }>;
  }
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

    /* =========================
       Load Story Owner
    ========================= */

    const {
      data: story,
      error: storyError,
    } = await supabaseAdmin
      .from('stories')
      .select('user_id, is_banned')
      .eq('id', storyId)
      .maybeSingle();

    if (storyError) {
      console.error(
        'Error loading story:',
        storyError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load story',
        },
        { status: 500 }
      );
    }

    if (!story) {
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

    if (!story.user_id) {
      return NextResponse.json({
        success: true,
        creatorName: 'ไม่ระบุชื่อ',
      });
    }

    /* =========================
       Load Creator Profile
    ========================= */

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from('profiles')
      .select(
        'user_id, display_name'
      )
      .eq(
        'user_id',
        story.user_id
      )
      .maybeSingle();

    if (profileError) {
      console.error(
        'Error loading creator profile:',
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to load creator profile',
        },
        { status: 500 }
      );
    }

    const creatorName =
      profile?.display_name?.trim() ||
      'ไม่ระบุชื่อ';

    return NextResponse.json({
      success: true,
      creatorName,
    });
  } catch (error) {
    console.error(
      'Unexpected error loading creator:',
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