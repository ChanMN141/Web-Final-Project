import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notification from '@/models/Notification';
import { getSession, unauthorizedResponse } from '@/lib/auth';

// PATCH /api/notifications/[id] — mark a single notification as read
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();

    await connectToDatabase();
    const { id } = await params;

    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notif) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification: notif });
  } catch (error) {
    console.error('PATCH /api/notifications/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
