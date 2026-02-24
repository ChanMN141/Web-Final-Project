import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notification from '@/models/Notification';
import { getSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/notifications — get own notifications with unread count
export async function GET(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const notifications = await Notification.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId: session.userId, read: false });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();

    await connectToDatabase();

    await Notification.updateMany(
      { userId: session.userId, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/notifications — clear all notifications
export async function DELETE(request: Request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorizedResponse();

    await connectToDatabase();
    await Notification.deleteMany({ userId: session.userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
