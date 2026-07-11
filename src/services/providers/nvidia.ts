import { createOpenAICompatibleProvider } from './openaiCompatible.js';

export function createNvidiaProvider() {
  return createOpenAICompatibleProvider({
    name: 'nvidia',
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY || '',
    model: process.env.NVIDIA_MODEL || 'openai/gpt-oss-120b',
  });
}
