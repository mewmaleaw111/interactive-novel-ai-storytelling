import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { isUserBanned } from '@/lib/auth/user';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาเข้าสู่ระบบก่อน',
        },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ Session ID',
        },
        { status: 400 }
      );
    }

    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sessionError) {
      console.error(
        'Chat Log Session Check Error:',
        sessionError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบ Session ได้',
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบ Session หรือไม่มีสิทธิ์เข้าถึง',
        },
        { status: 404 }
      );
    }

    const {
      data: logs,
      error: logError,
    } = await supabase
      .from('chat_logs')
      .select(`
        id,
        session_id,
        chapter,
        role,
        content,
        created_at
      `)
      .eq('session_id', sessionId)
      .order('created_at', {
        ascending: true,
      });

    if (logError) {
      console.error(
        'Get Chat Logs Error:',
        logError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถโหลดประวัติการสนทนาได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (error) {
    console.error(
      'Chat Logs GET Error:',
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

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาเข้าสู่ระบบก่อน',
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

    const supabase = createServerSupabaseClient();

    const body = await req.json();

    const {
      sessionId,
      chapter,
      role,
      content,
    } = body;

    if (
      !sessionId ||
      chapter === undefined ||
      !role ||
      !content
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูล Chat Log ไม่ครบถ้วน',
        },
        { status: 400 }
      );
    }

    if (
      role !== 'user' &&
      role !== 'model'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Role ต้องเป็น user หรือ model เท่านั้น',
        },
        { status: 400 }
      );
    }

    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sessionError) {
      console.error(
        'Chat Log Session Check Error:',
        sessionError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบ Session ได้',
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบ Session หรือไม่มีสิทธิ์เข้าถึง',
        },
        { status: 404 }
      );
    }

    const {
      data: log,
      error: insertError,
    } = await supabase
      .from('chat_logs')
      .insert({
        session_id: sessionId,
        chapter,
        role,
        content,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        'Insert Chat Log Error:',
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถบันทึก Chat Log ได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error(
      'Chat Logs POST Error:',
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