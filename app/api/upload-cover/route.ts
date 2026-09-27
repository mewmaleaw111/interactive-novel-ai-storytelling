import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบไฟล์หน้าปก',
        },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP',
        },
        { status: 400 }
      );
    }

    // จำกัดขนาดไฟล์ไม่เกิน 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'ขนาดไฟล์ต้องไม่เกิน 5 MB',
        },
        { status: 400 }
      );
    }

    const fileExtension =
      file.name.split('.').pop() || 'jpg';

    const fileName =
      `${userId}-${crypto.randomUUID()}.${fileExtension}`;

    const filePath = `${userId}/${fileName}`;

    const fileBuffer = await file.arrayBuffer();

    // อัปโหลดด้วย Server-side Supabase client
    const { error: uploadError } =
      await supabaseAdmin.storage
        .from('story-covers')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error(
        'Upload Cover Error:',
        uploadError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถอัปโหลดหน้าปกได้',
        },
        { status: 500 }
      );
    }

    // สร้าง Public URL
    const {
      data: publicUrlData,
    } = supabaseAdmin.storage
      .from('story-covers')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error(
      'Upload Cover API Error:',
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