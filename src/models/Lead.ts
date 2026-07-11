import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
  batchId: mongoose.Types.ObjectId;
  insertedAt: Date;
}

const leadSchema = new Schema<ILead>({
  created_at: { type: String, default: '' },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  country_code: { type: String, default: '' },
  mobile_without_country_code: { type: String, default: '' },
  company: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  lead_owner: { type: String, default: '' },
  crm_status: { type: String, default: '' },
  crm_note: { type: String, default: '' },
  data_source: { type: String, default: '' },
  possession_time: { type: String, default: '' },
  description: { type: String, default: '' },
  batchId: { type: Schema.Types.ObjectId, ref: 'ImportBatch', required: true },
  insertedAt: { type: Date, default: Date.now },
});

leadSchema.index({ email: 1 });
leadSchema.index({ mobile_without_country_code: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
