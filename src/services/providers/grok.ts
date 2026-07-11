import { createOpenAICompatibleProvider } from './openaiCompatible.js';

export function createGrokProvider() {
  return createOpenAICompatibleProvider({
    name: 'grok',
    baseURL: 'https://api.x.ai/v1',
    apiKey: process.env.GROK_API_KEY || '',
    model: 'grok-2-latest',
  });
}
