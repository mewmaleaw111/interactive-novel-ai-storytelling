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

    // ทุก User ที่เข้าสู่ระบบสามารถอ่านตัวละครของ Story ได้
    const {
      data: characters,
      error: characterError,
    } = await supabase
      .from('characters')
      .select(`
        id,
        story_id,
        name,
        role,
        appearance,
        personality,
        initial_items,
        created_at
      `)
      .eq('story_id', storyId)
      .order('created_at', {
        ascending: true,
      });

    if (characterError) {
      console.error(
        'Get Characters Error:',
        characterError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดตัวละครได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      characters: characters || [],
    });
  } catch (error) {
    console.error(
      'Characters GET Error:',
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
      storyId,
      name,
      role,
      appearance,
      personality,
      initialItems,
    } = body;

    if (
      !storyId ||
      !name ||
      !role ||
      !personality
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลตัวละครไม่ครบถ้วน',
        },
        { status: 400 }
      );
    }

    if (
      role !== 'player' &&
      role !== 'npc'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Role ต้องเป็น player หรือ npc เท่านั้น',
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า Story เป็นของ User คนนี้
    // เฉพาะเจ้าของ Story เท่านั้นที่สร้างตัวละครได้
    const {
      data: story,
      error: storyError,
    } = await supabase
      .from('stories')
      .select('id')
      .eq('id', storyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (storyError) {
      console.error(
        'Character Story Check Error:',
        storyError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบนิยายได้',
        },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบเรื่องนี้หรือไม่มีสิทธิ์เข้าถึง',
        },
        { status: 404 }
      );
    }

    const {
      data: character,
      error: insertError,
    } = await supabase
      .from('characters')
      .insert({
        story_id: storyId,
        name: name.trim(),
        role,
        appearance:
          appearance?.trim() || null,
        personality: personality.trim(),
        initial_items:
          initialItems || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        'Insert Character Error:',
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถบันทึกตัวละครได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      character,
    });
  } catch (error) {
    console.error(
      'Characters POST Error:',
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

export async function DELETE(req: Request) {
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
      storyId,
      characterId,
    } = body;

    if (!storyId || !characterId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลสำหรับลบไม่ครบถ้วน',
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า Story เป็นของ User คนนี้
    // เฉพาะเจ้าของ Story เท่านั้นที่ลบตัวละครได้
    const {
      data: story,
      error: storyError,
    } = await supabase
      .from('stories')
      .select('id')
      .eq('id', storyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (storyError) {
      console.error(
        'Character Story Check Error:',
        storyError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบนิยายได้',
        },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบเรื่องนี้หรือไม่มีสิทธิ์เข้าถึง',
        },
        { status: 404 }
      );
    }

    const {
      error: deleteError,
    } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
      .eq('story_id', storyId);

    if (deleteError) {
      console.error(
        'Delete Character Error:',
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบตัวละครได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Characters DELETE Error:',
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