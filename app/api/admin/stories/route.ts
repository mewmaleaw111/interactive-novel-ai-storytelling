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
                {
                    status: 403,
                }
            );
        }

        const { data: stories, error } = await supabaseAdmin
            .from('stories')
            .select(
                `
                id,
                title,
                synopsis,
                genre,
                tone,
                total_chapters,
                is_published,
                is_banned,
                created_at,
                updated_at,
                user_id
                `
            )
            .order('created_at', {
                ascending: false,
            });

        if (error) {
            console.error('Admin Stories API Error:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'ไม่สามารถโหลดข้อมูลนิยายได้',
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            stories: stories ?? [],
        });
    } catch (error) {
        console.error('Admin Stories API Error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'เกิดข้อผิดพลาดภายในระบบ',
            },
            {
                status: 500,
            }
        );
    }
}