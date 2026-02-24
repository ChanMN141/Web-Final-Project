import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import ServicePost from '@/models/ServicePost';
import Application from '@/models/Application';
import { getSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/posts/my - Get current seeker's own posts with application counts
export async function GET(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'SEEKER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const posts = await ServicePost.find({ userId: session.userId })
      .populate('requiredSkills', 'name category')
      .sort({ createdAt: -1 })
      .lean();

    // Get application counts for each post
    const postIds = posts.map(p => p._id);
    const applicationCounts = await Application.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 }, pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } } } },
    ]);

    const countMap = Object.fromEntries(
      applicationCounts.map(a => [a._id.toString(), { count: a.count, pending: a.pending }])
    );

    const postsWithCounts = posts.map(post => ({
      ...post,
      applicationCount: countMap[post._id.toString()]?.count || 0,
      pendingCount: countMap[post._id.toString()]?.pending || 0,
    }));

    return NextResponse.json({ success: true, posts: postsWithCounts });
  } catch (error) {
    console.error('GET /api/posts/my error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
