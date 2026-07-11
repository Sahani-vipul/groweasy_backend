import type { AIMappingResult } from './types.js';

export function parseAIResponse(text: string, rowCount: number): AIMappingResult {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return {
      records: [],
      errors: [{ rowIndex: -1, reason: 'No JSON array found in AI response' }],
    };
  }

  try {
    const records = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(records)) {
      return {
        records: [],
        errors: [{ rowIndex: -1, reason: 'AI response is not an array' }],
      };
    }
    return { records, errors: [] };
  } catch {
    return {
      records: [],
      errors: [{ rowIndex: -1, reason: 'Failed to parse AI response JSON' }],
    };
  }
}
