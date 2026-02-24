import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import Application from '@/models/Application';
import ServicePost from '@/models/ServicePost';
import { getSession, unauthorizedResponse } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

const CreateApplicationSchema = z.object({
  postId: z.string().min(1, 'PostId is required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

// GET /api/applications - Get provider's own applications (Auth: PROVIDER)
export async function GET(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'PROVIDER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const applications = await Application.find({ providerId: session.userId })
      .populate({
        path: 'postId',
        select: 'title category budget status userId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('GET /api/applications error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/applications - Apply to a post (Auth: PROVIDER)
export async function POST(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Only Service Providers can apply to posts' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const parseResult = CreateApplicationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { postId, message } = parseResult.data;

    // Check post exists and is open
    const post = await ServicePost.findById(postId);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }
    if (post.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: 'This post is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Prevent self-application
    if (post.userId.toString() === session.userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot apply to your own post' },
        { status: 400 }
      );
    }

    // Check for duplicate application
    const existing = await Application.findOne({ postId, providerId: session.userId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You have already applied to this post' },
        { status: 409 }
      );
    }

    const application = await Application.create({
      postId,
      providerId: session.userId,
      message,
    });

    // Notify the seeker that someone applied to their post
    await createNotification({
      userId: post.userId.toString(),
      type: 'NEW_APPLICATION',
      title: 'New Application Received',
      message: `A provider applied to your post "${post.title}"`,
      link: '/dashboard/seeker',
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error: unknown) {
    // Handle MongoDB duplicate key error (race condition safety net)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { success: false, error: 'You have already applied to this post' },
        { status: 409 }
      );
    }
    console.error('POST /api/applications error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
