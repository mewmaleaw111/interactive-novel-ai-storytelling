import { auth } from '@clerk/nextjs/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function isUserBanned() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('is_banned')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Check User Ban Error:', error);

    // ถ้าตรวจสอบสถานะแบนไม่ได้
    // ให้หยุดการทำงานไว้ก่อน เพื่อไม่ให้บัญชีที่ควรถูกแบนหลุดผ่าน
    return true;
  }

  return profile?.is_banned === true;
}