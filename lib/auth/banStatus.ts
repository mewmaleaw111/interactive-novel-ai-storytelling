import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * ตรวจสถานะแบนพร้อมแคชในหน่วยความจำช่วงสั้น ๆ
 *
 * เดิม middleware และทุก API ยิง query ไปที่ Supabase ทุก request
 * ทำให้ทุกหน้าและทุก API ช้าขึ้นอย่างน้อย 1 round-trip
 *
 * แคชนี้อยู่ใน instance เดียว (ไม่ข้าม serverless instance)
 * การแบน/ปลดแบนจึงมีผลภายในไม่เกิน BAN_CACHE_TTL_MS
 */

const BAN_CACHE_TTL_MS = 60_000;
const BAN_CACHE_MAX_ENTRIES = 5_000;

type BanCacheEntry = {
  banned: boolean;
  expiresAt: number;
};

const banCache = new Map<string, BanCacheEntry>();

/**
 * คืนค่า true/false เมื่อตรวจสอบได้
 * คืนค่า null เมื่อ query ล้มเหลว (ให้ผู้เรียกตัดสินใจเองว่าจะ fail-open หรือ fail-closed)
 */
export async function getBanStatus(
  userId: string
): Promise<boolean | null> {
  const now = Date.now();
  const cached = banCache.get(userId);

  if (cached && cached.expiresAt > now) {
    return cached.banned;
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('is_banned')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Ban status check error:', error);
    return null;
  }

  const banned = profile?.is_banned === true;

  if (banCache.size >= BAN_CACHE_MAX_ENTRIES) {
    // กัน memory โตไม่จำกัด: ลบรายการที่หมดอายุ ถ้ายังเต็มให้ล้างทั้งหมด
    for (const [key, entry] of banCache) {
      if (entry.expiresAt <= now) {
        banCache.delete(key);
      }
    }

    if (banCache.size >= BAN_CACHE_MAX_ENTRIES) {
      banCache.clear();
    }
  }

  banCache.set(userId, {
    banned,
    expiresAt: now + BAN_CACHE_TTL_MS,
  });

  return banned;
}

/** เรียกใช้เมื่อมีการแบน/ปลดแบนใน instance นี้ เพื่อให้มีผลทันที */
export function invalidateBanStatus(userId: string) {
  banCache.delete(userId);
}
