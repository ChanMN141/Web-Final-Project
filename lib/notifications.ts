import Notification, { NotificationType } from '@/models/Notification';

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await Notification.create(data);
  } catch (error) {
    // Non-critical — log but never fail the parent operation
    console.error('createNotification failed:', error);
  }
}
