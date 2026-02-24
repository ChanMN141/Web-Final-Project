import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationType =
  | 'NEW_APPLICATION'
  | 'STATUS_CHANGED'
  | 'NEW_REVIEW'
  | 'NEW_POST_MATCH';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['NEW_APPLICATION', 'STATUS_CHANGED', 'NEW_REVIEW', 'NEW_POST_MATCH'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 300 },
    link: { type: String, maxlength: 200 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
// Auto-expire after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
