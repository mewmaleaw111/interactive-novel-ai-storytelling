
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getBanStatus } from '@/lib/auth/banStatus';
import { pageAccessLimiter } from '@/lib/page-rate-limit';

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

  // ตรวจสอบว่าเป็น API หรือ tRPC หรือไม่
  const isApiRequest =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/trpc/');

  // ตรวจสอบว่าเป็นการเปิดหน้าเว็บจริง ๆ หรือไม่
  const isDocumentRequest =
    req.headers.get('sec-fetch-dest') === 'document' ||
    (req.headers.get('accept') ?? '').includes('text/html');

  // Rate Limit เฉพาะการเปิดหน้าเว็บ
  // ไม่จำกัด API, tRPC และหน้าแจ้งเตือน Rate Limit
  if (
    !isApiRequest &&
    pathname !== '/rate-limit' &&
    isDocumentRequest
  ) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip');

    if (ip) {
      try {
        const result = await pageAccessLimiter.limit(ip);

        if (!result.success) {
          const retryAfter = Math.max(
            1,
            Math.ceil((result.reset - Date.now()) / 1000)
          );

          const url = req.nextUrl.clone();

          url.pathname = '/rate-limit';
          url.search = '';
          url.searchParams.set(
            'retryAfter',
            String(retryAfter)
          );

          return NextResponse.redirect(url);
        }
      } catch (error) {
        // หาก Redis มีปัญหา ให้เว็บไซต์ใช้งานได้ตามปกติ
        console.error('[Page Rate Limit] Redis error:', error);
      }
    }
  }

  // API และ tRPC ให้ตรวจสอบสถานะแบนภายในแต่ละ API เอง
  // หน้าที่คนโดนแบนสามารถเข้าถึงได้
  if (
    isApiRequest ||
    isAllowedBannedPath(pathname)
  ) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.next();
  }

  // Admin สามารถใช้งานได้ตามปกติ
  const metadata = sessionClaims?.metadata as
    | {
        role?: string;
      }
    | undefined;

  if (metadata?.role === 'admin') {
    return NextResponse.next();
  }

  // ตรวจสอบสถานะแบน
  const isBanned = await getBanStatus(userId);

  // หากตรวจสอบไม่ได้หรือไม่ถูกแบน ให้ใช้งานตามปกติ
  if (isBanned !== true) {
    return NextResponse.next();
  }

  // ผู้ใช้ที่ถูกแบนจะถูกส่งกลับหน้า Home
  return NextResponse.redirect(new URL('/', req.url));
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
