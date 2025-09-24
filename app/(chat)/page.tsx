import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getSession } from '@/lib/auth/session';
import { getFeatureFlags } from '@/lib/config/features';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect(`/login?redirectUrl=${encodeURIComponent('/')}`);
  }

  const id = generateUUID();
  const featureFlags = getFeatureFlags();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          isReadonly={false}
          session={session}
          autoResume={false}
          featureFlags={featureFlags}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        isReadonly={false}
        session={session}
        autoResume={false}
        featureFlags={featureFlags}
      />
      <DataStreamHandler />
    </>
  );
}
