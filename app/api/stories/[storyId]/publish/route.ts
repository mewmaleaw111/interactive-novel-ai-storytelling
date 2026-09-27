import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

type RouteContext = {
  params: Promise<{
    storyId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาเข้าสู่ระบบ',
        },
        { status: 401 }
      );
    }

    const { storyId } = await params;

    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบรหัสนิยาย',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const isPublished =
      Boolean(body.isPublished);

    /*
     * ตรวจสอบว่านิยายมีอยู่จริง
     */
    const {
      data: story,
      error: storyError,
    } = await supabaseAdmin
      .from('stories')
      .select(
        'id, user_id, is_published'
      )
      .eq('id', storyId)
      .maybeSingle();

    if (storyError) {
      console.error(
        'Publish Story Fetch Error:',
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
          error: 'ไม่พบนิยายเรื่องนี้',
        },
        { status: 404 }
      );
    }

    /*
     * เฉพาะเจ้าของนิยายเท่านั้น
     * ที่สามารถเผยแพร่หรือซ่อนนิยายได้
     */
    if (story.user_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'คุณไม่มีสิทธิ์จัดการนิยายเรื่องนี้',
        },
        { status: 403 }
      );
    }

    /*
     * อัปเดตสถานะการเผยแพร่
     */
    const {
      data: updatedStory,
      error: updateError,
    } = await supabaseAdmin
      .from('stories')
      .update({
        is_published: isPublished,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', storyId)
      .eq('user_id', userId)
      .select(
        'id, is_published'
      )
      .single();

    if (updateError) {
      console.error(
        'Publish Story Update Error:',
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถเปลี่ยนสถานะนิยายได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isPublished:
        updatedStory.is_published,
    });
  } catch (error) {
    console.error(
      'Publish Story API Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}