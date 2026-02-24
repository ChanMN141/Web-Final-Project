import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReview extends Document {
  seekerId: Types.ObjectId;
  providerId: Types.ObjectId;
  applicationId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    seekerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true, // one review per application
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500, trim: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ providerId: 1, createdAt: -1 });
ReviewSchema.index({ seekerId: 1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
