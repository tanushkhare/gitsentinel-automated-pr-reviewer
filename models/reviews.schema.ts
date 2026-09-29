import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  prNumber: number;
  repoName: string;
  owner: string;
  headSha: string;
  status: 'pending' | 'completed' | 'failed';
  reviewSummary?: string;
  securityFlags: Array<{
    ruleId: string;
    severity: string;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    prNumber: { type: Number, required: true },
    repoName: { type: String, required: true },
    owner: { type: String, required: true },
    headSha: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    reviewSummary: { type: String },
    securityFlags: [
      {
        ruleId: String,
        severity: String,
        description: String,
      },
    ],
  },
  { timestamps: true }
);

ReviewSchema.index({ repoName: 1, prNumber: 1 }, { unique: true });

export const ReviewModel = model<IReview>('Review', ReviewSchema);