import { getFeatureFlags } from '@/lib/config/features';
import { Suspense } from 'react';
import { AuthPageFallback, LoginContent } from './login-component';

export default function Page() {
  const featureFlags = getFeatureFlags();
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LoginContent featureFlags={featureFlags} />
    </Suspense>
  );
}
