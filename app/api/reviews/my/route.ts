import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Review from '@/models/Review';
import { getSession, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'SEEKER') {
      return NextResponse.json({ success: false, error: 'Only seekers can view their given reviews' }, { status: 403 });
    }

    await connectToDatabase();

    const reviews = await Review.find({ seekerId: session.userId })
      .populate('providerId', 'name email')
      .populate({
        path: 'applicationId',
        select: 'postId',
        populate: { path: 'postId', select: 'title' }
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('GET /api/reviews/my error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
