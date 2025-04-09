import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { customProvider } from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'openai-multimodal-model';

export const myProvider = customProvider({
  languageModels: {
    // Multimodal models
    'openai-multimodal-model': openai('gpt-4o'),
    'title-model': openai('gpt-4-turbo'),
    'block-model': openai('gpt-4o-mini'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'openai-multimodal-model',
    name: 'OpenAI Model (Multimodal)',
    description: 'GPT-4o with image and text understanding',
  },
];