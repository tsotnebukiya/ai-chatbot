import { getFeatureFlags } from '@/lib/config/features';
import { Suspense } from 'react';
import { AuthPageFallback, RegisterContent } from './register-component';

export default function Page() {
  const featureFlags = getFeatureFlags();

  return (
    <Suspense fallback={<AuthPageFallback />}>
      <RegisterContent featureFlags={featureFlags} />
    </Suspense>
  );
}
