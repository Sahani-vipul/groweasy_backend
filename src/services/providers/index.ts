import type { AIProvider } from './types.js';
import { createAnthropicProvider } from './anthropic.js';
import { createOpenAIProvider } from './openai.js';
import { createGeminiProvider } from './gemini.js';
import { createGrokProvider } from './grok.js';
import { createNvidiaProvider } from './nvidia.js';

const providers: Record<string, () => AIProvider> = {
  anthropic: createAnthropicProvider,
  openai: createOpenAIProvider,
  gemini: createGeminiProvider,
  grok: createGrokProvider,
  nvidia: createNvidiaProvider,
};

export function getAIProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER || 'nvidia').toLowerCase();
  const factory = providers[name];

  if (!factory) {
    console.warn(`Unknown AI provider "${name}", falling back to nvidia`);
    return createNvidiaProvider();
  }

  return factory();
}

export type { AIProvider, AIMappingInput, AIMappingResult } from './types.js';
