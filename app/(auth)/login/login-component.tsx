'use client';

import { AuthBetter } from '@/components/auth-better';
import type { FeatureFlags } from '@/lib/config/features';
import { useSearchParams } from 'next/navigation';

export function LoginContent({ featureFlags }: { featureFlags: FeatureFlags }) {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') ?? '/';

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md">
        <AuthBetter
          mode="login"
          redirectTo={redirectUrl}
          featureFlags={featureFlags}
        />
      </div>
    </div>
  );
}

export function AuthPageFallback() {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <span className="text-muted-foreground text-sm">Loading…</span>
    </div>
  );
}
