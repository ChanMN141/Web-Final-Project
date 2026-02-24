import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import Review from '@/models/Review';
import Application from '@/models/Application';
import ServicePost from '@/models/ServicePost';
import User from '@/models/User';
import { getSession, unauthorizedResponse } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

const CreateReviewSchema = z.object({
  applicationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// GET /api/reviews?providerId=xxx — public, get all reviews for a provider
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ success: false, error: 'providerId is required' }, { status: 400 });
    }

    const reviews = await Review.find({ providerId })
      .populate('seekerId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('GET /api/reviews error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/reviews — seeker creates a review for an accepted application
export async function POST(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'SEEKER') {
      return NextResponse.json({ success: false, error: 'Only seekers can write reviews' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const parseResult = CreateReviewSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { applicationId, rating, comment } = parseResult.data;

    // Verify application exists and is ACCEPTED
    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    if (application.status !== 'ACCEPTED') {
      return NextResponse.json({ success: false, error: 'Can only review accepted applications' }, { status: 400 });
    }

    // Verify seeker owns the post
    const post = await ServicePost.findById(application.postId);
    if (!post || post.userId.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Check duplicate
    const existing = await Review.findOne({ applicationId });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Review already submitted for this application' }, { status: 409 });
    }

    const review = await Review.create({
      seekerId: session.userId,
      providerId: application.providerId,
      applicationId,
      rating,
      comment,
    });

    // Recalculate provider average rating
    const stats = await Review.aggregate([
      { $match: { providerId: application.providerId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await User.findByIdAndUpdate(application.providerId, {
        averageRating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    // Notify provider
    const seeker = await User.findById(session.userId).select('name');
    await createNotification({
      userId: application.providerId.toString(),
      type: 'NEW_REVIEW',
      title: 'You received a new review',
      message: `${seeker?.name ?? 'A seeker'} left you a ${rating}-star review.`,
      link: '/dashboard/provider',
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json({ success: false, error: 'Review already submitted' }, { status: 409 });
    }
    console.error('POST /api/reviews error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
