import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  type LanguageModelUsage,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { updateChatLastContextById } from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';

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
  const startTime = performance.now();
  console.log('🚀 Chat API POST request started');

  let requestBody: PostRequestBody;

  try {
    const parseStart = performance.now();
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
    console.log(
      `📝 Request parsing: ${(performance.now() - parseStart).toFixed(2)}ms`,
    );
  } catch (error) {
    console.log('❌ Request parsing failed', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
    } = requestBody;

    console.log(`🎯 Processing chat: ${id}, model: ${selectedChatModel}`);

    const authStart = performance.now();
    const session = await auth();
    console.log(
      `🔐 Authentication: ${(performance.now() - authStart).toFixed(2)}ms`,
    );

    if (!session?.user) {
      console.log('❌ No user session found');
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type ?? 'regular';

    const rateLimitStart = performance.now();
    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });
    console.log(
      `📊 Rate limit check: ${(performance.now() - rateLimitStart).toFixed(2)}ms`,
    );

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      console.log('🚫 Rate limit exceeded');
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chatRetrievalStart = performance.now();
    const chat = await getChatById({ id });
    console.log(
      `🗃️ Chat retrieval: ${(performance.now() - chatRetrievalStart).toFixed(2)}ms`,
    );

    if (!chat) {
      const titleStart = performance.now();
      const title = await generateTitleFromUserMessage({
        message,
      });
      console.log(
        `📝 Title generation: ${(performance.now() - titleStart).toFixed(2)}ms`,
      );

      const saveChatStart = performance.now();
      await saveChat({
        id,
        userId: session.user.id,
        title,
      });
      console.log(
        `💾 Chat creation: ${(performance.now() - saveChatStart).toFixed(2)}ms`,
      );
    } else {
      if (chat.userId !== session.user.id) {
        console.log('❌ User not authorized for this chat');
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messageHistoryStart = performance.now();
    const messagesFromDb = await getMessagesByChatId({ id });
    console.log(
      `📜 Message history retrieval: ${(performance.now() - messageHistoryStart).toFixed(2)}ms, ${messagesFromDb.length} messages`,
    );

    const messageProcessingStart = performance.now();
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];
    console.log(
      `🔄 Message processing: ${(performance.now() - messageProcessingStart).toFixed(2)}ms`,
    );

    const geoStart = performance.now();
    const { longitude, latitude, city, country } = geolocation(request);
    console.log(
      `🌍 Geolocation: ${(performance.now() - geoStart).toFixed(2)}ms`,
    );

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    const saveMessageStart = performance.now();
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
    console.log(
      `💾 User message save: ${(performance.now() - saveMessageStart).toFixed(2)}ms`,
    );

    const streamSetupStart = performance.now();
    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });
    console.log(
      `🔄 Stream setup: ${(performance.now() - streamSetupStart).toFixed(2)}ms`,
    );

    let finalUsage: LanguageModelUsage | undefined;

    const aiResponseStart = performance.now();
    console.log(
      `🤖 Starting AI response generation with model: ${selectedChatModel}`,
    );

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const streamTextStart = performance.now();
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning' ? [] : ['getWeather'],
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: {
            getWeather,
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
          onFinish: ({ usage }) => {
            finalUsage = usage;
            dataStream.write({ type: 'data-usage', data: usage });
            console.log(`📊 AI usage: ${JSON.stringify(usage)}`);
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
        console.log(
          `🤖 StreamText execution: ${(performance.now() - streamTextStart).toFixed(2)}ms`,
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        const saveAssistantStart = performance.now();
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
        console.log(
          `💾 Assistant message save: ${(performance.now() - saveAssistantStart).toFixed(2)}ms`,
        );

        if (finalUsage) {
          try {
            const usagePersistStart = performance.now();
            await updateChatLastContextById({
              chatId: id,
              context: finalUsage,
            });
            console.log(
              `💾 Usage persistence: ${(performance.now() - usagePersistStart).toFixed(2)}ms`,
            );
          } catch (err) {
            console.warn('Unable to persist last usage for chat', id, err);
          }
        }
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
    console.log(
      `🤖 AI response generation setup: ${(performance.now() - aiResponseStart).toFixed(2)}ms`,
    );

    const responseStart = performance.now();
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

    const totalTime = performance.now() - startTime;
    console.log(
      `📤 Response streaming: ${(performance.now() - responseStart).toFixed(2)}ms`,
    );
    console.log(`✅ Total request time: ${totalTime.toFixed(2)}ms`);
    console.log('=== Chat API Performance Summary ===');
    console.log(`Chat ID: ${id}`);
    console.log(`Model: ${selectedChatModel}`);
    console.log(`Messages in history: ${messagesFromDb.length}`);
    console.log(`Total duration: ${totalTime.toFixed(2)}ms`);
    console.log('====================================');

    return response;
  } catch (error) {
    const errorTime = performance.now() - startTime;
    console.log(`❌ Error occurred after: ${errorTime.toFixed(2)}ms`);
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
  const startTime = performance.now();
  console.log('🗑️ Chat API DELETE request started');

  const parseStart = performance.now();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  console.log(
    `📝 Request parsing: ${(performance.now() - parseStart).toFixed(2)}ms`,
  );

  if (!id) {
    console.log('❌ No chat ID provided');
    return new ChatSDKError('bad_request:api').toResponse();
  }

  console.log(`🎯 Deleting chat: ${id}`);

  const authStart = performance.now();
  const session = await auth();
  console.log(
    `🔐 Authentication: ${(performance.now() - authStart).toFixed(2)}ms`,
  );

  if (!session?.user) {
    console.log('❌ No user session found');
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chatRetrievalStart = performance.now();
  const chat = await getChatById({ id });
  console.log(
    `🗃️ Chat retrieval: ${(performance.now() - chatRetrievalStart).toFixed(2)}ms`,
  );

  if (chat?.userId !== session.user.id) {
    console.log('❌ User not authorized for this chat');
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletionStart = performance.now();
  const deletedChat = await deleteChatById({ id });
  console.log(
    `🗑️ Chat deletion: ${(performance.now() - deletionStart).toFixed(2)}ms`,
  );

  const totalTime = performance.now() - startTime;
  console.log(`✅ DELETE request completed in: ${totalTime.toFixed(2)}ms`);
  console.log('=== Chat API DELETE Performance Summary ===');
  console.log(`Chat ID: ${id}`);
  console.log(`Total duration: ${totalTime.toFixed(2)}ms`);
  console.log('===========================================');

  return Response.json(deletedChat, { status: 200 });
}
