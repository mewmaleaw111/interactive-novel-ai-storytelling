import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

  const isAdmin = metadata?.role === 'admin';

  if (isAdmin) {
    return NextResponse.next();
  }

  // ตรวจสอบสถานะแบน
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('is_banned')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Middleware User Ban Check Error:', error);
    return NextResponse.next();
  }

  const isBanned = profile?.is_banned === true;

  if (!isBanned) {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;

  // API ให้แต่ละ API ตรวจ isUserBanned() เอง
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // คนโดนแบนเข้าได้เฉพาะ
  // /          Home
  // /discover
  // /profile
  if (isAllowedBannedPath(pathname)) {
    return NextResponse.next();
  }

  // ทุกหน้าอื่น รวม /library → กลับหน้า Home
  return NextResponse.redirect(new URL('/', req.url));
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};