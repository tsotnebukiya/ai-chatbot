import { mistral } from '@ai-sdk/mistral';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export const myProvider = customProvider({
  languageModels: {
    'chat-model': mistral('mistral-large-latest'),
    'chat-model-reasoning': wrapLanguageModel({
      model: mistral('mistral-large-latest'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': mistral('mistral-small-latest'),
  },
});
