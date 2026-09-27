import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ Story ID',
        },
        { status: 400 }
      );
    }

    /* =========================
       Load User Session
    ========================= */

    const {
      data: session,
      error: sessionError,
    } = await supabaseAdmin
      .from('game_sessions')
      .select(
        'id, user_id, story_id, current_chapter, status'
      )
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .maybeSingle();

    if (sessionError) {
      console.error(
        'Load Session Error:',
        sessionError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลด Session ได้',
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ Session ของผู้เล่น',
        },
        { status: 404 }
      );
    }

    /* =========================
       Load Session Characters
    ========================= */

    const {
      data: characters,
      error: characterError,
    } = await supabaseAdmin
      .from('session_characters')
      .select(`
        id,
        session_id,
        base_character_id,
        name,
        role,
        appearance,
        personality,
        initial_items,
        created_at
      `)
      .eq('session_id', session.id)
      .order('created_at', {
        ascending: true,
      });

    if (characterError) {
      console.error(
        'Load Session Characters Error:',
        characterError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดตัวละครของ Session ได้',
        },
        { status: 500 }
      );
    }

    /* =========================
       Load Session Relationships
    ========================= */

    const {
      data: relationships,
      error: relationshipError,
    } = await supabaseAdmin
      .from('session_character_relationships')
      .select(`
        id,
        session_id,
        from_character_id,
        to_character_id,
        relationship_type,
        description,
        created_at
      `)
      .eq('session_id', session.id)
      .order('created_at', {
        ascending: true,
      });

    if (relationshipError) {
      console.error(
        'Load Session Relationships Error:',
        relationshipError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถโหลดความสัมพันธ์ของตัวละครได้',
        },
        { status: 500 }
      );
    }

    /* =========================
       Response
    ========================= */

    return NextResponse.json({
      success: true,

      session: {
        id: session.id,
        storyId: session.story_id,
        currentChapter:
          session.current_chapter,
        status: session.status,
      },

      characters: characters || [],

      relationships:
        relationships || [],
    });
  } catch (error) {
    console.error(
      'Session Characters GET Error:',
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