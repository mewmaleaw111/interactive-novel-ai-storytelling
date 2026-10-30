
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

function createRateLimitResponse(retryAfter: number) {
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>กรุณารอสักครู่ | Too Many Requests</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #111113;
      color: #fafafa;
      font-family: Arial, Tahoma, sans-serif;
    }

    .container {
      width: 100%;
      max-width: 440px;
      text-align: center;
    }

    .icon {
      width: 76px;
      height: 76px;
      margin: 0 auto 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #292124;
      color: #e58b8b;
      font-size: 36px;
    }

    h1 {
      margin: 0 0 12px;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    h2 {
      margin: 0 0 16px;
      color: #d4d4d8;
      font-size: 16px;
      font-weight: 500;
    }

    p {
      margin: 0;
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.8;
    }

    .timer-box {
      margin-top: 32px;
      padding: 22px;
      border: 1px solid #343438;
      border-radius: 14px;
      background: #1c1c1f;
    }

    .timer-label {
      margin-bottom: 10px;
      color: #a1a1aa;
      font-size: 13px;
    }

    .timer {
      color: #e58b8b;
      font-size: 38px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: 2px;
    }

    button {
      width: 100%;
      margin-top: 22px;
      padding: 14px 20px;
      border: 0;
      border-radius: 10px;
      background: #8b1e1e;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }

    button:hover:not(:disabled) {
      background: #a52a2a;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    .error-code {
      margin-top: 28px;
      color: #626269;
      font-size: 11px;
      letter-spacing: 1px;
    }

    @media (max-width: 480px) {
      h1 {
        font-size: 24px;
      }

      .timer {
        font-size: 34px;
      }
    }
  </style>
</head>

<body>
  <main class="container">
    <div class="icon">!</div>

    <h1>พักสักครู่นะ</h1>
    <h2>คุณเข้าใช้งานบ่อยเกินไป</h2>

    <p>
      ระบบตรวจพบการเข้าถึงเว็บไซต์หลายครั้ง
      ในระยะเวลาสั้น ๆ เพื่อป้องกันการใช้งานที่ผิดปกติ
      กรุณารอสักครู่แล้วลองใหม่อีกครั้ง
    </p>

    <div class="timer-box">
      <div class="timer-label">
        สามารถเข้าใช้งานได้อีกครั้งใน
      </div>

      <div class="timer" id="countdown">--:--</div>
    </div>

    <button id="retryButton" disabled>
      กรุณารอสักครู่...
    </button>

    <div class="error-code">
      HTTP ERROR 429 · TOO MANY REQUESTS
    </div>
  </main>

  <script>
    (() => {
      let remaining = ${retryAfter};

      const countdown = document.getElementById('countdown');
      const button = document.getElementById('retryButton');

      function updateCountdown() {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        countdown.textContent =
          String(minutes).padStart(2, '0') +
          ':' +
          String(seconds).padStart(2, '0');

        if (remaining <= 0) {
          button.disabled = false;
          button.textContent = 'ลองเข้าเว็บไซต์อีกครั้ง';
          return;
        }

        button.disabled = true;
        button.textContent = 'กรุณารอสักครู่...';

        remaining--;
        setTimeout(updateCountdown, 1000);
      }

      button.addEventListener('click', () => {
        if (remaining <= 0) {
          window.location.reload();
        }
      });

      updateCountdown();
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 429,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': String(retryAfter),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Rate Limit เฉพาะการเปิดหน้าเว็บจริง ๆ
  // ไม่จำกัด API, tRPC หรือการโหลดไฟล์ Static
  const isApiRequest =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/trpc/');

  const isDocumentRequest =
    req.headers.get('sec-fetch-dest') === 'document' ||
    (req.headers.get('accept') ?? '').includes('text/html');

  if (!isApiRequest && isDocumentRequest) {
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

          return createRateLimitResponse(retryAfter);
        }
      } catch (error) {
        // หาก Redis มีปัญหา ให้เว็บยังใช้งานได้ตามปกติ
        console.error('[Page Rate Limit] Redis error:', error);
      }
    }
  }

  // API ให้แต่ละ API ตรวจ isUserBanned() เอง
  // หน้าที่คนโดนแบนเข้าได้ ไม่ต้องตรวจสถานะแบน
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

  // ตรวจสอบไม่ได้ → ปล่อยผ่านเหมือนเดิม
  if (isBanned !== true) {
    return NextResponse.next();
  }

  // คนโดนแบนเข้าได้เฉพาะ Home, Discover, Profile
  return NextResponse.redirect(new URL('/', req.url));
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
