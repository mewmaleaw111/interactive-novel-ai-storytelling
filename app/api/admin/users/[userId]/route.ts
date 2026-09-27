import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

import { isAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่มีสิทธิ์เข้าถึง',
        },
        { status: 403 }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ User ID',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 1. Profile
    // --------------------------------------------------

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          is_banned,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .maybeSingle();

    if (profileError) {
      console.error(
        'Admin User Profile Error:',
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบผู้ใช้',
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. Stories
    // --------------------------------------------------

    const { data: stories, error: storiesError } =
      await supabaseAdmin
        .from('stories')
        .select(`
          id,
          title,
          synopsis,
          genre,
          tone,
          total_chapters,
          is_published,
          is_banned,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', {
          ascending: false,
        });

    if (storiesError) {
      console.error(
        'Admin User Stories Error:',
        storiesError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดนิยายของผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 3. Game Sessions
    // --------------------------------------------------

    const { data: sessions, error: sessionsError } =
      await supabaseAdmin
        .from('game_sessions')
        .select(`
          id,
          story_id,
          current_chapter,
          is_public,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('updated_at', {
          ascending: false,
        });

    if (sessionsError) {
      console.error(
        'Admin User Sessions Error:',
        sessionsError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลด Game Sessions ได้',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 4. Map story title into sessions
    // --------------------------------------------------

    const storyMap = new Map(
      (stories ?? []).map((story) => [
        story.id,
        {
          title: story.title,
          genre: story.genre,
          isBanned: story.is_banned,
        },
      ])
    );

    const formattedSessions = (sessions ?? []).map(
      (session) => {
        const story = storyMap.get(
          session.story_id
        );

        return {
          id: session.id,
          storyId: session.story_id,
          storyTitle:
            story?.title ?? 'ไม่พบชื่อเรื่อง',
          storyGenre:
            story?.genre ?? null,
          storyIsBanned:
            story?.isBanned ?? false,
          currentChapter:
            session.current_chapter ?? 1,
          isPublic:
            session.is_public ?? false,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
        };
      }
    );

    // --------------------------------------------------
    // 5. Stats
    // --------------------------------------------------

    const storyCount =
      stories?.length ?? 0;

    const sessionCount =
      sessions?.length ?? 0;

    const publishedStoryCount =
      stories?.filter(
        (story) =>
          story.is_published === true
      ).length ?? 0;

    const privateStoryCount =
      storyCount - publishedStoryCount;

    const publicSessionCount =
      sessions?.filter(
        (session) =>
          session.is_public === true
      ).length ?? 0;

    const privateSessionCount =
      sessionCount - publicSessionCount;

    return NextResponse.json({
      success: true,

      user: {
        id: profile.id,
        userId: profile.user_id,
        displayName: profile.display_name,
        isBanned: profile.is_banned,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },

      stats: {
        storyCount,
        publishedStoryCount,
        privateStoryCount,
        sessionCount,
        publicSessionCount,
        privateSessionCount,
      },

      stories: stories ?? [],

      sessions: formattedSessions,
    });
  } catch (error) {
    console.error(
      'Admin User Detail API Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่มีสิทธิ์เข้าถึง',
        },
        { status: 403 }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ User ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const action = body?.action;

    if (action !== 'ban' && action !== 'unban') {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบคำสั่งที่ถูกต้อง',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // ตรวจสอบ User
    // --------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from('profiles')
      .select('user_id, is_banned')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error(
        'Admin User Ban Profile Error:',
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบผู้ใช้',
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // เปลี่ยนสถานะ Ban
    // --------------------------------------------------

    const isBanned = action === 'ban';

    const {
      data: updatedProfile,
      error: updateError,
    } = await supabaseAdmin
      .from('profiles')
      .update({
        is_banned: isBanned,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select(
        'user_id, display_name, is_banned, updated_at'
      )
      .single();

    if (updateError) {
      console.error(
        'Admin User Ban Update Error:',
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      user: {
        userId: updatedProfile.user_id,
        displayName:
          updatedProfile.display_name,
        isBanned:
          updatedProfile.is_banned,
        updatedAt:
          updatedProfile.updated_at,
      },
    });
  } catch (error) {
    console.error(
      'Admin User Ban API Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่มีสิทธิ์เข้าถึง',
        },
        { status: 403 }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ User ID',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // ป้องกัน Admin ลบบัญชีตัวเอง
    // --------------------------------------------------

    const { userId: currentUserId } = await auth();

    if (currentUserId === userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบบัญชีของตัวเองได้',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // ตรวจสอบ User
    // --------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error(
        'Admin User Delete Profile Error:',
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบผู้ใช้',
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // ลบ Game Sessions ของ User
    // --------------------------------------------------

    const {
      error: sessionsDeleteError,
    } = await supabaseAdmin
      .from('game_sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionsDeleteError) {
      console.error(
        'Admin User Delete Sessions Error:',
        sessionsDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบ Game Sessions ของผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // ลบ Stories ของ User
    // --------------------------------------------------
    // game_sessions ที่ผูกกับ story_id จะถูกจัดการ
    // ตาม foreign key ของฐานข้อมูล

    const {
      error: storiesDeleteError,
    } = await supabaseAdmin
      .from('stories')
      .delete()
      .eq('user_id', userId);

    if (storiesDeleteError) {
      console.error(
        'Admin User Delete Stories Error:',
        storiesDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบนิยายของผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // ลบ Profile
    // --------------------------------------------------

    const {
      error: profileDeleteError,
    } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileDeleteError) {
      console.error(
        'Admin User Delete Profile Error:',
        profileDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบข้อมูล Profile ของผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // ลบ User จาก Clerk
    // --------------------------------------------------

    const clerk = await clerkClient();

    await clerk.users.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: 'ลบผู้ใช้เรียบร้อยแล้ว',
      user: {
        userId,
        displayName: profile.display_name,
      },
    });
  } catch (error) {
    console.error(
      'Admin User Delete API Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'ไม่สามารถลบผู้ใช้ได้',
      },
      { status: 500 }
    );
  }
}