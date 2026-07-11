import { z } from 'zod';
import type { CRMRecord } from '../types/crm.js';

const CRM_STATUS_ENUM = z.enum([
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
]);

const DATA_SOURCE_ENUM = z.enum([
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
  '',
]);

export const crmRecordSchema = z.object({
  created_at: z.string().default(''),
  name: z.string().default(''),
  email: z.string().default(''),
  country_code: z.string().default(''),
  mobile_without_country_code: z.string().default(''),
  company: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  country: z.string().default(''),
  lead_owner: z.string().default(''),
  crm_status: CRM_STATUS_ENUM.default('DID_NOT_CONNECT'),
  crm_note: z.string().default(''),
  data_source: DATA_SOURCE_ENUM.default(''),
  possession_time: z.string().default(''),
  description: z.string().default(''),
});

export function hasContactInfo(row: Record<string, any>): boolean {
  for (const [key, val] of Object.entries(row)) {
    const k = key.toLowerCase();
    const v = String(val || '').trim();
    if (v.length === 0) continue;
    if (k.includes('email') || k.includes('e-mail') || k.includes('mail')) return true;
    if (k.includes('phone') || k.includes('mobile') || k.includes('contact')) return true;
  }
  return false;
}

export function splitBatchOutput(records: any[]): { valid: CRMRecord[]; invalid: { row: any; reason: string }[] } {
  const valid: CRMRecord[] = [];
  const invalid: { row: any; reason: string }[] = [];

  for (const record of records) {
    const result = crmRecordSchema.safeParse(record);
    if (result.success) {
      valid.push(result.data);
    } else {
      const reason = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      invalid.push({ row: record, reason });
    }
  }

  return { valid, invalid };
}
