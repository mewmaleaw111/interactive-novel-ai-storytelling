import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getBanStatus } from '@/lib/auth/banStatus';

const allowedBannedPaths = [
  '/',
  '/discover',
  '/profile',
];

function isAllowedBannedPath(pathname: string) {
  return allowedBannedPaths.some(
    (path) =>
      pathname === path ||
      (path !== '/' && pathname.startsWith(`${path}/`))
  );
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // API ให้แต่ละ API ตรวจ isUserBanned() เอง
  // และหน้าที่คนโดนแบนเข้าได้ ไม่ต้องรู้สถานะแบนเลย
  // → ข้าม DB query ทั้งหมด (เดิมยิง Supabase ทุก request)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/trpc/') ||
    isAllowedBannedPath(pathname)
  ) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.next();
  }

  // Admin ใช้งานได้ตามปกติ
  const metadata = sessionClaims?.metadata as
    | {
        role?: string;
      }
    | undefined;

  if (metadata?.role === 'admin') {
    return NextResponse.next();
  }

  // ตรวจสอบสถานะแบน (มีแคชช่วงสั้น ๆ)
  const isBanned = await getBanStatus(userId);

  // ตรวจสอบไม่ได้ → ปล่อยผ่านเหมือนเดิม (API ยังตรวจซ้ำเอง)
  if (isBanned !== true) {
    return NextResponse.next();
  }

  // คนโดนแบนเข้าได้เฉพาะ
  // /          Home
  // /discover
  // /profile
  // ทุกหน้าอื่น รวม /library → กลับหน้า Home
  return NextResponse.redirect(new URL('/', req.url));
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
