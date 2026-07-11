import type { CRMRecord } from '../../types/crm.js';

export interface AIMappingInput {
  headers: string[];
  rows: any[][];
}

export interface AIMappingResult {
  records: Partial<CRMRecord>[];
  errors: { rowIndex: number; reason: string }[];
}

export interface AIProvider {
  name: string;
  mapRowsToCRM(input: AIMappingInput): Promise<AIMappingResult>;
}
