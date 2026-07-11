import OpenAI from 'openai';
import type { AIProvider, AIMappingInput, AIMappingResult } from './types.js';
import { SYSTEM_PROMPT } from './systemPrompt.js';
import { parseAIResponse } from './responseParser.js';

export interface OpenAICompatibleConfig {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

function buildUserPrompt(input: AIMappingInput): string {
  const sampleRows = input.rows.slice(0, 50);
  return `Headers: ${JSON.stringify(input.headers)}

Data rows:
${JSON.stringify(sampleRows)}

Map these to CRM records. Return a JSON array with each record including a "_row_index" field matching its position (0-indexed) in the input array.`;
}

export function createOpenAICompatibleProvider(config: OpenAICompatibleConfig): AIProvider {
  const client = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });

  return {
    name: config.name,

    async mapRowsToCRM(input: AIMappingInput): Promise<AIMappingResult> {
      const response = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        temperature: 0.1,
        max_tokens: 8192,
      });

      const text = response.choices[0]?.message?.content || '';
      console.log(`[${config.name}] Response length: ${text.length}, preview: ${text.substring(0, 200)}`);
      return parseAIResponse(text, input.rows.length);
    },
  };
}
