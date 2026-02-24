import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IApplication extends Document {
  postId: Types.ObjectId;
  providerId: Types.ObjectId;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema<IApplication> = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'ServicePost',
      required: [true, 'PostId is required'],
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ProviderId is required'],
    },
    message: {
      type: String,
      required: [true, 'Cover message is required'],
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

// Unique compound index - prevents duplicate applications
ApplicationSchema.index({ postId: 1, providerId: 1 }, { unique: true });
ApplicationSchema.index({ providerId: 1, createdAt: -1 });
ApplicationSchema.index({ postId: 1, status: 1 });

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application;
