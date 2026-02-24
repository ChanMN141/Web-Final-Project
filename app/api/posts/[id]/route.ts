import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import ServicePost from '@/models/ServicePost';
import Application from '@/models/Application';
import { getSession, unauthorizedResponse } from '@/lib/auth';

const UpdatePostSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  category: z.string().optional(),
  budget: z.number().min(0).optional(),
  requiredSkills: z.array(z.string()).optional(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
    remote: z.boolean().optional(),
  }).optional(),
  milestones: z.array(z.object({
    title: z.string().min(1),
    amount: z.number().min(0),
    dueDate: z.string().optional(),
  })).optional(),
});

// GET /api/posts/[id] - Get a single post (public)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const post = await ServicePost.findById(id).populate('userId', 'name email').lean();
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/posts/[id] - Update post (Auth: SEEKER, owner only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'SEEKER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const post = await ServicePost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    if (post.userId.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden: not your post' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = UpdatePostSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await ServicePost.findByIdAndUpdate(id, parseResult.data, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error('PATCH /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - Delete post (Auth: SEEKER, owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'SEEKER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const post = await ServicePost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    if (post.userId.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden: not your post' }, { status: 403 });
    }

    // Cascade delete associated applications
    await Application.deleteMany({ postId: id });
    await ServicePost.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
