import { generateTitleFromUserMessage } from '@/app/(chat)/actions';
import { createChatStream } from '@/lib/ai/agent';
import type { ChatModel } from '@/lib/ai/models';
import type { RequestHints } from '@/lib/ai/prompts';
import { requireAuth } from '@/lib/auth/session';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { geolocation } from '@vercel/functions';
import { JsonToSseTransformStream } from 'ai';
import { after } from 'next/server';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { type PostRequestBody, postRequestBodySchema } from './schema';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      console.error(error);
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    console.log('❌ Request parsing failed', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      enabledTools,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      enabledTools: string[];
    } = requestBody;

    const session = await requireAuth();
    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });
      await saveChat({
        id,
        userId: session.user.id,
        title,
      });
    } else {
      if (chat.userId !== session.user.id) {
        console.log('❌ User not authorized for this chat');
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];
    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createChatStream({
      chatId: id,
      enabledTools,
      messages: uiMessages,
      requestHints,
      selectedChatModel,
    });
    const streamContext = getStreamContext();

    let response: Response;
    if (streamContext) {
      response = new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      response = new Response(
        stream.pipeThrough(new JsonToSseTransformStream()),
      );
    }

    return response;
  } catch (error) {
    console.error('Unhandled error in chat API:', error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for OpenAI API key error
    if (error instanceof Error && error.message?.includes('API key')) {
      console.log('❌ OpenAI API key error');
      return new ChatSDKError('bad_request:api').toResponse();
    }

    return new ChatSDKError('offline:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await requireAuth();

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    console.log('❌ User not authorized for this chat');
    return new ChatSDKError('forbidden:chat').toResponse();
  }
  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
