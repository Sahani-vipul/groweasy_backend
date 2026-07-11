import { GoogleGenerativeAI } from '@google/generative-ai';
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

export function createGeminiProvider(): AIProvider {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  return {
    name: 'gemini',

    async mapRowsToCRM(input: AIMappingInput): Promise<AIMappingResult> {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(buildUserPrompt(input));
      const text = result.response.text();
      return parseAIResponse(text, input.rows.length);
    },
  };
}
