'use client';

// Client-side cookie utilities for chat tools
export function saveChatToolsToClientCookie(chatId: string, tools: string[]) {
  if (typeof document === 'undefined') return;

  const currentCookie = getCookie('chat-tools') || '{}';

  try {
    const currentTools = JSON.parse(decodeURIComponent(currentCookie));
    currentTools[chatId] = tools;
    // Also save as default for new chats
    currentTools.__default__ = tools;

    setCookie('chat-tools', JSON.stringify(currentTools));
  } catch (_error) {
    // If parsing fails, create new object
    const newTools = { [chatId]: tools, __default__: tools };
    setCookie('chat-tools', JSON.stringify(newTools));
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  // biome-ignore lint/suspicious/noDocumentCookie: <false positive>
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${days * 24 * 60 * 60}`;
}
