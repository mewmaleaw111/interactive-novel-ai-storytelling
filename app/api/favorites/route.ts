import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isUserBanned } from '@/lib/auth/user';

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

    const { data, error } = await supabaseAdmin
      .from('favorite_stories')
      .select('story_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Load Favorites Error:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load favorites',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      favoriteStoryIds: (data ?? []).map(
        (item) => item.story_id
      ),
    });
  } catch (error) {
    console.error('Favorites GET Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const banned = await isUserBanned();

    if (banned) {
      return NextResponse.json(
        {
          success: false,
          error: 'บัญชีของคุณถูกระงับการใช้งาน',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const storyId = body.storyId;

    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing storyId',
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('favorite_stories')
      .upsert(
        {
          user_id: userId,
          story_id: storyId,
        },
        {
          onConflict: 'user_id,story_id',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error(
        'Add Favorite Error:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to add favorite',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isFavorite: true,
    });
  } catch (error) {
    console.error(
      'Favorites POST Error:',
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

export async function DELETE(request: Request) {
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

    const banned = await isUserBanned();

    if (banned) {
      return NextResponse.json(
        {
          success: false,
          error: 'บัญชีของคุณถูกระงับการใช้งาน',
        },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const storyId =
      searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing storyId',
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('favorite_stories')
      .delete()
      .eq('user_id', userId)
      .eq('story_id', storyId);

    if (error) {
      console.error(
        'Remove Favorite Error:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to remove favorite',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isFavorite: false,
    });
  } catch (error) {
    console.error(
      'Favorites DELETE Error:',
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