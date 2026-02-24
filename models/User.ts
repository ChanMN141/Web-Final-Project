import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'SEEKER' | 'PROVIDER';
  bio?: string;
  skills: Types.ObjectId[];
  location?: { city?: string; country?: string; remote?: boolean };
  verifiedAt?: Date;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['SEEKER', 'PROVIDER'],
      required: [true, 'Please specify a role'],
    },
    bio: { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'] },
    skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    location: {
      city: { type: String, trim: true, maxlength: 100 },
      country: { type: String, trim: true, maxlength: 100 },
      remote: { type: Boolean, default: false },
    },
    verifiedAt: { type: Date, default: null },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Pre-save hook to hash password (Mongoose 8+ async style — no next() required)
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (this as any).password = await bcrypt.hash((this as any).password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
