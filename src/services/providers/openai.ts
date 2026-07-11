import { createOpenAICompatibleProvider } from './openaiCompatible.js';

export function createOpenAIProvider() {
  return createOpenAICompatibleProvider({
    name: 'openai',
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o',
  });
}
