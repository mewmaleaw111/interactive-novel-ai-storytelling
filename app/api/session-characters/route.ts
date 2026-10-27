
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Story ID' },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบเจ้าของและสถานะการเผยแพร่นิยาย
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .select('id, user_id, is_published')
      .eq('id', storyId)
      .maybeSingle();

    if (storyError) {
      console.error('Load Story Error:', storyError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถโหลดข้อมูลนิยายได้' },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบนิยาย' },
        { status: 404 }
      );
    }

    // นิยายที่ยังไม่เผยแพร่ เจ้าของเท่านั้นที่ดูข้อมูลต้นฉบับได้
    if (story.user_id !== userId && story.is_published !== true) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึงนิยายนี้' },
        { status: 403 }
      );
    }

    // 2. โหลด Session ต้นฉบับของเจ้าของนิยาย
    const {
      data: originalSession,
      error: sessionError,
    } = await supabaseAdmin
      .from('game_sessions')
      .select(`
        id,
        user_id,
        story_id,
        current_chapter,
        status,
        current_location,
        physical_condition,
        current_inventory,
        important_situation
      `)
      .eq('user_id', story.user_id)
      .eq('story_id', story.id)
      .maybeSingle();

    if (sessionError) {
      console.error('Load Original Session Error:', sessionError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถโหลด Session ต้นฉบับได้' },
        { status: 500 }
      );
    }

    if (!originalSession) {
      return NextResponse.json({
        success: true,
        session: null,
        characters: [],
        relationships: [],
      });
    }

    // 3. โหลดตัวละครจาก Session ต้นฉบับ
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
        gender,
        role,
        appearance,
        personality,
        initial_items,
        created_at
      `)
      .eq('session_id', originalSession.id)
      .order('created_at', { ascending: true });

    if (characterError) {
      console.error('Load Original Characters Error:', characterError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถโหลดตัวละครได้' },
        { status: 500 }
      );
    }

    // 4. โหลดความสัมพันธ์จาก Session ต้นฉบับ
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
      .eq('session_id', originalSession.id)
      .order('created_at', { ascending: true });

    if (relationshipError) {
      console.error('Load Original Relationships Error:', relationshipError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถโหลดความสัมพันธ์ของตัวละครได้' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: originalSession.id,
        storyId: originalSession.story_id,
        currentChapter: originalSession.current_chapter,
        status: originalSession.status,
        currentLocation: originalSession.current_location,
        physicalCondition: originalSession.physical_condition,
        currentInventory: originalSession.current_inventory,
        importantSituation: originalSession.important_situation,
      },
      characters: characters || [],
      relationships: relationships || [],
    });
  } catch (error) {
    console.error('Session Characters GET Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}
