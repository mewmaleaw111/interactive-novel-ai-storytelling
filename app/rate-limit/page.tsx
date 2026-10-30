
import RateLimitPage from '@/components/errors/RateLimitPage';

interface PageProps {
  searchParams: Promise<{
    retryAfter?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsedRetryAfter = Number(params.retryAfter ?? 60);

  const retryAfter = Number.isFinite(parsedRetryAfter)
    ? Math.min(3600, Math.max(1, Math.ceil(parsedRetryAfter)))
    : 60;

  return <RateLimitPage retryAfter={retryAfter} />;
}
