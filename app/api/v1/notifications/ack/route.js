import { NextResponse } from 'next/server';
import { db } from '../../_db';

// POST /api/v1/notifications/ack - Acknowledge a notification popup
export async function POST(request) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: { message: 'Notification ID required' } }, { status: 400 });
    }
    const success = db.acknowledgeNotification(id);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
