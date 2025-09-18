'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthBetter } from '@/components/auth-better';

export default function Page() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') ?? '/';

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md">
        <AuthBetter mode="login" redirectTo={redirectUrl} />
      </div>
    </div>
  );
}

function AuthPageFallback() {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <span className="text-muted-foreground text-sm">Loading…</span>
    </div>
  );
}
