import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Design & Creative',
  'Writing & Content',
  'Data & Analytics',
  'Digital Marketing',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export interface IMilestone {
  _id: Types.ObjectId;
  title: string;
  amount: number;
  dueDate?: Date;
  completed: boolean;
}

export interface IServicePost extends Document {
  userId: Types.ObjectId;
  title: string;
  description: string;
  category: Category;
  budget: number;
  status: 'OPEN' | 'CLOSED';
  requiredSkills: Types.ObjectId[];
  location?: { city?: string; country?: string; remote?: boolean };
  milestones: IMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const ServicePostSchema: Schema<IServicePost> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'UserId is required'] },
    title: {
      type: String, required: [true, 'Title is required'], trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String, required: [true, 'Description is required'], trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: { type: String, required: [true, 'Category is required'], enum: { values: CATEGORIES, message: 'Invalid category' } },
    budget: { type: Number, required: [true, 'Budget is required'], min: [0, 'Budget must be a positive number'] },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    requiredSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    location: {
      city: { type: String, trim: true, maxlength: 100 },
      country: { type: String, trim: true, maxlength: 100 },
      remote: { type: Boolean, default: false },
    },
    milestones: { type: [MilestoneSchema], default: [] },
  },
  { timestamps: true }
);

ServicePostSchema.index({ status: 1, category: 1, createdAt: -1 });
ServicePostSchema.index({ userId: 1, createdAt: -1 });
ServicePostSchema.index({ requiredSkills: 1 });
ServicePostSchema.index({ 'location.country': 1, 'location.city': 1 });

const ServicePost: Model<IServicePost> =
  mongoose.models.ServicePost ||
  mongoose.model<IServicePost>('ServicePost', ServicePostSchema);

export default ServicePost;
