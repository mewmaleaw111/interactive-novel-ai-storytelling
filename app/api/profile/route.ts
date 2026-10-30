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

    // -----------------------------------------
    // Profile
    // -----------------------------------------

    let { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle();

    if (profileError) {
      console.error(
        'Error loading profile:',
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load profile',
        },
        { status: 500 }
      );
    }

    // ถ้ายังไม่มี profile ให้สร้างให้อัตโนมัติ
    if (!profile) {
      const { data: newProfile, error: createError } =
        await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: userId,
            display_name: 'ผู้เล่น',
          })
          .select('display_name')
          .single();

      if (createError) {
        console.error(
          'Error creating profile:',
          createError
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create profile',
          },
          { status: 500 }
        );
      }

      profile = newProfile;
    }

    // -----------------------------------------
    // จำนวนเรื่องที่สร้าง
    // -----------------------------------------

    const { count: createdStories, error: storiesError } =
      await supabaseAdmin
        .from('stories')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('user_id', userId);

    if (storiesError) {
      console.error(
        'Error counting created stories:',
        storiesError
      );
    }

    // -----------------------------------------
    // จำนวนเส้นเรื่องที่เล่น
    // -----------------------------------------

    const { count: playedStories, error: sessionsError } =
      await supabaseAdmin
        .from('game_sessions')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('user_id', userId);

    if (sessionsError) {
      console.error(
        'Error counting played stories:',
        sessionsError
      );
    }

    // -----------------------------------------
    // จำนวนเรื่องโปรด
    // -----------------------------------------

    const {
      count: favoriteStories,
      error: favoritesError,
    } = await supabaseAdmin
      .from('favorite_stories')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('user_id', userId);

    if (favoritesError) {
      console.error(
        'Error counting favorite stories:',
        favoritesError
      );
    }

    return NextResponse.json({
      success: true,

      profile: {
        displayName:
          profile.display_name || 'ผู้เล่น',
      },

      stats: {
        createdStories: createdStories ?? 0,
        playedStories: playedStories ?? 0,
        favoriteStories: favoriteStories ?? 0,
      },
    });
  } catch (error) {
    console.error(
      'Unexpected error loading profile:',
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

export async function PUT(request: Request) {
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

    const displayName =
      typeof body.displayName === 'string'
        ? body.displayName.trim()
        : '';

    if (
      displayName.length < 2 ||
      displayName.length > 50
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'นามสมมุติต้องมีความยาว 2-50 ตัวอักษร',
        },
        { status: 400 }
      );
    }

    const { data: profile, error } =
      await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            display_name: displayName,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        )
        .select('display_name')
        .single();

    if (error) {
      console.error(
        'Error updating profile:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update profile',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      profile: {
        displayName: profile.display_name,
      },
    });
  } catch (error) {
    console.error(
      'Unexpected error updating profile:',
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