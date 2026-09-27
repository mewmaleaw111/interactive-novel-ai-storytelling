import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isUserBanned } from '@/lib/auth/user';

type RouteContext = {
  params: Promise<{
    storyId: string;
  }>;
};

export async function DELETE(
  req: Request,
  context: RouteContext
) {
  try {
    // ตรวจสอบว่า Login อยู่หรือไม่
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

    const { storyId } = await context.params;

    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบรหัสนิยาย',
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่านิยายเป็นของ User คนนี้จริง
    const { data: story, error: findError } =
      await supabaseAdmin
        .from('stories')
        .select('id, title, user_id')
        .eq('id', storyId)
        .eq('user_id', userId)
        .single();

    if (findError || !story) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบนิยาย หรือคุณไม่มีสิทธิ์ลบนิยายนี้',
        },
        { status: 404 }
      );
    }

    // ลบนิยาย
    // ตารางที่มี ON DELETE CASCADE จะถูกลบตามอัตโนมัติ
    const { error: deleteError } =
      await supabaseAdmin
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId);

    if (deleteError) {
      console.error('Delete Story Error:', deleteError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถลบนิยายได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ลบนิยายเรียบร้อยแล้ว',
      storyId: story.id,
    });
  } catch (error) {
    console.error('Delete Story API Error:', error);

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

export async function PATCH(
  req: Request,
  context: RouteContext
) {
  try {
    // ตรวจสอบว่า Login อยู่หรือไม่
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

    const { storyId } = await context.params;

    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบรหัสนิยาย',
        },
        { status: 400 }
      );
    }

    // รับข้อมูลที่ต้องการแก้ไข
    const body = await req.json();

    const {
      title,
      cover_image_url,
    } = body;

    // ตรวจสอบว่านิยายเป็นของ User คนนี้จริง
    const { data: story, error: findError } =
      await supabaseAdmin
        .from('stories')
        .select('id')
        .eq('id', storyId)
        .eq('user_id', userId)
        .single();

    if (findError || !story) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบนิยาย หรือคุณไม่มีสิทธิ์แก้ไขนิยายนี้',
        },
        { status: 404 }
      );
    }

    // อนุญาตให้แก้ได้เฉพาะชื่อเรื่องและหน้าปก
    const updates: Record<string, string> = {};

    if (typeof title === 'string') {
      const cleanTitle = title.trim();

      if (!cleanTitle) {
        return NextResponse.json(
          {
            success: false,
            error: 'ชื่อเรื่องต้องไม่ว่าง',
          },
          { status: 400 }
        );
      }

      updates.title = cleanTitle;
    }

    if (typeof cover_image_url === 'string') {
      updates.cover_image_url =
        cover_image_url.trim();
    }

    // ต้องมีข้อมูลอย่างน้อย 1 ช่อง
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่มีข้อมูลที่สามารถแก้ไขได้',
        },
        { status: 400 }
      );
    }

    // อัปเดตข้อมูล
    const { data: updatedStory, error: updateError } =
      await supabaseAdmin
        .from('stories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storyId)
        .eq('user_id', userId)
        .select()
        .single();

    if (updateError) {
      console.error('Update Story Error:', updateError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถแก้ไขนิยายได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'แก้ไขนิยายเรียบร้อยแล้ว',
      story: updatedStory,
    });
  } catch (error) {
    console.error('Update Story API Error:', error);

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