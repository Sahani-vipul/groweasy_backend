import { getAIProvider, type AIMappingInput, type AIMappingResult } from './providers/index.js';
import { splitBatchOutput, hasContactInfo } from './validators.js';
import { Lead } from '../models/Lead.js';
import { ImportBatch } from '../models/ImportBatch.js';
import { SkippedRecord } from '../models/SkippedRecord.js';
import type { CRMRecord, ExtractResponse } from '../types/crm.js';
import type mongoose from 'mongoose';

const BATCH_SIZE = 20;
const CONCURRENCY = 2;

async function processBatch(
  headers: string[],
  rows: any[][],
  rowIndices: number[],
  provider: ReturnType<typeof getAIProvider>
): Promise<AIMappingResult> {
  const input: AIMappingInput = { headers, rows };
  return provider.mapRowsToCRM(input);
}

async function processBatchWithRetry(
  headers: string[],
  rows: any[][],
  rowIndices: number[],
  provider: ReturnType<typeof getAIProvider>
): Promise<AIMappingResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await processBatch(headers, rows, rowIndices, provider);
      if (result.records.length > 0) return result;
      if (attempt < 2) console.warn(`Batch returned empty response, retrying (attempt ${attempt + 2})...`);
    } catch (err) {
      if (attempt < 2) console.warn(`Batch failed (attempt ${attempt + 2}): ${err instanceof Error ? err.message : err}`);
    }
  }
  console.error(`Batch failed after 3 attempts, skipping ${rows.length} rows`);
  return {
    records: [],
    errors: rowIndices.map(ri => ({ rowIndex: ri, reason: 'AI provider returned empty or invalid response after retries' })),
  };
}

async function processInBatches(
  headers: string[],
  rows: any[][],
  provider: ReturnType<typeof getAIProvider>
): Promise<AIMappingResult> {
  const allRecords: any[] = [];
  const allErrors: { rowIndex: number; reason: string }[] = [];

  const batches: { rows: any[][]; indices: number[] }[] = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push({
      rows: rows.slice(i, i + BATCH_SIZE),
      indices: Array.from({ length: Math.min(BATCH_SIZE, rows.length - i) }, (_, k) => i + k),
    });
  }

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(b => processBatchWithRetry(headers, b.rows, b.indices, provider))
    );
    for (const result of results) {
      allRecords.push(...result.records);
      allErrors.push(...result.errors);
    }
  }

  return { records: allRecords, errors: allErrors };
}

export async function processCSVExtract(
  headers: string[],
  rows: any[][],
  batchId: mongoose.Types.ObjectId
): Promise<ExtractResponse> {
  const provider = getAIProvider();
  console.log(`Using AI provider: ${provider.name}`);

  let aiResult: AIMappingResult;

  try {
    aiResult = await processInBatches(headers, rows, provider);
  } catch (err) {
    console.error(`AI provider ${provider.name} failed:`, err);
    throw new Error(`AI processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  const recordsWithContact = aiResult.records.filter((_: any, i: number) => {
    const originalRow = rows[i] || {};
    const rowObj: Record<string, any> = {};
    headers.forEach((h, j) => { rowObj[h] = originalRow[j]; });
    return hasContactInfo(rowObj);
  });

  const recordsWithoutContact = aiResult.records.filter((_: any, i: number) => {
    const originalRow = rows[i] || {};
    const rowObj: Record<string, any> = {};
    headers.forEach((h, j) => { rowObj[h] = originalRow[j]; });
    return !hasContactInfo(rowObj);
  });

  const { valid, invalid: validationInvalid } = splitBatchOutput(recordsWithContact);

  const now = new Date().toISOString();
  const normalized = valid.map(record => ({
    ...record,
    created_at: record.created_at && !isNaN(new Date(record.created_at).getTime())
      ? record.created_at
      : now,
  }));

  const skipped: { row: any; reason: string }[] = [
    ...recordsWithoutContact.map((row, i) => ({ row, reason: 'No contact information (email or phone) found' })),
    ...validationInvalid,
    ...aiResult.errors.map(e => ({ row: rows[e.rowIndex] || {}, reason: e.reason })),
  ];

  const insertedLeads = await Lead.insertMany(
    normalized.map(record => ({ ...record, batchId }))
  );

  if (skipped.length > 0) {
    await SkippedRecord.insertMany(
      skipped.map(s => ({ batchId, originalRow: s.row, reason: s.reason }))
    );
  }

  return {
    imported: insertedLeads as unknown as CRMRecord[],
    skipped,
    summary: {
      totalRows: rows.length,
      importedCount: insertedLeads.length,
      skippedCount: skipped.length,
    },
  };
}

export async function createImportBatch(
  fileName: string,
  totalRows: number,
  importedCount: number,
  skippedCount: number
) {
  return ImportBatch.create({ fileName, totalRows, totalImported: importedCount, totalSkipped: skippedCount });
}
