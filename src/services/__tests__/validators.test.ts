import { describe, it, expect } from 'vitest';
import { crmRecordSchema, hasContactInfo, splitBatchOutput } from '../validators.js';

describe('crmRecordSchema', () => {
  it('accepts a valid record', () => {
    const result = crmRecordSchema.safeParse({
      created_at: '2026-07-11',
      name: 'John Doe',
      email: 'john@example.com',
      mobile_without_country_code: '5551234',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'leads_on_demand',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid crm_status', () => {
    const result = crmRecordSchema.safeParse({
      crm_status: 'INVALID_STATUS',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid data_source', () => {
    const result = crmRecordSchema.safeParse({
      data_source: 'invalid_source',
    });
    expect(result.success).toBe(false);
  });

  it('applies defaults for missing fields', () => {
    const result = crmRecordSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.crm_status).toBe('DID_NOT_CONNECT');
      expect(result.data.data_source).toBe('');
      expect(result.data.name).toBe('');
    }
  });
});

describe('hasContactInfo', () => {
  it('returns true for row with email', () => {
    expect(hasContactInfo({ 'E-mail': 'test@example.com' })).toBe(true);
  });

  it('returns true for row with phone', () => {
    expect(hasContactInfo({ 'PhoneNumber': '5551234' })).toBe(true);
  });

  it('returns true for row with mobile', () => {
    expect(hasContactInfo({ 'mobile_number': '5551234' })).toBe(true);
  });

  it('returns true for row with contact keyword', () => {
    expect(hasContactInfo({ 'contact_info': '5551234' })).toBe(true);
  });

  it('returns false for row with no contact fields', () => {
    expect(hasContactInfo({ 'NAME': 'John', 'COMPANY': 'Acme' })).toBe(false);
  });

  it('returns false for empty values', () => {
    expect(hasContactInfo({ 'email': '', 'phone': '' })).toBe(false);
  });

  it('handles messy column names', () => {
    expect(hasContactInfo({ 'e-mail address': 'a@b.com' })).toBe(true);
    expect(hasContactInfo({ 'E MAIL': 'a@b.com' })).toBe(true);
  });
});

describe('splitBatchOutput', () => {
  it('splits valid and invalid records', () => {
    const records = [
      { crm_status: 'GOOD_LEAD_FOLLOW_UP', name: 'Valid' },
      { crm_status: 'TOTALLY_WRONG', name: 'Invalid' },
      { crm_status: 'SALE_DONE', name: 'Also valid' },
    ];
    const { valid, invalid } = splitBatchOutput(records);
    expect(valid).toHaveLength(2);
    expect(invalid).toHaveLength(1);
    expect(invalid[0].reason).toContain('crm_status');
  });

  it('returns all valid for clean records', () => {
    const records = [
      { crm_status: 'BAD_LEAD' },
      { crm_status: 'DID_NOT_CONNECT' },
    ];
    const { valid, invalid } = splitBatchOutput(records);
    expect(valid).toHaveLength(2);
    expect(invalid).toHaveLength(0);
  });
});
