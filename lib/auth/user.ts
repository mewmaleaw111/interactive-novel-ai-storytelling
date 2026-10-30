import { auth } from '@clerk/nextjs/server';

import { getBanStatus } from '@/lib/auth/banStatus';

export async function isUserBanned(
  knownUserId?: string | null
) {
  const userId =
    knownUserId ?? (await auth()).userId;

  if (!userId) {
    return false;
  }

  const banned = await getBanStatus(userId);

  if (banned === null) {
    // ถ้าตรวจสอบสถานะแบนไม่ได้
    // ให้หยุดการทำงานไว้ก่อน เพื่อไม่ให้บัญชีที่ควรถูกแบนหลุดผ่าน
    return true;
  }

  return banned;
}
