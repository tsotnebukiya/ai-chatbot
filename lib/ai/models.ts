export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Mistral Large',
    description:
      'Flagship Mistral general model (mistral-large-latest, 128K context) for high‑quality chat.',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Mistral Large (Reasoning)',
    description:
      'Same model with <think> tag extraction enabled for step-by-step reasoning display.',
  },
];
