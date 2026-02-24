import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { getSession, unauthorizedResponse } from '@/lib/auth';

const ProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  location: z.object({
    city: z.string().max(100).optional().or(z.literal('')),
    country: z.string().max(100).optional().or(z.literal('')),
    remote: z.boolean().optional(),
  }).optional(),
});

// PATCH /api/auth/profile — update current user's profile
export async function PATCH(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();

    await connectToDatabase();

    const body = await request.json();
    const parseResult = ProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    const { name, bio, skills, location } = parseResult.data;

    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;

    // Skills only for PROVIDERs
    if (skills !== undefined) {
      if (session.role !== 'PROVIDER') {
        return NextResponse.json(
          { success: false, error: 'Only providers can set skills' },
          { status: 403 }
        );
      }
      updates.skills = skills;
    }

    const user = await User.findByIdAndUpdate(
      session.userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('skills', 'name category')
      .select('-password');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('PATCH /api/auth/profile error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/auth/profile — get current user's full profile (with skills populated)
export async function GET(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();

    await connectToDatabase();

    const user = await User.findById(session.userId)
      .populate('skills', 'name category')
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('GET /api/auth/profile error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
