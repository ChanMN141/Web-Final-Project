import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';
import { getSession, unauthorizedResponse } from '@/lib/auth';

// DELETE /api/reviews/[id] — seeker deletes own review
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();

    await connectToDatabase();
    const { id } = await params;

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }
    if (review.seekerId.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const providerId = review.providerId;
    await Review.findByIdAndDelete(id);

    // Recalculate provider rating
    const stats = await Review.aggregate([
      { $match: { providerId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await User.findByIdAndUpdate(providerId, {
      averageRating: stats.length > 0 ? Math.round(stats[0].avg * 10) / 10 : 0,
      reviewCount: stats.length > 0 ? stats[0].count : 0,
    });

    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('DELETE /api/reviews/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
