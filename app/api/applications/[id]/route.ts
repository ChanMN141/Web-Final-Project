import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import Application from '@/models/Application';
import ServicePost from '@/models/ServicePost';
import { getSession, unauthorizedResponse } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

const UpdateStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

// PATCH /api/applications/[id] - Update application status (Auth: SEEKER, post owner only)
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

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // Verify the seeker owns the post
    const post = await ServicePost.findById(application.postId);
    if (!post || post.userId.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you do not own this post' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = UpdateStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status } = parseResult.data;

    const updated = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('providerId', 'name email bio');

    // Auto-close the post if application is accepted
    if (status === 'ACCEPTED') {
      await ServicePost.findByIdAndUpdate(application.postId, { status: 'CLOSED' });
    }

    // Notify the provider of the decision
    await createNotification({
      userId: application.providerId.toString(),
      type: 'STATUS_CHANGED',
      title: status === 'ACCEPTED' ? 'Application Accepted!' : 'Application Update',
      message:
        status === 'ACCEPTED'
          ? `Your application for "${post.title}" has been accepted!`
          : `Your application for "${post.title}" was not selected.`,
      link: '/dashboard/provider',
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error('PATCH /api/applications/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/applications/[id] - Withdraw a PENDING application (Auth: PROVIDER, own app only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();
    if (session.role !== 'PROVIDER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (application.providerId.toString() !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: not your application' },
        { status: 403 }
      );
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Only pending applications can be withdrawn' },
        { status: 400 }
      );
    }

    await Application.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('DELETE /api/applications/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
