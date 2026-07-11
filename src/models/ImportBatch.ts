import mongoose, { Schema, Document } from 'mongoose';

export interface IImportBatch extends Document {
  fileName: string;
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  createdAt: Date;
}

const importBatchSchema = new Schema<IImportBatch>({
  fileName: { type: String, required: true },
  totalRows: { type: Number, required: true },
  totalImported: { type: Number, required: true },
  totalSkipped: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ImportBatch = mongoose.model<IImportBatch>('ImportBatch', importBatchSchema);
