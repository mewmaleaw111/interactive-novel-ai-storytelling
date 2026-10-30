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

    // =====================================================
    // Stories
    // =====================================================

    const { data: stories, error: storiesError } = await supabaseAdmin
      .from('stories')
      .select('id, is_published');

    if (storiesError) {
      console.error('Dashboard Stories Error:', storiesError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูลนิยายได้',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // Profiles
    // =====================================================

    const { count: userCount, error: usersError } =
      await supabaseAdmin
        .from('profiles')
        .select('id', {
          count: 'exact',
          head: true,
        });

    if (usersError) {
      console.error('Dashboard Users Error:', usersError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // Chapters
    // =====================================================

    const { count: sharedChapterCount, error: chaptersError } =
      await supabaseAdmin
        .from('chapters')
        .select('id', {
          count: 'exact',
          head: true,
        });

    if (chaptersError) {
      console.error('Dashboard Chapters Error:', chaptersError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูลตอนนิยายได้',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // Session Chapters
    // =====================================================

    const {
      count: sessionChapterCount,
      error: sessionChaptersError,
    } = await supabaseAdmin
      .from('session_chapters')
      .select('id', {
        count: 'exact',
        head: true,
      });

    if (sessionChaptersError) {
      console.error(
        'Dashboard Session Chapters Error:',
        sessionChaptersError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูล Session Chapters ได้',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // Game Sessions
    // =====================================================

    const {
      count: sessionCount,
      error: sessionsError,
    } = await supabaseAdmin
      .from('game_sessions')
      .select('id', {
        count: 'exact',
        head: true,
      });

    if (sessionsError) {
      console.error('Dashboard Sessions Error:', sessionsError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูล Game Sessions ได้',
        },
        { status: 500 }
      );
    }

    const {
      count: publicSessionCount,
      error: publicSessionsError,
    } = await supabaseAdmin
      .from('game_sessions')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('is_public', true);

    if (publicSessionsError) {
      console.error(
        'Dashboard Public Sessions Error:',
        publicSessionsError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูล Public Sessions ได้',
        },
        { status: 500 }
      );
    }

    const {
      count: privateSessionCount,
      error: privateSessionsError,
    } = await supabaseAdmin
      .from('game_sessions')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('is_public', false);

    if (privateSessionsError) {
      console.error(
        'Dashboard Private Sessions Error:',
        privateSessionsError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูล Private Sessions ได้',
        },
        { status: 500 }
      );
    }

    // =====================================================
    // Calculate
    // =====================================================

    const storyList = stories ?? [];

    const storyCount = storyList.length;

    const publishedStoryCount = storyList.filter(
      (story) => story.is_published === true
    ).length;

    const privateStoryCount =
      storyCount - publishedStoryCount;

    const totalChapterCount =
      (sharedChapterCount ?? 0) +
      (sessionChapterCount ?? 0);

    // =====================================================
    // Response
    // =====================================================

    return NextResponse.json({
      success: true,

      stats: {
        storyCount,
        publishedStoryCount,
        privateStoryCount,

        userCount: userCount ?? 0,

        sharedChapterCount: sharedChapterCount ?? 0,
        sessionChapterCount: sessionChapterCount ?? 0,
        totalChapterCount,

        sessionCount: sessionCount ?? 0,
        publicSessionCount: publicSessionCount ?? 0,
        privateSessionCount: privateSessionCount ?? 0,
      },
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}