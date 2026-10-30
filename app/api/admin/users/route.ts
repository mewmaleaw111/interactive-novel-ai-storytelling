import { NextResponse } from 'next/server';

import { isAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
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

    const [
      { data: profiles, error: profilesError },
      { data: stories, error: storiesError },
      { data: sessions, error: sessionsError },
    ] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select(
          'user_id, display_name, is_banned, created_at, updated_at'
        )
        .order('created_at', {
          ascending: false,
        }),

      supabaseAdmin
        .from('stories')
        .select('user_id'),

      supabaseAdmin
        .from('game_sessions')
        .select('user_id'),
    ]);

    if (profilesError) {
      console.error(
        'Admin Users Profiles Error:',
        profilesError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    if (storiesError) {
      console.error(
        'Admin Users Stories Error:',
        storiesError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูลนิยายได้',
        },
        { status: 500 }
      );
    }

    if (sessionsError) {
      console.error(
        'Admin Users Sessions Error:',
        sessionsError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูล Session ได้',
        },
        { status: 500 }
      );
    }

    const storyCountMap = new Map<string, number>();
    const sessionCountMap = new Map<string, number>();

    for (const story of stories ?? []) {
      if (!story.user_id) {
        continue;
      }

      storyCountMap.set(
        story.user_id,
        (storyCountMap.get(story.user_id) ?? 0) + 1
      );
    }

    for (const session of sessions ?? []) {
      if (!session.user_id) {
        continue;
      }

      sessionCountMap.set(
        session.user_id,
        (sessionCountMap.get(session.user_id) ?? 0) + 1
      );
    }

    const users = (profiles ?? []).map((profile) => ({
      userId: profile.user_id,
      displayName: profile.display_name,
      isBanned: profile.is_banned,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      storyCount:
        storyCountMap.get(profile.user_id) ?? 0,
      sessionCount:
        sessionCountMap.get(profile.user_id) ?? 0,
    }));

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      'Admin Users API Error:',
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