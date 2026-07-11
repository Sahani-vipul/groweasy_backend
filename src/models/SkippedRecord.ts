import mongoose, { Schema, Document } from 'mongoose';

export interface ISkippedRecord extends Document {
  batchId: mongoose.Types.ObjectId;
  originalRow: Record<string, any>;
  reason: string;
  createdAt: Date;
}

const skippedRecordSchema = new Schema<ISkippedRecord>({
  batchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch', required: true },
  originalRow: { type: Schema.Types.Mixed, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const SkippedRecord = mongoose.model<ISkippedRecord>('SkippedRecord', skippedRecordSchema);
