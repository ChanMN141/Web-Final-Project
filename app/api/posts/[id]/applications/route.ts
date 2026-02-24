import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ServicePost from '@/models/ServicePost';
import Application from '@/models/Application';
import Review from '@/models/Review';
import { getSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/posts/[id]/applications - Get all applications for a post (Auth: SEEKER, owner only)
export async function GET(
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

    const applications = await Application.find({ postId: id })
      .populate('providerId', 'name email bio averageRating reviewCount verifiedAt')
      .sort({ createdAt: -1 })
      .lean();

    // Determine which applications already have a review
    const appIds = applications.map((a: any) => a._id);
    const reviews = await Review.find({ applicationId: { $in: appIds } })
      .select('applicationId')
      .lean();
    const reviewedSet = new Set(reviews.map((r: any) => r.applicationId.toString()));

    const result = applications.map((a: any) => ({
      ...a,
      hasReview: reviewedSet.has(a._id.toString()),
    }));

    return NextResponse.json({ success: true, applications: result });
  } catch (error) {
    console.error('GET /api/posts/[id]/applications error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
