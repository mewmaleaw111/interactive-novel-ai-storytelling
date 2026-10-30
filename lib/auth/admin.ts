import { auth } from '@clerk/nextjs/server';

export async function isAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return false;
  }

  const metadata = sessionClaims?.metadata as
    | {
        role?: string;
      }
    | undefined;

  return metadata?.role === 'admin';
}