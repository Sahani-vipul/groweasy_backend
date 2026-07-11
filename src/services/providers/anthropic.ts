import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIMappingInput, AIMappingResult } from './types.js';
import { SYSTEM_PROMPT } from './systemPrompt.js';
import { parseAIResponse } from './responseParser.js';

function buildUserPrompt(input: AIMappingInput): string {
  const sampleRows = input.rows.slice(0, 50);
  return `Headers: ${JSON.stringify(input.headers)}

Data rows:
${JSON.stringify(sampleRows)}

Map these to CRM records. Return a JSON array with each record including a "_row_index" field matching its position (0-indexed) in the input array.`;
}

export function createAnthropicProvider(): AIProvider {
  const client = new Anthropic();

  return {
    name: 'anthropic',

    async mapRowsToCRM(input: AIMappingInput): Promise<AIMappingResult> {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(input) }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      return parseAIResponse(text, input.rows.length);
    },
  };
}

export { parseAIResponse } from './responseParser.js';
