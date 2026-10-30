import { NextRequest, NextResponse } from 'next/server';

import { isAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{
    id: string;
    sessionId: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    const { id, sessionId } = await params;

    if (!id || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Story ID หรือ Session ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (typeof body.isBanned !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูล isBanned ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('id, story_id')
      .eq('id', sessionId)
      .eq('story_id', id)
      .maybeSingle();

    if (sessionError) {
      console.error('Check Session Error:', sessionError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบเส้นเรื่องได้',
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบเส้นเรื่อง',
        },
        { status: 404 }
      );
    }

    const { data: updatedSession, error: updateError } =
      await supabaseAdmin
        .from('game_sessions')
        .update({
          is_banned: body.isBanned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('story_id', id)
        .select('id, story_id, is_banned, updated_at')
        .single();

    if (updateError) {
      console.error('Update Session Ban Error:', updateError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถเปลี่ยนสถานะเส้นเรื่องได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Admin Session PATCH Error:', error);

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

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    const { id, sessionId } = await params;

    if (!id || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Story ID หรือ Session ID' },
        { status: 400 }
      );
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('id, story_id')
      .eq('id', sessionId)
      .eq('story_id', id)
      .maybeSingle();

    if (sessionError) {
      console.error('Check Session Error:', sessionError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบเส้นเรื่องได้',
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบเส้นเรื่อง',
        },
        { status: 404 }
      );
    }

    const { error: chaptersError } = await supabaseAdmin
      .from('session_chapters')
      .delete()
      .eq('session_id', sessionId);

    if (chaptersError) {
      console.error('Delete Session Chapters Error:', chaptersError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบข้อมูลบทของเส้นเรื่องได้',
        },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from('game_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('story_id', id);

    if (deleteError) {
      console.error('Delete Session Error:', deleteError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบเส้นเรื่องได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ลบเส้นเรื่องเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('Admin Session DELETE Error:', error);

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