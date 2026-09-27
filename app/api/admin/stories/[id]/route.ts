import { NextResponse } from 'next/server';

import { isAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: Request,
    { params }: RouteContext
) {
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

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ไม่พบ Story ID',
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        if (typeof body.isBanned !== 'boolean') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ข้อมูล isBanned ไม่ถูกต้อง',
                },
                { status: 400 }
            );
        }

        const { data: story, error } = await supabaseAdmin
            .from('stories')
            .update({
                is_banned: body.isBanned,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('id, title, is_banned')
            .maybeSingle();

        if (error) {
            console.error('Admin Story Update Error:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'ไม่สามารถเปลี่ยนสถานะนิยายได้',
                },
                { status: 500 }
            );
        }

        if (!story) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ไม่พบข้อมูลนิยาย',
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            story,
        });
    } catch (error) {
        console.error('Admin Story PATCH Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'เกิดข้อผิดพลาดภายในระบบ',
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: RouteContext
) {
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

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ไม่พบ Story ID',
                },
                { status: 400 }
            );
        }

        const { data: story, error: findError } = await supabaseAdmin
            .from('stories')
            .select('id, title')
            .eq('id', id)
            .maybeSingle();

        if (findError) {
            console.error('Admin Story Find Error:', findError);

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
                    error: 'ไม่พบข้อมูลนิยาย',
                },
                { status: 404 }
            );
        }

        const { error: deleteError } = await supabaseAdmin
            .from('stories')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Admin Story Delete Error:', deleteError);

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
            story,
        });
    } catch (error) {
        console.error('Admin Story DELETE Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'เกิดข้อผิดพลาดภายในระบบ',
            },
            { status: 500 }
        );
    }
}