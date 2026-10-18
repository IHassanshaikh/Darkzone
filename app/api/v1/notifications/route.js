import { NextResponse } from 'next/server';
import { db } from '../_db';

// GET /api/v1/notifications - Polled by all views for real-time alert popups
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all';
    const volunteerId = searchParams.get('volunteerId') || null;

    const unacked = db.getNotifications(role, volunteerId);

    return NextResponse.json({
      data: unacked,
      meta: { unreadCount: unacked.length, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

// POST /api/v1/notifications - Manually broadcast an alert
export async function POST(request) {
  try {
    const body = await request.json();
    const notif = db.broadcastNotification(body);
    return NextResponse.json({ data: notif }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
