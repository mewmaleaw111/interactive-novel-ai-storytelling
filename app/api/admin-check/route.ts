import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        isAdmin: false,
        message: 'ไม่ได้เข้าสู่ระบบ',
      },
      { status: 401 }
    );
  }

  const metadata = sessionClaims?.metadata as
    | {
        role?: string;
      }
    | undefined;

  const isAdmin = metadata?.role === 'admin';

  return NextResponse.json({
    success: true,
    isAdmin,
    role: metadata?.role ?? 'user',
  });
}